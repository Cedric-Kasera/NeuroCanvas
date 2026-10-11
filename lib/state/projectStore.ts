import { create } from 'zustand';
import { ProjectDefinition, PROJECTS } from '@/lib/content/projects';
import { SerializedCanvas } from '@/lib/persistence/schema';
import {
  checkRequirement,
  CheckResult,
  RunRecord,
  computeIntegrityHash,
  generateCompletionCode,
} from '@/lib/engine/projectChecks';
import { db } from '@/lib/persistence/db';

export interface ProjectState {
  currentProject: ProjectDefinition | null;
  activeCanvas: SerializedCanvas | null;
  requirementResults: Record<string, CheckResult>;
  reflections: Record<string, string>;
  runRecords: RunRecord[];
  activeTab: 'brief' | 'dataset' | 'runs' | 'reflections';
  completedTier: 'bronze' | 'silver' | 'gold' | null;
  isFinished: boolean;
  completionCode: string | null;
  integrityHash: string | null;
  isChecking: boolean;

  // Actions
  loadProject: (projectOrId: string | ProjectDefinition) => Promise<void>;
  updateActiveCanvas: (canvas: SerializedCanvas) => void;
  checkAllRequirements: () => Promise<void>;
  updateReflection: (reflectionId: string, text: string) => void;
  logRunRecord: (record: Omit<RunRecord, 'id' | 'projectId' | 'ts'>) => Promise<void>;
  setActiveTab: (tab: 'brief' | 'dataset' | 'runs' | 'reflections') => void;
  resetProject: () => Promise<void>;
  finishProject: () => Promise<{ completionCode: string; hash: string }>;
  exportProjectFile: () => Promise<string>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  currentProject: null,
  activeCanvas: null,
  requirementResults: {},
  reflections: {},
  runRecords: [],
  activeTab: 'brief',
  completedTier: null,
  isFinished: false,
  completionCode: null,
  integrityHash: null,
  isChecking: false,

  loadProject: async (projectOrId) => {
    let proj: ProjectDefinition | undefined;
    if (typeof projectOrId === 'string') {
      proj = PROJECTS.find((p) => p.id === projectOrId);
    } else {
      proj = projectOrId;
    }

    if (!proj) return;

    // Load saved progress from Dexie if available
    let canvasToUse = JSON.parse(JSON.stringify(proj.starterCanvas));
    let savedReflections: Record<string, string> = {};
    let savedRuns: RunRecord[] = [];
    let savedTier: 'bronze' | 'silver' | 'gold' | null = null;
    let savedCode: string | null = null;

    try {
      const saved = await db.projectProgress.get(proj.id);
      if (saved && saved.canvas) {
        canvasToUse = saved.canvas;
        savedTier = saved.tierBest || null;
        savedCode = saved.completionCode || null;
      }
      const refRows = await db.reflections.where('projectId').equals(proj.id).toArray();
      for (const row of refRows) {
        savedReflections[row.reflectionId] = row.text;
      }
      savedRuns = await db.runRecords.where('projectId').equals(proj.id).toArray();
    } catch {
      // In-memory fallback
    }

    set({
      currentProject: proj,
      activeCanvas: canvasToUse,
      reflections: savedReflections,
      runRecords: savedRuns,
      completedTier: savedTier,
      completionCode: savedCode,
      isFinished: !!savedCode,
      activeTab: 'brief',
    });

    await get().checkAllRequirements();
  },

  updateActiveCanvas: (canvas) => {
    set({ activeCanvas: canvas });
    const { currentProject } = get();
    if (currentProject) {
      // Autosave to DB
      db.projectProgress
        .put({
          projectId: currentProject.id,
          version: currentProject.version,
          canvas,
          tierBest: get().completedTier,
          startedAt: new Date().toISOString(),
        })
        .catch(() => {});
    }
  },

  checkAllRequirements: async () => {
    const { currentProject, activeCanvas, runRecords, reflections } = get();
    if (!currentProject || !activeCanvas) return;

    set({ isChecking: true });

    const results: Record<string, CheckResult> = {};
    const ctx = {
      canvas: activeCanvas,
      dataset: currentProject.dataset,
      runRecords,
      reflections,
    };

    for (const req of currentProject.requirements) {
      results[req.id] = checkRequirement(req, ctx);
    }

    // Determine highest unlocked tier
    let bestTier: 'bronze' | 'silver' | 'gold' | null = null;

    if (currentProject.tiers && currentProject.tiers.length > 0) {
      for (const tier of currentProject.tiers) {
        const allPass = tier.requirementIds.every((id) => results[id]?.passed);
        if (allPass) {
          bestTier = tier.id;
        }
      }
    } else {
      const allPass = currentProject.requirements.every((r) => results[r.id]?.passed);
      if (allPass) bestTier = 'gold';
    }

    set({
      requirementResults: results,
      completedTier: bestTier,
      isChecking: false,
    });
  },

  updateReflection: (reflectionId, text) => {
    const { currentProject, reflections } = get();
    const updated = { ...reflections, [reflectionId]: text };
    set({ reflections: updated });

    if (currentProject) {
      db.reflections
        .put({
          id: `${currentProject.id}_${reflectionId}`,
          projectId: currentProject.id,
          reflectionId,
          text,
          updatedAt: new Date().toISOString(),
        })
        .catch(() => {});
    }

    get().checkAllRequirements();
  },

  logRunRecord: async (recordData) => {
    const { currentProject, runRecords } = get();
    if (!currentProject) return;

    const newRecord: RunRecord = {
      ...recordData,
      projectId: currentProject.id,
      ts: new Date().toISOString(),
    };

    try {
      const id = await db.runRecords.add(newRecord as any);
      newRecord.id = id;
    } catch {
      newRecord.id = Date.now();
    }

    set({ runRecords: [...runRecords, newRecord] });
    await get().checkAllRequirements();
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  resetProject: async () => {
    const { currentProject } = get();
    if (!currentProject) return;

    const freshCanvas = JSON.parse(JSON.stringify(currentProject.starterCanvas));
    set({
      activeCanvas: freshCanvas,
      isFinished: false,
      completionCode: null,
    });

    await get().checkAllRequirements();
  },

  finishProject: async () => {
    const { currentProject, activeCanvas, runRecords, reflections, requirementResults, completedTier } = get();
    if (!currentProject || !activeCanvas) {
      throw new Error('No active project to finish');
    }

    const tier = completedTier || 'bronze';

    const rawExport = {
      app: 'neurocanvas',
      kind: 'project-result',
      schemaVersion: 1,
      project: { id: currentProject.id, version: currentProject.version, title: currentProject.title },
      tier,
      canvas: activeCanvas,
      runRecords,
      reflections,
      results: Object.entries(requirementResults).map(([id, r]) => ({ id, passed: r.passed, detail: r.detail })),
      createdAt: new Date().toISOString(),
    };

    const hash = await computeIntegrityHash(rawExport);
    const code = generateCompletionCode(currentProject.id, tier, hash);

    set({
      isFinished: true,
      completionCode: code,
      integrityHash: hash,
    });

    // Save completion state
    try {
      await db.projectProgress.put({
        projectId: currentProject.id,
        version: currentProject.version,
        canvas: activeCanvas,
        tierBest: tier,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        completionCode: code,
      });
    } catch {}

    return { completionCode: code, hash };
  },

  exportProjectFile: async () => {
    const { currentProject, activeCanvas, runRecords, reflections, requirementResults, completedTier } = get();
    if (!currentProject || !activeCanvas) return '{}';

    const tier = completedTier || 'bronze';
    const basePayload = {
      app: 'neurocanvas',
      kind: 'project-result',
      schemaVersion: 1,
      project: { id: currentProject.id, version: currentProject.version, title: currentProject.title },
      tier,
      canvas: activeCanvas,
      runRecords,
      reflections,
      results: Object.entries(requirementResults).map(([id, r]) => ({ id, passed: r.passed, detail: r.detail })),
      createdAt: new Date().toISOString(),
    };

    const hash = await computeIntegrityHash(basePayload);
    const fullFile = {
      ...basePayload,
      integrity: {
        alg: 'SHA-256',
        hash,
        scope: 'canonical JSON without integrity',
      },
    };

    return JSON.stringify(fullFile, null, 2);
  },
}));

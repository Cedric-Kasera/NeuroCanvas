import Dexie, { type Table } from 'dexie';
import { SerializedCanvas, LessonProgress } from './schema';

export interface AutosaveRow {
  key: string;
  canvas: SerializedCanvas;
  updatedAt: string;
}

export interface SettingsRow {
  key: string;
  value: any;
}

export interface ProjectProgressRow {
  projectId: string;
  version: number;
  canvas: SerializedCanvas;
  tierBest?: 'bronze' | 'silver' | 'gold' | null;
  startedAt: string;
  completedAt?: string;
  completionCode?: string;
}

export interface ReflectionRow {
  id: string; // `${projectId}_${reflectionId}`
  projectId: string;
  reflectionId: string;
  text: string;
  updatedAt: string;
}

export interface GameStatRow {
  game: string;
  plays: number;
  bestStars: number;
  lastPlayed: string;
}

export interface DailyResultRow {
  dateKey: string;
  stars: number;
  completedAt: string;
}

export interface ExperimentProgressRow {
  experimentId: string;
  completed: boolean;
  completedAt?: string;
}

export class NeuroCanvasDB extends Dexie {
  canvases!: Table<SerializedCanvas, string>;
  autosave!: Table<AutosaveRow, string>;
  lessonProgress!: Table<LessonProgress, string>;
  settings!: Table<SettingsRow, string>;
  projectProgress!: Table<ProjectProgressRow, string>;
  runRecords!: Table<any, number>;
  reflections!: Table<ReflectionRow, string>;
  assignments!: Table<any, string>;
  gameStats!: Table<GameStatRow, string>;
  dailyResults!: Table<DailyResultRow, string>;
  experimentProgress!: Table<ExperimentProgressRow, string>;

  constructor() {
    super('neurocanvas_db');
    this.version(1).stores({
      canvases: 'id, name, updatedAt',
      autosave: 'key',
      lessonProgress: 'lessonId',
      settings: 'key',
    });
    this.version(2).stores({
      projectProgress: 'projectId',
      runRecords: '++id, projectId, ts',
      reflections: 'id, projectId',
      assignments: 'id',
      gameStats: 'game',
      dailyResults: 'dateKey',
      experimentProgress: 'experimentId',
    });
  }
}

// Singleton database instance
export const db = new NeuroCanvasDB();

// Safe storage caller with in-memory fallback
let storageAvailable = true;

export async function requestPersistentStorage(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }
  return false;
}

export async function saveAutosave(canvas: SerializedCanvas): Promise<void> {
  try {
    await db.autosave.put({
      key: 'current',
      canvas,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    storageAvailable = false;
    console.warn('Autosave to IndexedDB failed; fallback to in-memory.', err);
  }
}

export async function loadAutosave(): Promise<SerializedCanvas | null> {
  try {
    const row = await db.autosave.get('current');
    return row ? row.canvas : null;
  } catch (err) {
    console.warn('Load autosave failed', err);
    return null;
  }
}

export async function saveNamedCanvas(canvas: SerializedCanvas): Promise<string> {
  const id = canvas.id || `canvas_${Date.now()}`;
  const record: SerializedCanvas = {
    ...canvas,
    id,
    updatedAt: new Date().toISOString(),
  };
  await db.canvases.put(record);
  await requestPersistentStorage();
  return id;
}

export async function listSavedCanvases(): Promise<SerializedCanvas[]> {
  try {
    return await db.canvases.orderBy('updatedAt').reverse().toArray();
  } catch {
    return [];
  }
}

export async function deleteSavedCanvas(id: string): Promise<void> {
  await db.canvases.delete(id);
}

export async function getLessonProgress(lessonId: string): Promise<LessonProgress | null> {
  try {
    const p = await db.lessonProgress.get(lessonId);
    return p || null;
  } catch {
    return null;
  }
}

export async function saveLessonProgress(progress: LessonProgress): Promise<void> {
  try {
    await db.lessonProgress.put(progress);
  } catch (err) {
    console.warn('Could not save lesson progress to IndexedDB', err);
  }
}

export async function getAllLessonProgress(): Promise<Record<string, LessonProgress>> {
  try {
    const all = await db.lessonProgress.toArray();
    const map: Record<string, LessonProgress> = {};
    for (const item of all) {
      map[item.lessonId] = item;
    }
    return map;
  } catch {
    return {};
  }
}

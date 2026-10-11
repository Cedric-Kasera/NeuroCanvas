'use client';

import React, { useState } from 'react';
import {
  Award,
  Flame,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowLeft,
  X,
  Play,
  HelpCircle,
  ExternalLink,
  Target,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useProjectStore } from '@/lib/state/projectStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { useGameStore } from '@/lib/state/gameStore';

export function ActivityHUD() {
  const activeCanvasMode = useUIStore((s) => s.activeCanvasMode);
  const activeCanvasTitle = useUIStore((s) => s.activeCanvasTitle);
  const setActiveCanvasMode = useUIStore((s) => s.setActiveCanvasMode);
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const showToast = useUIStore((s) => s.showToast);

  // Project store hooks
  const currentProject = useProjectStore((s) => s.currentProject);
  const requirementResults = useProjectStore((s) => s.requirementResults);
  const updateActiveCanvas = useProjectStore((s) => s.updateActiveCanvas);
  const checkAllRequirements = useProjectStore((s) => s.checkAllRequirements);

  // Canvas store
  const serialize = useCanvasStore((s) => s.serialize);
  const loadCanvas = useCanvasStore((s) => s.loadCanvas);
  const buildFromCanvas = useSimStore((s) => s.buildFromCanvas);

  const [isChecklistExpanded, setIsChecklistExpanded] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  // If in free mode or no activity, render nothing
  if (!activeCanvasMode || activeCanvasMode === 'free') {
    return null;
  }

  // Handle checking project requirements live from canvas
  const handleCheckProject = async () => {
    setIsChecking(true);
    try {
      const currentCanvas = serialize();
      updateActiveCanvas(currentCanvas);
      await checkAllRequirements();

      const results = useProjectStore.getState().requirementResults;
      const total = Object.keys(results).length;
      const passed = Object.values(results).filter((r) => r.passed).length;

      if (passed === total && total > 0) {
        showToast(`All ${passed}/${total} requirements satisfied! You are ready to certify!`, 'success');
      } else {
        showToast(`Checked: ${passed}/${total} requirements satisfied.`, 'info');
      }
    } catch {
      showToast('Error verifying requirements.', 'error');
    } finally {
      setIsChecking(false);
    }
  };

  // Handle returning to detailed brief
  const handleReturnToBrief = () => {
    const currentCanvas = serialize();
    if (activeCanvasMode === 'project') {
      updateActiveCanvas(currentCanvas);
      setCurrentRoute('project-detail');
    } else if (activeCanvasMode === 'experiment') {
      setCurrentRoute('experiment-detail');
    } else if (activeCanvasMode === 'assignment') {
      setCurrentRoute('assignment');
    } else if (activeCanvasMode === 'game') {
      setCurrentRoute('games');
    } else {
      setCurrentRoute('play');
    }
  };

  // Handle resetting starter canvas
  const handleResetStarter = () => {
    if (activeCanvasMode === 'project' && currentProject) {
      loadCanvas(JSON.parse(JSON.stringify(currentProject.starterCanvas)));
      buildFromCanvas();
      showToast('Project canvas reset to initial starter setup.', 'info');
    } else {
      showToast('Resetting current exercise setup.', 'info');
    }
  };

  const getModeBadge = () => {
    switch (activeCanvasMode) {
      case 'project':
        return {
          icon: <Award size={14} className="text-[#cc785c]" />,
          label: 'PROJECT LAB',
          color: 'bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30',
        };
      case 'experiment':
        return {
          icon: <Flame size={14} className="text-[#cc785c]" />,
          label: 'EXPERIMENT LAB',
          color: 'bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30',
        };
      case 'game':
        return {
          icon: <Sparkles size={14} className="text-[#5db8a6]" />,
          label: 'NEURAL GAME',
          color: 'bg-[#5db8a6]/10 text-[#5db8a6] border-[#5db8a6]/30',
        };
      case 'assignment':
        return {
          icon: <GraduationCap size={14} className="text-[#cc785c]" />,
          label: 'ASSIGNMENT',
          color: 'bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30',
        };
      default:
        return {
          icon: <Target size={14} className="text-[#8e8b82]" />,
          label: 'STUDIO TASK',
          color: 'bg-stone-100 text-stone-700 border-stone-200',
        };
    }
  };

  const badge = getModeBadge();

  // Progress count if in project mode
  let projectPassed = 0;
  let projectTotal = 0;
  if (activeCanvasMode === 'project' && currentProject) {
    projectTotal = currentProject.requirements.length;
    projectPassed = currentProject.requirements.filter(
      (r) => requirementResults[r.id]?.passed
    ).length;
  }

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none w-full max-w-3xl px-4">
      {/* Main Floating Banner Bar */}
      <div className="pointer-events-auto bg-[#faf9f5]/95 dark:bg-[#1f1e1b]/95 backdrop-blur-md border border-[#e6dfd8] dark:border-[#383531] shadow-lg rounded-2xl p-1.5 sm:px-3 sm:py-2 flex items-center justify-between gap-3 w-full transition-all">
        {/* Left: Mode Badge & Title */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${badge.color}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </div>

          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold text-[#141413] dark:text-[#faf9f5] truncate">
              {activeCanvasTitle || (currentProject?.title ?? 'Active Canvas Task')}
            </span>
            {activeCanvasMode === 'project' && (
              <span className="text-[10px] text-[#8e8b82]">
                Goals: {projectPassed}/{projectTotal} satisfied
              </span>
            )}
          </div>
        </div>

        {/* Center/Right Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs">
          {activeCanvasMode === 'project' && (
            <>
              <button
                onClick={handleCheckProject}
                disabled={isChecking}
                className="px-2.5 py-1 rounded-xl bg-white dark:bg-[#2a2926] border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#33312c] font-medium text-[11px] transition-colors flex items-center gap-1 shadow-xs"
                title="Verify requirements on current network"
              >
                <CheckCircle2 size={12} className="text-[#5db8a6]" />
                <span className="hidden sm:inline">Check Work</span>
              </button>

              <button
                onClick={() => setIsChecklistExpanded(!isChecklistExpanded)}
                className={`px-2 py-1 rounded-xl border text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  isChecklistExpanded
                    ? 'bg-[#cc785c] text-white border-[#cc785c]'
                    : 'bg-white dark:bg-[#2a2926] border-[#e6dfd8] dark:border-[#383531] text-[#6c6a64] dark:text-[#a09d96]'
                }`}
                title="Toggle Goals Checklist"
              >
                <span>Goals ({projectPassed}/{projectTotal})</span>
                {isChecklistExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            </>
          )}

          <button
            onClick={handleResetStarter}
            className="p-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#2a2926] text-[#8e8b82] hover:text-[#141413] dark:hover:text-white transition-colors"
            title="Reset Starter Canvas"
          >
            <RotateCcw size={12} />
          </button>

          <button
            onClick={handleReturnToBrief}
            className="px-2.5 py-1 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-xs"
            title="Return to detailed brief, runs, and certification"
          >
            <ArrowLeft size={12} />
            <span className="hidden md:inline">Return to Brief</span>
            <span className="md:hidden">Brief</span>
          </button>

          <button
            onClick={() => setActiveCanvasMode('free')}
            className="p-1 rounded-lg text-[#8e8b82] hover:text-[#141413] dark:hover:text-white transition-colors"
            title="Exit Activity Mode to Free Studio"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Floating Goals Drawer (Collapsible) */}
      {isChecklistExpanded && activeCanvasMode === 'project' && currentProject && (
        <div className="pointer-events-auto mt-2 w-full max-w-xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] rounded-2xl shadow-xl p-4 flex flex-col gap-3 animate-in fade-in duration-150 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#e6dfd8] dark:border-[#2a2926]">
            <div>
              <h4 className="text-xs font-bold text-[#141413] dark:text-[#faf9f5]">
                {currentProject.title} — Active Requirements
              </h4>
              <p className="text-[11px] text-[#8e8b82]">
                Tweak nodes and weights on the canvas, then test with &quot;Check Work&quot;.
              </p>
            </div>
            <button
              onClick={handleCheckProject}
              className="px-2.5 py-1 rounded-lg bg-[#5db8a6] hover:bg-[#4ea594] text-white text-[11px] font-semibold flex items-center gap-1 transition-colors"
            >
              <CheckCircle2 size={11} />
              <span>Verify Now</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {currentProject.requirements.map((req, idx) => {
              const res = requirementResults[req.id];
              const passed = res?.passed;

              return (
                <div
                  key={req.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 transition-colors ${
                    passed
                      ? 'bg-[#5db8a6]/10 border-[#5db8a6]/30 text-[#141413] dark:text-[#faf9f5]'
                      : 'bg-[#faf9f5] dark:bg-[#252320] border-[#e6dfd8] dark:border-[#383531] text-[#6c6a64] dark:text-[#a09d96]'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {passed ? (
                      <CheckCircle2 size={14} className="text-[#5db8a6]" />
                    ) : (
                      <XCircle size={14} className="text-[#8e8b82]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[11px] leading-tight">
                      Goal {idx + 1}: {req.label}
                    </div>
                    {res?.detail && (
                      <div className="text-[10px] text-[#8e8b82] font-mono mt-0.5">
                        {res.detail}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {currentProject.hints && currentProject.hints.length > 0 && (
            <div className="mt-1 pt-2 border-t border-[#e6dfd8] dark:border-[#2a2926] text-[11px] text-[#8e8b82] flex items-center gap-1.5">
              <HelpCircle size={12} className="text-[#cc785c] shrink-0" />
              <span>Tip: {currentProject.hints[0]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

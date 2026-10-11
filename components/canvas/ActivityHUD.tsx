'use client';

import React from 'react';
import {
  Award,
  Flame,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  ArrowLeft,
  X,
  Target,
  PanelRightOpen,
  RotateCcw,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useProjectStore } from '@/lib/state/projectStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';

export function ActivityHUD() {
  const activeCanvasMode = useUIStore((s) => s.activeCanvasMode);
  const activeCanvasTitle = useUIStore((s) => s.activeCanvasTitle);
  const setActiveCanvasMode = useUIStore((s) => s.setActiveCanvasMode);
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const setRightOpen = useUIStore((s) => s.setRightOpen);
  const setRightTab = useUIStore((s) => s.setRightTab);
  const rightOpen = useUIStore((s) => s.rightOpen);
  const rightTab = useUIStore((s) => s.rightTab);

  const currentProject = useProjectStore((s) => s.currentProject);
  const requirementResults = useProjectStore((s) => s.requirementResults);
  const updateActiveCanvas = useProjectStore((s) => s.updateActiveCanvas);

  const serialize = useCanvasStore((s) => s.serialize);

  // If in free mode or no activity, render nothing
  if (!activeCanvasMode || activeCanvasMode === 'free') {
    return null;
  }

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

  const openActivitySidebar = () => {
    setRightOpen(true);
    setRightTab('activity');
  };

  const getModeBadge = () => {
    switch (activeCanvasMode) {
      case 'project':
        return {
          icon: <Award size={13} className="text-[#cc785c]" />,
          label: 'PROJECT',
          color: 'bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30',
        };
      case 'experiment':
        return {
          icon: <Flame size={13} className="text-[#cc785c]" />,
          label: 'EXPERIMENT',
          color: 'bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30',
        };
      case 'game':
        return {
          icon: <Sparkles size={13} className="text-[#5db8a6]" />,
          label: 'GAME',
          color: 'bg-[#5db8a6]/10 text-[#5db8a6] border-[#5db8a6]/30',
        };
      case 'assignment':
        return {
          icon: <GraduationCap size={13} className="text-[#cc785c]" />,
          label: 'ASSIGNMENT',
          color: 'bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30',
        };
      default:
        return {
          icon: <Target size={13} className="text-[#8e8b82]" />,
          label: 'TASK',
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

  const isSidebarFocused = rightOpen && rightTab === 'activity';

  return (
    <div className="absolute top-2 left-4 z-20 pointer-events-none select-none max-w-[calc(100vw-360px)]">
      {/* Sleek, Non-Blocking Pill that leaves canvas 100% visible */}
      <div className="pointer-events-auto bg-[#faf9f5]/90 dark:bg-[#1f1e1b]/90 backdrop-blur-md border border-[#e6dfd8] dark:border-[#383531] shadow-xs rounded-xl px-2.5 py-1.5 flex items-center gap-2.5 transition-all">
        {/* Mode Badge */}
        <div
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[10px] font-mono font-bold uppercase tracking-wider shrink-0 ${badge.color}`}
        >
          {badge.icon}
          <span className="hidden sm:inline">{badge.label}</span>
        </div>

        {/* Title & Goal Status */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-[#141413] dark:text-[#faf9f5] truncate max-w-[160px] sm:max-w-[220px]">
            {activeCanvasTitle || (currentProject?.title ?? 'Active Canvas Task')}
          </span>

          {activeCanvasMode === 'project' && projectTotal > 0 && (
            <span
              className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold shrink-0 ${
                projectPassed === projectTotal
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-[#efe9de] dark:bg-[#252320] text-[#8e8b82]'
              }`}
            >
              {projectPassed}/{projectTotal} Goals
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 text-xs pl-1 border-l border-[#e6dfd8]/70 dark:border-[#383531]/70">
          <button
            onClick={openActivitySidebar}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors ${
              isSidebarFocused
                ? 'bg-[#cc785c] text-white shadow-2xs'
                : 'bg-white dark:bg-[#2a2926] border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#33312c] text-[#141413] dark:text-[#faf9f5]'
            }`}
            title="Open Goals, Requirements and Live Controls in Right Sidebar"
          >
            <PanelRightOpen size={12} />
            <span className="hidden sm:inline">Tasks & Goals</span>
          </button>

          <button
            onClick={handleReturnToBrief}
            className="px-2 py-1 rounded-lg bg-white dark:bg-[#2a2926] border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#33312c] text-[11px] font-medium text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413] dark:hover:text-white transition-colors flex items-center gap-1"
            title="Return to Brief View"
          >
            <ArrowLeft size={12} />
            <span className="hidden md:inline">Return</span>
          </button>

          <button
            onClick={() => setActiveCanvasMode('free')}
            className="p-1 rounded-md text-[#8e8b82] hover:text-[#141413] dark:hover:text-white transition-colors"
            title="Exit Task Mode"
          >
            <X size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

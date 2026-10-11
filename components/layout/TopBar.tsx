'use client';

import React, { useState } from 'react';
import {
  Undo2,
  Redo2,
  Share2,
  Download,
  Sun,
  Moon,
  HelpCircle,
  Menu,
  BookOpen,
  Sparkles,
  Award,
  Flame,
  ChevronDown,
} from 'lucide-react';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useUIStore } from '@/lib/state/uiStore';
import { useSimStore } from '@/lib/state/simStore';
import { useLessonStore } from '@/lib/state/lessonStore';
import { PWAInstallButton } from '@/components/ui/PWAInstallButton';
import { AppLogo } from '@/components/ui/AppLogo';

export function TopBar() {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const canvasName = useCanvasStore((s) => s.canvasName);
  const setCanvasName = useCanvasStore((s) => s.setCanvasName);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const historyIndex = useCanvasStore((s) => s.historyIndex);
  const history = useCanvasStore((s) => s.history);

  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const currentRoute = useUIStore((s) => s.currentRoute);
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);

  const leftOpen = useUIStore((s) => s.leftOpen);
  const setLeftOpen = useUIStore((s) => s.setLeftOpen);
  const rightOpen = useUIStore((s) => s.rightOpen);
  const setRightOpen = useUIStore((s) => s.setRightOpen);

  const setShareModalOpen = useUIStore((s) => s.setShareModalOpen);
  const setExportModalOpen = useUIStore((s) => s.setExportModalOpen);
  const setShortcutsModalOpen = useUIStore((s) => s.setShortcutsModalOpen);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <header className="h-14 border-b border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] px-4 flex items-center justify-between gap-4 z-40 select-none">
      {/* Zone 1: Brand & Project Name */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setLeftOpen(!leftOpen)}
          className="p-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
          title="Toggle library sidebar"
        >
          <Menu size={18} />
        </button>

        {/* Brand Lockup */}
        <div
          onClick={() => setCurrentRoute('landing')}
          className="flex items-center gap-2 cursor-pointer group"
          title="Return to NeuroCanvas home"
        >
          <AppLogo className="h-6 w-auto" />
          <span className="font-serif text-lg font-medium text-[#141413] dark:text-[#faf9f5] tracking-tight">
            NeuroCanvas
          </span>
        </div>

        <span className="text-[#e6dfd8] dark:text-[#383531] hidden sm:inline">/</span>

        {/* Editable Project Name */}
        <input
          type="text"
          value={canvasName}
          onChange={(e) => setCanvasName(e.target.value)}
          className="hidden md:inline-block bg-transparent text-xs font-medium text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413] dark:hover:text-[#faf9f5] focus:text-[#141413] dark:focus:text-[#faf9f5] border-b border-transparent hover:border-[#e6dfd8] focus:border-[#cc785c] outline-none px-1 py-0.5 max-w-[180px] transition-colors"
        />
      </div>

      {/* Zone 2: Navigation & Navigation Pills */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center bg-[#efe9de] dark:bg-[#252320] rounded-xl p-0.5 text-xs font-medium">
          <button
            onClick={() => setCurrentRoute('learn')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
              currentRoute === 'learn'
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            <BookOpen size={13} className="text-[#cc785c]" />
            <span>Lessons</span>
          </button>
          <button
            onClick={() => setCurrentRoute('projects')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
              currentRoute === 'projects' || currentRoute === 'project-detail'
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            <Award size={13} className="text-[#cc785c]" />
            <span>Projects</span>
          </button>
          <button
            onClick={() => setCurrentRoute('lab')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
              currentRoute === 'lab' || currentRoute === 'experiment-detail'
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            <Flame size={13} className="text-[#cc785c]" />
            <span>Lab</span>
          </button>
          <button
            onClick={() => setCurrentRoute('games')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
              currentRoute === 'games'
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            <Sparkles size={13} className="text-[#5db8a6]" />
            <span>Games</span>
          </button>
          <button
            onClick={() => {
              useLessonStore.getState().clearLesson();
              useCanvasStore.getState().loadCanvas({
                app: 'neurocanvas',
                schemaVersion: 2,
                name: 'Free Play Canvas',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                viewport: { x: 100, y: 100, zoom: 1 },
                settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
                nodes: [],
                edges: [],
                layers: [],
              });
              useSimStore.getState().buildFromCanvas();
              setCurrentRoute('play');
            }}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors ${
              currentRoute === 'play'
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            <span>Studio</span>
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 bg-[#efe9de] dark:bg-[#252320] rounded-xl p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#1f1e1b] disabled:opacity-30 text-[#141413] dark:text-[#faf9f5] transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-[#1f1e1b] disabled:opacity-30 text-[#141413] dark:text-[#faf9f5] transition-colors"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Beginner vs Student Mode */}
        <button
          onClick={() => setMode(mode === 'beginner' ? 'student' : 'beginner')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium border border-[#e6dfd8] dark:border-[#383531] hover:border-[#cc785c] transition-colors text-[#6c6a64] dark:text-[#a09d96]"
          title="Toggle math depth and formulas"
        >
          <span>Mode:</span>
          <strong className="text-[#cc785c] capitalize">{mode}</strong>
        </button>
      </div>

      {/* Zone 3: Actions & Controls */}
      <div className="flex items-center gap-2">
        <PWAInstallButton />

        {/* Share Button */}
        <button
          onClick={() => setShareModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-medium shadow-xs transition-colors"
        >
          <Share2 size={13} />
          <span className="hidden sm:inline">Share</span>
        </button>

        {/* Export Modal Toggle */}
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
          title="Export JSON or Image"
        >
          <Download size={14} />
          <span className="hidden md:inline">Export</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-1.5 rounded-xl hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
          title="Toggle dark/light mode"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Keyboard Shortcuts */}
        <button
          onClick={() => setShortcutsModalOpen(true)}
          className="p-1.5 rounded-xl hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
          title="Keyboard shortcuts (?)"
        >
          <HelpCircle size={16} />
        </button>

        {/* Right Sidebar toggle */}
        <button
          onClick={() => setRightOpen(!rightOpen)}
          className={`p-1.5 rounded-xl transition-colors ${
            rightOpen
              ? 'bg-[#efe9de] dark:bg-[#252320] text-[#cc785c]'
              : 'hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96]'
          }`}
          title="Toggle inspector panel"
        >
          <BookOpen size={16} />
        </button>
      </div>
    </header>
  );
}

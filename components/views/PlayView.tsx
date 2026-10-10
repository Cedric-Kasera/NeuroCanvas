'use client';

import React, { useEffect, useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { LeftSidebar } from '@/components/sidebars/LeftSidebar';
import { RightSidebar } from '@/components/sidebars/RightSidebar';
import { CanvasView } from '@/components/canvas/CanvasView';
import { SimulationBar } from '@/components/canvas/SimulationBar';
import { ShortcutsModal } from '@/components/ui/ShortcutsModal';
import { ShareModal } from '@/components/ui/ShareModal';
import { ExportModal } from '@/components/ui/ExportModal';
import { LessonCompleteModal } from '@/components/ui/LessonCompleteModal';
import { GuideModal } from '@/components/ui/GuideModal';
import { ToastContainer } from '@/components/ui/ToastContainer';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { useUIStore } from '@/lib/state/uiStore';
import { useLessonStore } from '@/lib/state/lessonStore';
import { loadAutosave } from '@/lib/persistence/db';
import { decodeCanvasFromPayload } from '@/lib/persistence/share';
import { SerializedCanvas } from '@/lib/persistence/schema';
import { Plus, Info, X } from 'lucide-react';

const EMPTY_FREE_PLAY_CANVAS: SerializedCanvas = {
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
};

export function PlayView() {
  const [isSharedBanner, setIsSharedBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash.startsWith('#s=');
  });
  const loadCanvas = useCanvasStore((s) => s.loadCanvas);
  const buildFromCanvas = useSimStore((s) => s.buildFromCanvas);
  const showToast = useUIStore((s) => s.showToast);
  const setLeftOpen = useUIStore((s) => s.setLeftOpen);
  const setRightOpen = useUIStore((s) => s.setRightOpen);
  const leftOpen = useUIStore((s) => s.leftOpen);
  const rightOpen = useUIStore((s) => s.rightOpen);
  const initializeProgress = useLessonStore((s) => s.initializeProgress);

  useEffect(() => {
    // 1. Initialize persistent lesson progress from IndexedDB
    initializeProgress();

    // 2. Check for shared canvas in hash #s=...
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.startsWith('#s=')) {
        const payload = hash.substring(3);
        const decoded = decodeCanvasFromPayload(payload);
        if (decoded) {
          loadCanvas(decoded);
          showToast('Loaded shared canvas!', 'success');
          return;
        } else {
          showToast('Failed to decode shared link payload.', 'error');
        }
      }
    }

    // 3. Canvas loading strategy
    const initStorage = async () => {
      const lesson = useLessonStore.getState().getCurrentLesson();
      if (lesson) {
        // In lesson: load current step's progressive canvas
        const currentStep = useLessonStore.getState().getCurrentStep();
        loadCanvas(currentStep?.stepCanvas || lesson.startCanvas);
      } else {
        // In Free Play: canvas is empty UNLESS user loads a saved canvas
        const autosaved = await loadAutosave();
        if (
          autosaved &&
          autosaved.nodes &&
          autosaved.nodes.length > 0 &&
          autosaved.name &&
          !autosaved.name.startsWith('Lesson') &&
          autosaved.name !== 'Free Play Canvas'
        ) {
          loadCanvas(autosaved);
        } else {
          loadCanvas(EMPTY_FREE_PLAY_CANVAS);
        }
      }
      buildFromCanvas();
    };

    initStorage();
  }, [loadCanvas, buildFromCanvas, showToast, initializeProgress]);

  return (
    <div className="fixed inset-0 flex flex-col h-screen w-screen overflow-hidden bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5]">
      {/* Top Bar */}
      <TopBar />

      {/* Shared Canvas Notification Banner */}
      {isSharedBanner && (
        <div className="bg-[#cc785c] text-white px-4 py-1.5 text-xs font-medium flex items-center justify-between z-30 shadow-xs">
          <span>You are viewing a shared canvas copy. Save a copy in your library to keep it permanently.</span>
          <button
            onClick={() => setIsSharedBanner(false)}
            className="p-1 hover:opacity-80"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Workspace Frame */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Library Sidebar */}
        <LeftSidebar />

        {/* Center Canvas Area */}
        <main className="flex-1 relative h-full w-full overflow-hidden bg-[#faf9f5] dark:bg-[#141413]">
          <CanvasView />
          <SimulationBar />

          {/* Floating Mobile Action Buttons (<1024px) */}
          <div className="lg:hidden absolute top-4 left-4 z-30 flex items-center gap-2">
            <button
              onClick={() => setLeftOpen(!leftOpen)}
              className="p-2.5 rounded-full bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#383531] shadow-md text-[#cc785c]"
              title="Add Cards"
            >
              <Plus size={18} />
            </button>
            <button
              onClick={() => setRightOpen(!rightOpen)}
              className="p-2.5 rounded-full bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#383531] shadow-md text-[#5db8a6]"
              title="Inspector / Lesson"
            >
              <Info size={18} />
            </button>
          </div>
        </main>

        {/* Right Inspector & Lesson Sidebar */}
        <RightSidebar />
      </div>

      {/* Modals & Overlays */}
      <GuideModal />
      <ShortcutsModal />
      <ShareModal />
      <ExportModal />
      <LessonCompleteModal />
      <ToastContainer />
    </div>
  );
}

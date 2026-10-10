'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Cpu,
  Layers,
  Sliders,
  MousePointer,
  HelpCircle,
  Play,
  Share2,
  CheckCircle2,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useLessonStore } from '@/lib/state/lessonStore';

export function GuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const startLesson = useLessonStore((s) => s.startLesson);
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);

  useEffect(() => {
    // Check local storage for one-time display asynchronously
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined') {
        const hasSeen = localStorage.getItem('neurocanvas_has_seen_guide');
        if (!hasSeen) {
          setIsOpen(true);
        }
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (typeof window !== 'undefined' && dontShowAgain) {
      localStorage.setItem('neurocanvas_has_seen_guide', 'true');
    }
    setIsOpen(false);
  };

  const handleStartLesson1 = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('neurocanvas_has_seen_guide', 'true');
    }
    setIsOpen(false);
    startLesson('neuron');
    setCurrentRoute('play');
  };

  const handleStartFreePlay = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('neurocanvas_has_seen_guide', 'true');
    }
    setIsOpen(false);
    useLessonStore.getState().clearLesson();
    setCurrentRoute('play');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] p-6 shadow-2xl text-[#141413] dark:text-[#faf9f5] space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
          title="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Header Lockup */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#cc785c]">
            <Sparkles size={14} />
            <span>Welcome to NeuroCanvas</span>
          </div>
          <h2 className="font-serif text-2xl md:text-3xl font-medium tracking-tight">
            How This Playground Works
          </h2>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            NeuroCanvas is an interactive visual laboratory designed to build neural network intuition from absolute first principles using real numbers, live step-by-step activations, and printed mathematical formulas.
          </p>
        </div>

        {/* 4 Core Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#cc785c]">
              <div className="w-6 h-6 rounded-lg bg-[#cc785c]/10 flex items-center justify-center">
                <Cpu size={14} />
              </div>
              <span>1. Canvas & Wiring</span>
            </div>
            <p className="text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
              Add circular inputs, neurons, activation functions, and output nodes via the top <strong>+ Add</strong> bar or by right-clicking anywhere. Connect them by dragging from right source handles to left target handles.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#5db8a6]">
              <div className="w-6 h-6 rounded-lg bg-[#5db8a6]/10 flex items-center justify-center">
                <Play size={14} />
              </div>
              <span>2. Live Simulation</span>
            </div>
            <p className="text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
              Use the bottom simulation bar to <strong>Play</strong>, <strong>Pause</strong>, or <strong>Step</strong> through calculations. Watch signals travel across wires with animated pulses, real-time weights, biases, and activation values.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#e8a55a]">
              <div className="w-6 h-6 rounded-lg bg-[#e8a55a]/10 flex items-center justify-center">
                <BookOpen size={14} />
              </div>
              <span>3. Guided Curriculum</span>
            </div>
            <p className="text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
              Open the <strong>Lesson</strong> tab in the right sidebar or visit the Curriculum. Each of the 9 lessons introduces nodes step-by-step, provides textbook formula cards, and tests your understanding with quick quizzes.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] p-3.5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-[#3b82f6]">
              <div className="w-6 h-6 rounded-lg bg-[#3b82f6]/10 flex items-center justify-center">
                <Sliders size={14} />
              </div>
              <span>4. Inspector & Library</span>
            </div>
            <p className="text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
              Click any neuron or connection to tweak biases, activation types, and weights in the <strong>Inspector</strong>. Save your custom networks by name in the <strong>Library</strong> and export PNGs or JSON anytime.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-2 border-t border-[#e6dfd8] dark:border-[#383531] flex flex-col sm:flex-row items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-[#6c6a64] dark:text-[#a09d96] cursor-pointer self-start sm:self-auto">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="rounded accent-[#cc785c] cursor-pointer"
            />
            <span>Don&apos;t show this guide on startup</span>
          </label>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleStartFreePlay}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
            >
              Start Free Play
            </button>
            <button
              onClick={handleStartLesson1}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <BookOpen size={14} />
              <span>Begin Lesson 1</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { useLessonStore } from '@/lib/state/lessonStore';
import { useUIStore } from '@/lib/state/uiStore';
import { LESSONS } from '@/lib/content/lessons';
import { CheckCircle, ArrowRight, RotateCcw, Sparkles } from 'lucide-react';

export function LessonCompleteModal() {
  const isCompletedModalOpen = useLessonStore((s) => s.isCompletedModalOpen);
  const closeCompleteModal = useLessonStore((s) => s.closeCompleteModal);
  const getCurrentLesson = useLessonStore((s) => s.getCurrentLesson);
  const startLesson = useLessonStore((s) => s.startLesson);
  const resetLessonCanvas = useLessonStore((s) => s.resetLessonCanvas);

  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);

  if (!isCompletedModalOpen) return null;

  const current = getCurrentLesson();
  const nextLesson = current ? LESSONS.find((l) => l.order === current.order + 1) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] p-6 shadow-2xl text-center text-[#141413] dark:text-[#faf9f5] space-y-4">
        <div className="w-14 h-14 mx-auto rounded-full bg-[#f0f9f3] dark:bg-[#1f2e24] flex items-center justify-center text-[#5db872]">
          <CheckCircle size={32} />
        </div>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#cc785c]">
            Lesson {current?.order} Complete
          </span>
          <h2 className="font-serif text-xl font-bold mt-1">{current?.title}</h2>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] mt-2 leading-relaxed">
            You’ve mastered this concept! You now understand the intuition, math, and behavior of this stage.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          {nextLesson ? (
            <button
              onClick={() => {
                closeCompleteModal();
                startLesson(nextLesson.id);
              }}
              className="w-full py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-xs font-semibold text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Continue to Lesson {nextLesson.order}: {nextLesson.title.split('. ')[1]}</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={() => {
                closeCompleteModal();
                setCurrentRoute('play');
              }}
              className="w-full py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-xs font-semibold text-white shadow-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Sparkles size={14} />
              <span>All 9 Lessons Completed! Open Free Play</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                closeCompleteModal();
                resetLessonCanvas();
              }}
              className="flex-1 py-2 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors"
            >
              Replay Lesson
            </button>
            <button
              onClick={() => {
                closeCompleteModal();
                setCurrentRoute('play');
              }}
              className="flex-1 py-2 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors"
            >
              Open in Free Play
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

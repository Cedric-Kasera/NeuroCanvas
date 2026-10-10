'use client';

import React from 'react';
import { Sliders, BookOpen, ChevronRight, Sparkles } from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useLessonStore } from '@/lib/state/lessonStore';
import { Inspector } from './Inspector';
import { LessonPanel } from './LessonPanel';

export function RightSidebar() {
  const rightOpen = useUIStore((s) => s.rightOpen);
  const setRightOpen = useUIStore((s) => s.setRightOpen);
  const rightTab = useUIStore((s) => s.rightTab);
  const setRightTab = useUIStore((s) => s.setRightTab);

  const getCurrentLesson = useLessonStore((s) => s.getCurrentLesson);
  const currentLesson = getCurrentLesson();

  if (!rightOpen) return null;

  return (
    <aside className="w-80 shrink-0 border-l border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] flex flex-col z-20 select-none overflow-hidden h-[calc(100vh-3.5rem)]">
      {/* Tab Switcher Header */}
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] px-3 py-2 bg-[#faf9f5] dark:bg-[#181715]">
        <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-1 rounded-lg">
          <button
            onClick={() => setRightTab('inspector')}
            className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-colors ${
              rightTab === 'inspector'
                ? 'bg-white dark:bg-[#1f1e1b] text-[#cc785c] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            <Sliders size={13} />
            <span>Inspector</span>
          </button>
          <button
            onClick={() => setRightTab('lesson')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              rightTab === 'lesson'
                ? 'bg-white dark:bg-[#1f1e1b] text-[#cc785c] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
            title={currentLesson ? `Active: Lesson ${currentLesson.order} - ${currentLesson.title}` : 'Guided Lessons'}
          >
            <BookOpen size={13} />
            <span className="truncate max-w-[110px]">
              {currentLesson ? `L${currentLesson.order}: ${currentLesson.title.replace(/^\d+\.\s*/, '')}` : 'Lesson'}
            </span>
          </button>
        </div>

        <button
          onClick={() => setRightOpen(false)}
          className="p-1 rounded-md hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96]"
          title="Collapse panel"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto">
        {rightTab === 'inspector' ? <Inspector /> : <LessonPanel />}
      </div>
    </aside>
  );
}

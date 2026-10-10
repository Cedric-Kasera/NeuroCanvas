'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/lib/state/uiStore';
import { useLessonStore } from '@/lib/state/lessonStore';
import { LESSONS, Lesson } from '@/lib/content/lessons';
import { AppLogo } from '@/components/ui/AppLogo';
import {
  ArrowLeft,
  CheckCircle2,
  Play,
  Sparkles,
  BookOpen,
  ArrowRight,
  Filter,
  Search,
  Award,
  Layers,
  Cpu,
  TrendingDown,
  Activity,
} from 'lucide-react';

export function LessonListView() {
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const startLesson = useLessonStore((s) => s.startLesson);
  const completedLessons = useLessonStore((s) => s.completedLessons);

  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Lesson difficulty mapping
  const getDifficulty = (order: number): 'beginner' | 'intermediate' | 'advanced' => {
    if (order <= 3) return 'beginner';
    if (order <= 7) return 'intermediate';
    return 'advanced';
  };

  const completedCount = Object.keys(completedLessons).filter((k) => completedLessons[k]).length;
  const progressPercent = Math.round((completedCount / LESSONS.length) * 100);

  const filteredLessons = LESSONS.filter((l) => {
    const diff = getDifficulty(l.order);
    const matchesDiff = filterDifficulty === 'all' || diff === filterDifficulty;
    const matchesSearch =
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.summary.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDiff && matchesSearch;
  });

  return (
    <div className="min-h-screen w-full bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col select-none relative overflow-x-hidden overflow-y-auto font-sans">
      {/* Background Geometric Grid Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.06] bg-[radial-gradient(#141413_1px,transparent_1px)] dark:bg-[radial-gradient(#faf9f5_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* Top Architectural Navigation Bar */}
      <nav className="h-16 shrink-0 sticky top-0 z-30 bg-[#faf9f5]/95 dark:bg-[#141413]/95 backdrop-blur-md border-b border-[#e6dfd8] dark:border-[#2a2926] px-6 max-w-7xl mx-auto w-full flex items-center justify-between">
        <button
          onClick={() => setCurrentRoute('landing')}
          className="flex items-center gap-2 text-xs font-semibold text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413] dark:hover:text-[#faf9f5] transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Studio Overview</span>
        </button>

        <div className="flex items-center gap-2.5">
          <AppLogo className="h-5 w-auto" />
          <span className="font-serif text-sm font-bold">Curriculum Roadmap</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#efe9de] dark:bg-[#252320] text-[#8e8b82]">
            9 Progressive Stages
          </span>
        </div>

        <button
          onClick={() => setCurrentRoute('play')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#efe9de] hover:bg-[#e4ddcf] dark:bg-[#252320] dark:hover:bg-[#383531] text-xs font-semibold text-[#141413] dark:text-[#faf9f5] transition-colors shadow-2xs"
        >
          <Sparkles size={13} className="text-[#5db8a6]" />
          <span>Free Play Canvas</span>
        </button>
      </nav>

      {/* Main Roadmap Surface */}
      <main className="py-10 pb-28 px-6 max-w-6xl mx-auto w-full space-y-8 relative">
        {/* Header Hero Box with Architectural Frame */}
        <div className="relative rounded-3xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#181715] p-6 sm:p-8 shadow-xs">
          <span className="absolute top-2 left-2 font-mono text-[10px] text-[#cc785c]">+</span>
          <span className="absolute top-2 right-2 font-mono text-[10px] text-[#cc785c]">+</span>
          <span className="absolute bottom-2 left-2 font-mono text-[10px] text-[#cc785c]">+</span>
          <span className="absolute bottom-2 right-2 font-mono text-[10px] text-[#cc785c]">+</span>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-[#cc785c] font-bold">
                <span>STAGE BY STAGE · ZERO TO ONE</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight">
                Neural Networks from First Principles
              </h1>
              <p className="text-xs sm:text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                Step-by-step masterclass spanning single perceptrons, hidden layers, activation calculus, loss descent, and multi-layer backpropagation.
              </p>
            </div>

            {/* Progress Visualizer Box */}
            <div className="shrink-0 p-4 rounded-2xl bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] text-center min-w-[200px] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#8e8b82]">Mastery</span>
                <span className="font-bold text-[#cc785c]">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-[#efe9de] dark:bg-[#252320] overflow-hidden">
                <div
                  style={{ width: `${progressPercent}%` }}
                  className="h-full rounded-full bg-[#cc785c] transition-all duration-500"
                />
              </div>
              <span className="text-[11px] font-mono text-[#6c6a64] dark:text-[#a09d96] block">
                {completedCount} of {LESSONS.length} Stages Completed
              </span>
            </div>
          </div>

          {/* Filtering & Search Bar (Rune Icons style layout) */}
          <div className="mt-6 pt-5 border-t border-[#f4efe8] dark:border-[#2a2926] flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Difficulty Tabs */}
            <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-1 rounded-xl w-full sm:w-auto">
              {[
                { id: 'all', label: 'All Stages', count: 9 },
                { id: 'beginner', label: 'Beginner', count: 3, color: '#5db872' },
                { id: 'intermediate', label: 'Intermediate', count: 4, color: '#3b82f6' },
                { id: 'advanced', label: 'Advanced', count: 2, color: '#8b5cf6' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterDifficulty(tab.id as any)}
                  className={`flex-1 sm:flex-initial px-3 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                    filterDifficulty === tab.id
                      ? 'bg-white dark:bg-[#181715] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                      : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
                  }`}
                >
                  {tab.color && <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tab.color }} />}
                  <span>{tab.label}</span>
                  <span className="text-[10px] font-mono text-[#8e8b82]">({tab.count})</span>
                </button>
              ))}
            </div>

            {/* Quick search input */}
            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8b82]" />
              <input
                type="text"
                placeholder="Search stages or concepts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] text-xs text-[#141413] dark:text-[#faf9f5] placeholder-[#8e8b82] outline-none focus:border-[#cc785c]"
              />
            </div>
          </div>
        </div>

        {/* Lesson Cards Grid (Rune Icons 2-column geometric card matrix) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredLessons.map((l) => {
            const isCompleted = !!completedLessons[l.id];
            const diff = getDifficulty(l.order);

            // Clean title
            const displayTitle = l.title.replace(/^\d+\.\s*/, '');

            return (
              <div
                key={l.id}
                onClick={() => {
                  startLesson(l.id);
                  setCurrentRoute('play');
                }}
                className={`relative p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between select-none shadow-2xs hover:shadow-md ${
                  isCompleted
                    ? 'border-[#5db872]/50 bg-white dark:bg-[#181715]'
                    : 'border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#181715] hover:border-[#cc785c]'
                }`}
              >
                {/* Architectural Corner Crosses */}
                <span className="absolute top-2 left-2 font-mono text-[9px] text-[#8e8b82] group-hover:text-[#cc785c] transition-colors">+</span>
                <span className="absolute top-2 right-2 font-mono text-[9px] text-[#8e8b82] group-hover:text-[#cc785c] transition-colors">+</span>

                <div>
                  {/* Top Bar: Stage Index Badge + Duration + Status */}
                  <div className="flex items-center justify-between mb-3 mt-1">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg font-mono font-bold text-xs flex items-center justify-center ${
                          isCompleted
                            ? 'bg-[#5db872] text-white shadow-2xs'
                            : 'bg-[#efe9de] dark:bg-[#252320] text-[#cc785c]'
                        }`}
                      >
                        {isCompleted ? <CheckCircle2 size={15} /> : `0${l.order}`}
                      </div>
                      <span className="font-mono text-[11px] font-bold uppercase text-[#8e8b82]">
                        Stage 0{l.order}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded-full capitalize font-semibold ${
                          diff === 'beginner'
                            ? 'bg-[#5db872]/10 text-[#5db872]'
                            : diff === 'intermediate'
                            ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                            : 'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                        }`}
                      >
                        {diff}
                      </span>
                      <span className="text-[#8e8b82]">~{l.estimatedMinutes}m</span>
                    </div>
                  </div>

                  {/* Lesson Title */}
                  <h3 className="font-serif text-base font-bold text-[#141413] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors mb-2 leading-snug">
                    {displayTitle}
                  </h3>

                  {/* Summary */}
                  <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed mb-4">
                    {l.summary}
                  </p>

                  {/* Wireframe Diagram Thumbnail */}
                  <div className="p-3 rounded-xl bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] mb-3">
                    <div className="flex items-center justify-between text-[10px] font-mono text-[#8e8b82] mb-1.5">
                      <span>{l.steps.length} Interactive Steps</span>
                      <span>Badge: {l.badgeName}</span>
                    </div>

                    {/* Geometric mini topology representation */}
                    <div className="h-6 flex items-center justify-center gap-2 text-xs font-mono">
                      {l.order === 1 && (
                        <span className="text-[#cc785c]">◎ Input (2) ⟶ ⬡ Neuron (1)</span>
                      )}
                      {l.order === 2 && (
                        <span className="text-[#e8a55a]">f(z) Sigmoid · ReLU · Tanh</span>
                      )}
                      {l.order === 3 && (
                        <span className="text-[#5db872]">AND · OR Gate Hyperplane</span>
                      )}
                      {l.order === 4 && (
                        <span className="text-[#8b5cf6]">2 Inputs ⟶ 2 Hidden ⟶ 1 XOR</span>
                      )}
                      {l.order === 5 && (
                        <span className="text-[#3b82f6]">z = ∑ w·x + b ⟶ a = σ(z)</span>
                      )}
                      {l.order === 6 && (
                        <span className="text-[#c64545]">L = (ŷ - y)² · MSE Gradient</span>
                      )}
                      {l.order === 7 && (
                        <span className="text-[#8b5cf6]">∂L/∂w = ∂L/∂a · ∂a/∂z · ∂z/∂w</span>
                      )}
                      {l.order === 8 && (
                        <span className="text-[#cc785c]">w ← w - η ∇L (20 Epochs)</span>
                      )}
                      {l.order === 9 && (
                        <span className="text-[#10b981]">Deep 3-Layer Generalization</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div className="pt-2 border-t border-[#f4efe8] dark:border-[#2a2926] flex items-center justify-between text-xs font-semibold">
                  <span className={isCompleted ? 'text-[#5db872]' : 'text-[#cc785c]'}>
                    {isCompleted ? 'Review Completed Stage' : 'Launch Stage Canvas'}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:translate-x-1 ${
                      isCompleted
                        ? 'bg-[#5db872]/15 text-[#5db872]'
                        : 'bg-[#cc785c]/15 text-[#cc785c]'
                    }`}
                  >
                    <ArrowRight size={12} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

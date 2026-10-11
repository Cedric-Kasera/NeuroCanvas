'use client';

import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Activity,
  Zap,
  TrendingDown,
  Cpu,
  Layers,
  HelpCircle,
  Clock,
  Award,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { EXPERIMENTS } from '@/lib/content/experiments';
import { AppLogo } from '@/components/ui/AppLogo';

export function LabView() {
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const openExperiment = useUIStore((s) => s.openExperiment);

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/90 dark:bg-[#141413]/90 backdrop-blur-md px-6 max-w-7xl mx-auto w-full flex items-center justify-between sticky top-0 z-30">
        <div
          onClick={() => setCurrentRoute('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <AppLogo className="h-7 w-auto" />
          <span className="font-serif text-lg font-bold tracking-tight">NeuroCanvas</span>
          <span className="text-[#8e8b82] text-xs font-mono">/ Experiment Lab</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentRoute('games')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors"
          >
            <Sparkles size={13} className="text-[#5db8a6]" />
            <span>Mini-Games & Daily</span>
          </button>
          <button
            onClick={() => setCurrentRoute('projects')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors"
          >
            <span>Projects</span>
          </button>
          <button
            onClick={() => setCurrentRoute('play')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-medium shadow-xs transition-colors"
          >
            <span>Studio Canvas</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cc785c]/10 text-[#cc785c] text-xs font-semibold mb-3">
            <Flame size={13} />
            <span>Break-It Experiments</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            The Failure Mode Lab
          </h1>
          <p className="text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            Neural networks fail in subtle and fascinating ways. Predict the bug, run real backpropagation diagnostics, diagnose the pathological condition, and fix it on the live graph.
          </p>
        </div>

        {/* Experiment Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {EXPERIMENTS.map((exp, idx) => {
            const dots = Array.from({ length: 3 }, (_, i) => i < exp.difficulty);

            return (
              <div
                key={exp.id}
                onClick={() => openExperiment(exp.id)}
                className="group p-5 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c] transition-all hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider">
                      Experiment X{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {dots.map((active, dIdx) => (
                        <div
                          key={dIdx}
                          className={`w-2 h-2 rounded-full ${
                            active ? 'bg-[#cc785c]' : 'bg-[#e6dfd8] dark:bg-[#383531]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-bold group-hover:text-[#cc785c] transition-colors mb-2">
                    {exp.title}
                  </h3>
                  <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] mb-4 leading-relaxed">
                    {exp.hook}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {exp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-md bg-[#efe9de]/70 dark:bg-[#252320]/70 text-[10px] font-medium text-[#6c6a64] dark:text-[#a09d96]"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-[#8e8b82]">
                    <Clock size={12} />
                    <span>~{exp.minutes}m</span>
                  </span>

                  <span className="font-semibold text-[#cc785c] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Investigate</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}

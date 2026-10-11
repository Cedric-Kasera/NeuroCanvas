'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  TrendingUp,
  Target,
  Flame,
  ArrowRight,
  Award,
  Calendar,
  Share2,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useGameStore } from '@/lib/state/gameStore';
import { AppLogo } from '@/components/ui/AppLogo';
import { WeightTunerGame } from './WeightTunerGame';
import { CurveDetectiveGame } from './CurveDetectiveGame';
import { BlameGame } from './BlameGame';
import { DailyChallengeView } from './DailyChallengeView';
import { DailyStreak } from '@/components/games/DailyStreak';

export function GamesView() {
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const gameType = useGameStore((s) => s.gameType);
  const initTuner = useGameStore((s) => s.initTuner);
  const initCurve = useGameStore((s) => s.initCurve);
  const initBlame = useGameStore((s) => s.initBlame);
  const initDaily = useGameStore((s) => s.initDaily);
  const dailyStreak = useGameStore((s) => s.dailyStreak);

  // If a sub-game is active, render its screen
  if (gameType === 'tuner') {
    return <WeightTunerGame />;
  }
  if (gameType === 'curve') {
    return <CurveDetectiveGame />;
  }
  if (gameType === 'blame') {
    return <BlameGame />;
  }
  if (gameType === 'daily') {
    return <DailyChallengeView />;
  }

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
          <span className="text-[#8e8b82] text-xs font-mono">/ Mini-Games & Daily</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentRoute('lab')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors"
          >
            <Flame size={13} className="text-[#cc785c]" />
            <span>Experiment Lab</span>
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
            <Sparkles size={13} />
            <span>Studio Canvas</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5db8a6]/10 text-[#5db8a6] text-xs font-semibold mb-3">
            <Sparkles size={13} />
            <span>Intuition Arcade</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            NeuroCanvas Mini-Games
          </h1>
          <p className="text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            Quick, zero-pressure games designed to build tactile intuition for weights, activations, and backpropagation flow. Play free practice rounds or tackle today’s Daily Challenge.
          </p>
        </div>

        {/* Daily Streak Retention Component */}
        <DailyStreak />

        {/* Daily Challenge Highlight Card */}
        <div
          onClick={async () => {
            await initDaily();
          }}
          className="p-6 rounded-3xl bg-gradient-to-br from-[#cc785c]/10 via-[#faf9f5] to-[#5db8a6]/10 dark:from-[#cc785c]/15 dark:via-[#1a1917] dark:to-[#5db8a6]/15 border border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c] transition-all cursor-pointer shadow-xs flex flex-col md:flex-row items-center justify-between gap-6 group"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#cc785c] text-white flex items-center justify-center shrink-0 shadow-md">
              <Calendar size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#cc785c] font-bold">
                  Today&apos;s Challenge
                </span>
                <span className="px-2 py-0.2 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                  <Flame size={11} /> {dailyStreak}-Day Streak
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold mb-1">
                The Daily 5-Round Sprint
              </h3>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] max-w-xl leading-relaxed">
                A daily mix of 2 Weight Tuners, 2 Curve Detectives, and 1 Blame Game seeded by today&apos;s UTC date. Everyone gets the same board.
              </p>
            </div>
          </div>

          <button className="px-5 py-2.5 rounded-xl bg-[#cc785c] group-hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2 shrink-0">
            <span>Play Daily Challenge</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 3 Standalone Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Game 1: Weight Tuner */}
          <div
            onClick={() => initTuner(1)}
            className="p-6 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c] transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#cc785c]/10 text-[#cc785c] flex items-center justify-center mb-4">
                <Sliders size={20} />
              </div>
              <h3 className="font-serif text-lg font-bold group-hover:text-[#cc785c] transition-colors mb-2">
                Weight Tuner
              </h3>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed mb-4">
                &ldquo;Hit the target.&rdquo; Adjust weights and bias to hit an exact numerical output within a limited number of moves.
              </p>
            </div>

            <div className="pt-4 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60 flex items-center justify-between text-xs">
              <span className="text-[#8e8b82]">3 Difficulty Levels</span>
              <span className="font-semibold text-[#cc785c] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Play</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Game 2: Curve Detective */}
          <div
            onClick={() => initCurve(1)}
            className="p-6 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c] transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-[#5db8a6]/10 text-[#5db8a6] flex items-center justify-center mb-4">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-serif text-lg font-bold group-hover:text-[#5db8a6] transition-colors mb-2">
                Curve Detective
              </h3>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed mb-4">
                &ldquo;Which activation is this?&rdquo; Identify activation curves, derivative asymptotes, and saturation patterns across 8 fast rounds.
              </p>
            </div>

            <div className="pt-4 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60 flex items-center justify-between text-xs">
              <span className="text-[#8e8b82]">8 Rounds • Speed Run</span>
              <span className="font-semibold text-[#5db8a6] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Play</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>

          {/* Game 3: Blame Game */}
          <div
            onClick={() => initBlame()}
            className="p-6 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c] transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
          >
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4">
                <Target size={20} />
              </div>
              <h3 className="font-serif text-lg font-bold group-hover:text-purple-600 transition-colors mb-2">
                The Blame Game
              </h3>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed mb-4">
                &ldquo;Who changes most?&rdquo; Inspect a small network and predict which synapse will receive the largest backprop update.
              </p>
            </div>

            <div className="pt-4 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60 flex items-center justify-between text-xs">
              <span className="text-[#8e8b82]">Backprop Intuition</span>
              <span className="font-semibold text-purple-600 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                <span>Play</span>
                <ArrowRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Flame,
  Star,
  Share2,
  CheckCircle2,
  Copy,
  ArrowRight,
} from 'lucide-react';
import { useGameStore } from '@/lib/state/gameStore';
import { WeightTunerGame } from './WeightTunerGame';
import { CurveDetectiveGame } from './CurveDetectiveGame';
import { BlameGame } from './BlameGame';

export function DailyChallengeView() {
  const dailyStep = useGameStore((s) => s.dailyStep);
  const dailyStarsEarned = useGameStore((s) => s.dailyStarsEarned);
  const dailyDayNumber = useGameStore((s) => s.dailyDayNumber);
  const dailyStreak = useGameStore((s) => s.dailyStreak);
  const dailyCompleted = useGameStore((s) => s.dailyCompleted);
  const getDailyShareText = useGameStore((s) => s.getDailyShareText);

  const [copied, setCopied] = useState(false);

  const totalStars = dailyStarsEarned.reduce((a, b) => a + b, 0);

  // If completed, show summary screen
  if (dailyCompleted) {
    return (
      <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col font-sans">
        <header className="h-14 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/90 dark:bg-[#141413]/90 px-4 flex items-center justify-between">
          <button
            onClick={() => useGameStore.setState({ gameType: null })}
            className="p-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96]"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-serif font-bold text-sm">Daily Challenge #{dailyDayNumber}</span>
          <div />
        </header>

        <main className="flex-1 max-w-lg mx-auto w-full px-6 py-12 flex flex-col items-center justify-center text-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-[#5db8a6]/20 text-[#5db8a6] flex items-center justify-center shadow-md">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#cc785c] font-bold">
              Today&apos;s Challenge Complete
            </span>
            <h2 className="font-serif text-3xl font-bold mt-1">Well Done!</h2>
          </div>

          <div className="w-full p-6 rounded-3xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-around">
              <div>
                <span className="text-[10px] text-[#8e8b82] uppercase tracking-wider block">
                  Stars Earned
                </span>
                <span className="font-serif text-2xl font-bold text-amber-500">
                  {totalStars} / 15
                </span>
              </div>
              <div className="w-px h-8 bg-[#e6dfd8] dark:bg-[#2a2926]" />
              <div>
                <span className="text-[10px] text-[#8e8b82] uppercase tracking-wider block">
                  Active Streak
                </span>
                <span className="font-serif text-2xl font-bold text-[#cc785c] flex items-center justify-center gap-1">
                  <Flame size={20} /> {dailyStreak} Days
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60 flex items-center justify-center gap-2">
              {dailyStarsEarned.map((s, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <span className="text-[10px] text-[#8e8b82]">R{idx + 1}</span>
                  <div className="flex text-amber-500">
                    <Star size={12} fill="currentColor" />
                    <span className="text-[10px] font-mono font-bold ml-0.5">{s}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              const text = getDailyShareText();
              navigator.clipboard.writeText(text);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            className="w-full py-3 rounded-2xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 size={14} />
            <span>{copied ? 'Copied Results to Clipboard!' : 'Share Today’s Score'}</span>
          </button>
        </main>
      </div>
    );
  }

  // Active round switcher:
  // Round 0 & 1: Weight Tuner
  // Round 2 & 3: Curve Detective
  // Round 4: Blame Game
  return (
    <div className="relative">
      <div className="bg-[#cc785c] text-white px-4 py-1 text-[11px] font-semibold flex items-center justify-between z-40 sticky top-0">
        <span>Daily Challenge #{dailyDayNumber} • Sprint Step {dailyStep + 1} of 5</span>
        <span>Streak: 🔥 {dailyStreak}d</span>
      </div>

      {dailyStep < 2 && <WeightTunerGame />}
      {dailyStep >= 2 && dailyStep < 4 && <CurveDetectiveGame />}
      {dailyStep === 4 && <BlameGame />}
    </div>
  );
}

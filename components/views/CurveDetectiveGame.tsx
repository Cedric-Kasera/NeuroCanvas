'use client';

import React from 'react';
import {
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { useGameStore } from '@/lib/state/gameStore';

export function CurveDetectiveGame() {
  const rounds = useGameStore((s) => s.curveRounds);
  const roundIndex = useGameStore((s) => s.curveRoundIndex);
  const selectedOption = useGameStore((s) => s.curveSelectedOption);
  const score = useGameStore((s) => s.curveScore);
  const isSolved = useGameStore((s) => s.curveRoundSolved);
  const selectOption = useGameStore((s) => s.selectCurveOption);
  const nextRound = useGameStore((s) => s.nextCurveRound);
  const initCurve = useGameStore((s) => s.initCurve);

  const round = rounds[roundIndex];
  if (!round) return null;

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col font-sans">
      {/* Top Bar */}
      <header className="h-14 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/90 dark:bg-[#141413]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => useGameStore.setState({ gameType: null })}
            className="p-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-serif font-bold text-sm sm:text-base">Curve Detective</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#5db8a6]/10 text-[#5db8a6] font-bold">
            Round {roundIndex + 1} of {rounds.length}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="font-mono text-[#5db8a6] font-bold">Score: {score}</span>
          <button
            onClick={() => initCurve(1)}
            className="p-1.5 rounded-lg border border-[#e6dfd8] dark:border-[#383531] text-[#8e8b82] hover:text-[#141413]"
            title="Restart Session"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </header>

      {/* Main Game Screen */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col items-center justify-center gap-8">
        {/* SVG Curve Canvas */}
        <div className="w-full p-6 rounded-3xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] shadow-sm flex flex-col items-center gap-4">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8e8b82]">
            Activation Graph: f(z) across range [-4, 4]
          </span>

          <div className="w-full h-48 relative border border-[#e6dfd8] dark:border-[#383531] rounded-2xl bg-[#faf9f5] dark:bg-[#141413] flex items-center justify-center overflow-hidden">
            {/* Axes */}
            <div className="absolute w-full h-px bg-[#e6dfd8] dark:bg-[#383531]" />
            <div className="absolute h-full w-px bg-[#e6dfd8] dark:bg-[#383531]" />

            {/* SVG Polyline */}
            {round.curveData && (
              <svg className="w-full h-full overflow-visible" viewBox="-4 -2 8 4" preserveAspectRatio="none">
                <polyline
                  fill="none"
                  stroke="#cc785c"
                  strokeWidth="0.15"
                  points={round.curveData.map((pt) => `${pt.x},${-pt.y}`).join(' ')}
                />
              </svg>
            )}
          </div>
        </div>

        {/* Multiple Choice Options */}
        <div className="w-full flex flex-col gap-3">
          <span className="text-xs font-semibold text-center text-[#8e8b82]">
            Which activation function generates this curve?
          </span>

          <div className="grid grid-cols-2 gap-3">
            {round.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === round.correctOptionIndex;

              return (
                <button
                  key={idx}
                  onClick={() => selectOption(idx)}
                  disabled={isSolved}
                  className={`p-4 rounded-2xl border text-xs font-semibold transition-all capitalize ${
                    isSelected
                      ? isCorrect
                        ? 'bg-[#5db8a6]/20 border-[#5db8a6] text-[#5db8a6]'
                        : 'bg-red-500/20 border-red-500 text-red-500'
                      : isSolved && isCorrect
                      ? 'bg-[#5db8a6]/20 border-[#5db8a6] text-[#5db8a6]'
                      : 'bg-white dark:bg-[#1a1917] border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c]'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reveal Explanation & Next Button */}
        {isSolved && (
          <div className="w-full p-5 rounded-2xl bg-[#efe9de]/50 dark:bg-[#252320]/50 border border-[#e6dfd8] dark:border-[#2a2926] text-xs flex flex-col gap-3">
            <p className="text-[#6c6a64] dark:text-[#a09d96]">{round.explanation}</p>
            {roundIndex + 1 < rounds.length ? (
              <button
                onClick={nextRound}
                className="self-end px-4 py-2 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <span>Next Round</span>
                <ArrowRight size={13} />
              </button>
            ) : (
              <div className="flex items-center justify-between pt-2 border-t border-[#e6dfd8]/50 dark:border-[#2a2926]/50">
                <span className="font-bold text-[#5db8a6]">
                  Game Complete! Final Score: {score} / {rounds.length}
                </span>
                <button
                  onClick={() => initCurve(1)}
                  className="px-4 py-2 rounded-xl bg-[#cc785c] text-white font-semibold"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

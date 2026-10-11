'use client';

import React from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Target,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useGameStore } from '@/lib/state/gameStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { useUIStore } from '@/lib/state/uiStore';
import { blameLevelToCanvas } from '@/lib/games/generators';

export function BlameGame() {
  const level = useGameStore((s) => s.blameLevel);
  const selectedEdgeId = useGameStore((s) => s.blameSelectedEdgeId);
  const isRevealed = useGameStore((s) => s.blameRevealed);
  const isCorrect = useGameStore((s) => s.blameIsCorrect);
  const selectEdge = useGameStore((s) => s.selectBlameEdge);
  const revealBlame = useGameStore((s) => s.revealBlame);
  const initBlame = useGameStore((s) => s.initBlame);

  if (!level) return null;

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
          <span className="font-serif font-bold text-sm sm:text-base">The Blame Game</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold">
            Backpropagation Flow
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const canvas = blameLevelToCanvas(level);
              useCanvasStore.getState().loadCanvas(canvas);
              useSimStore.getState().buildFromCanvas();
              useUIStore.getState().setActiveCanvasMode('game', 'The Blame Game - Backprop Flow');
              useUIStore.getState().setRightOpen(true);
              useUIStore.getState().setRightTab('activity');
              useUIStore.getState().setCurrentRoute('play');
              useUIStore.getState().showToast('Loaded Blame Game network on Studio Canvas!', 'info');
            }}
            className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
            title="Inspect graph and backprop gradients on Studio Canvas"
          >
            <Layers size={12} />
            <span className="hidden sm:inline">Inspect on Canvas</span>
          </button>

          <button
            onClick={() => initBlame()}
            className="p-1.5 rounded-lg border border-[#e6dfd8] dark:border-[#383531] text-[#8e8b82] hover:text-[#141413]"
            title="New Round"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col items-center justify-center gap-8">
        <div className="text-center max-w-md">
          <h2 className="font-serif text-2xl font-bold mb-1">Who Changes Most?</h2>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            Target is {level.target}. Inputs are ({level.inputValues[0]}, {level.inputValues[1]}). Which of these three highlighted weights will receive the largest gradient update magnitude (|∂L/∂w|)?
          </p>
        </div>

        {/* 3 Candidate Synapses */}
        <div className="w-full flex flex-col gap-3">
          {level.candidateEdges.map((edge) => {
            const isSelected = selectedEdgeId === edge.id;
            const isWinner = edge.id === level.winningEdgeId;

            return (
              <div
                key={edge.id}
                onClick={() => selectEdge(edge.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? isRevealed
                      ? isWinner
                        ? 'bg-[#5db8a6]/20 border-[#5db8a6]'
                        : 'bg-red-500/20 border-red-500'
                      : 'border-[#cc785c] bg-[#cc785c]/5 shadow-sm'
                    : isRevealed && isWinner
                    ? 'bg-[#5db8a6]/20 border-[#5db8a6]'
                    : 'bg-white dark:bg-[#1a1917] border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs">{edge.label}</span>
                  <span className="font-mono text-xs text-[#8e8b82]">
                    w = {edge.weight.toFixed(2)}
                  </span>
                </div>

                {isRevealed && (
                  <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-xs">
                    <span className="text-[#8e8b82]">Calculated |∂L/∂w|:</span>
                    <span className="font-mono font-bold text-[#cc785c]">
                      {edge.absGradient.toFixed(4)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        {!isRevealed ? (
          <button
            onClick={revealBlame}
            disabled={!selectedEdgeId}
            className="px-6 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
          >
            Lock In Choice & Compute Gradients
          </button>
        ) : (
          <div className="w-full p-5 rounded-2xl bg-[#efe9de]/50 dark:bg-[#252320]/50 border border-[#e6dfd8] dark:border-[#2a2926] text-center flex flex-col items-center gap-3">
            <span className="font-serif font-bold text-base">
              {isCorrect ? '✓ Spot on! You found the largest update.' : '✕ Not quite — check the gradients above!'}
            </span>
            <button
              onClick={() => initBlame()}
              className="px-5 py-2 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Play Another Round
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

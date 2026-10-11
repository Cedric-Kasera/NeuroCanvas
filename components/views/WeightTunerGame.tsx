'use client';

import React from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Star,
  CheckCircle2,
  Sliders,
  HelpCircle,
  Layers,
} from 'lucide-react';
import { useGameStore } from '@/lib/state/gameStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { useUIStore } from '@/lib/state/uiStore';
import { tunerLevelToCanvas } from '@/lib/games/generators';

export function WeightTunerGame() {
  const level = useGameStore((s) => s.tunerLevel);
  const weights = useGameStore((s) => s.tunerWeights);
  const bias = useGameStore((s) => s.tunerBias);
  const movesUsed = useGameStore((s) => s.tunerMovesUsed);
  const currentOutput = useGameStore((s) => s.tunerOutput);
  const diff = useGameStore((s) => s.tunerDiff);
  const isSolved = useGameStore((s) => s.tunerSolved);
  const stars = useGameStore((s) => s.tunerStars);
  const updateWeight = useGameStore((s) => s.updateTunerWeight);
  const updateBias = useGameStore((s) => s.updateTunerBias);
  const applyMove = useGameStore((s) => s.applyTunerMove);
  const resetTuner = useGameStore((s) => s.resetTuner);
  const initTuner = useGameStore((s) => s.initTuner);

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
          <span className="font-serif font-bold text-sm sm:text-base">Weight Tuner</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#cc785c]/10 text-[#cc785c] font-bold">
            Level {level.difficulty} ({level.activation})
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 text-xs">
          <button
            onClick={() => {
              const canvas = tunerLevelToCanvas(level, weights, bias);
              useCanvasStore.getState().loadCanvas(canvas);
              useSimStore.getState().buildFromCanvas();
              useUIStore.getState().setActiveCanvasMode('game', `Weight Tuner (Target: ${level.targetOutput})`);
              useUIStore.getState().setRightOpen(true);
              useUIStore.getState().setRightTab('activity');
              useUIStore.getState().setCurrentRoute('play');
              useUIStore.getState().showToast('Opened Weight Tuner puzzle on Studio Canvas!', 'info');
            }}
            className="px-2.5 py-1 rounded-xl bg-[#5db8a6] hover:bg-[#4ea594] text-white text-[11px] font-semibold flex items-center gap-1 shadow-xs transition-colors"
            title="Test and solve on the visual Studio Canvas"
          >
            <Layers size={12} />
            <span className="hidden sm:inline">Test on Canvas</span>
          </button>

          <div className="flex items-center gap-1 font-mono">
            <span className="text-[#8e8b82]">Moves:</span>
            <span className="font-bold">{movesUsed}</span>
            <span className="text-[#8e8b82]">/ {level.maxMoves}</span>
          </div>

          <button
            onClick={resetTuner}
            className="p-1.5 rounded-lg border border-[#e6dfd8] dark:border-[#383531] text-[#8e8b82] hover:text-[#141413]"
            title="Reset Level"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-2xl mx-auto w-full px-6 py-8 flex flex-col items-center justify-center gap-8">
        {/* Target Readout Screen */}
        <div className="w-full p-6 rounded-3xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] shadow-sm flex flex-col items-center text-center gap-3">
          <span className="text-xs font-mono uppercase tracking-wider text-[#8e8b82]">
            Target Output: ±{level.tolerance}
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-4xl sm:text-5xl font-bold text-[#cc785c]">
              {level.targetOutput.toFixed(2)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono pt-3 border-t border-[#e6dfd8]/50 dark:border-[#2a2926]/50 w-full justify-center">
            <span>
              Current: <strong className="text-lg">{currentOutput.toFixed(2)}</strong>
            </span>
            <span>•</span>
            <span className={diff <= level.tolerance ? 'text-[#5db8a6] font-bold' : 'text-[#8e8b82]'}>
              Diff: {diff.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Sliders Container */}
        <div className="w-full p-6 rounded-3xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] shadow-sm flex flex-col gap-6">
          {/* Weight 1 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#6c6a64] dark:text-[#a09d96]">
                Synapse w₁ (Input x₁ = {level.inputs[0]})
              </span>
              <span className="font-mono font-bold text-[#cc785c]">
                {weights[0].toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={weights[0]}
              disabled={isSolved}
              onChange={(e) => updateWeight(0, parseFloat(e.target.value))}
              onMouseUp={applyMove}
              onTouchEnd={applyMove}
              className="accent-[#cc785c] w-full"
            />
          </div>

          {/* Weight 2 */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#6c6a64] dark:text-[#a09d96]">
                Synapse w₂ (Input x₂ = {level.inputs[1]})
              </span>
              <span className="font-mono font-bold text-[#cc785c]">
                {weights[1].toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={weights[1]}
              disabled={isSolved}
              onChange={(e) => updateWeight(1, parseFloat(e.target.value))}
              onMouseUp={applyMove}
              onTouchEnd={applyMove}
              className="accent-[#cc785c] w-full"
            />
          </div>

          {/* Bias */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[#6c6a64] dark:text-[#a09d96]">
                Neuron Bias (b)
              </span>
              <span className="font-mono font-bold text-[#cc785c]">
                {bias.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.1"
              value={bias}
              disabled={isSolved}
              onChange={(e) => updateBias(parseFloat(e.target.value))}
              onMouseUp={applyMove}
              onTouchEnd={applyMove}
              className="accent-[#cc785c] w-full"
            />
          </div>
        </div>

        {/* Solved Notification */}
        {isSolved && (
          <div className="w-full p-6 rounded-3xl bg-[#5db8a6]/15 border border-[#5db8a6]/30 flex flex-col items-center gap-4 text-center">
            <div className="flex items-center gap-1 text-amber-500">
              {Array.from({ length: 3 }, (_, i) => (
                <Star
                  key={i}
                  size={24}
                  fill={i < stars ? 'currentColor' : 'none'}
                  className={i < stars ? 'text-amber-500' : 'text-[#8e8b82]'}
                />
              ))}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#141413] dark:text-[#faf9f5]">
                Target Reached in {movesUsed} Moves!
              </h3>
              <span className="text-xs text-[#8e8b82]">
                {stars === 3 ? 'Perfect Precision! (★★★)' : 'Great job!'}
              </span>
            </div>
            <button
              onClick={() => initTuner(level.difficulty)}
              className="px-5 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Next Level
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

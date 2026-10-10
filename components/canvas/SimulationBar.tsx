'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  FastForward,
  Zap,
  TrendingDown,
  Layers,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { useSimStore } from '@/lib/state/simStore';
import { useUIStore } from '@/lib/state/uiStore';
import { FormattedMath } from '@/components/ui/FormattedMath';

export function SimulationBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const mode = useUIStore((s) => s.mode);

  const steps = useSimStore((s) => s.steps);
  const cursor = useSimStore((s) => s.cursor);
  const isPlaying = useSimStore((s) => s.isPlaying);
  const speed = useSimStore((s) => s.speed);
  const granularity = useSimStore((s) => s.granularity);
  const learningRate = useSimStore((s) => s.learningRate);
  const trainEpochsCount = useSimStore((s) => s.trainEpochsCount);

  const setSpeed = useSimStore((s) => s.setSpeed);
  const setGranularity = useSimStore((s) => s.setGranularity);
  const setLearningRate = useSimStore((s) => s.setLearningRate);
  const setTrainEpochsCount = useSimStore((s) => s.setTrainEpochsCount);

  const stepForward = useSimStore((s) => s.stepForward);
  const stepBack = useSimStore((s) => s.stepBack);
  const reset = useSimStore((s) => s.reset);
  const play = useSimStore((s) => s.play);
  const pause = useSimStore((s) => s.pause);
  const runAll = useSimStore((s) => s.runAll);
  const updateWeights = useSimStore((s) => s.updateWeights);
  const trainN = useSimStore((s) => s.trainN);

  const currentStep = cursor >= 0 && cursor < steps.length ? steps[cursor] : null;
  const currentPhase = currentStep?.phase || 'forward';

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-4xl transition-all">
      <div className="rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5]/95 dark:bg-[#181715]/95 backdrop-blur-md shadow-xl p-2.5 text-[#141413] dark:text-[#faf9f5]">
        {/* Phase Indicator Track */}
        <div className="flex items-center justify-between gap-1 border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2 px-1 text-[11px]">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {[
              { id: 'forward', label: '1. Forward Pass' },
              { id: 'loss', label: '2. Loss (MSE)' },
              { id: 'backward', label: '3. Backward Pass' },
              { id: 'update', label: '4. Weight Update' },
            ].map((p, idx) => {
              const isActive = currentPhase === p.id;
              return (
                <div key={p.id} className="flex items-center gap-1 shrink-0">
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-medium transition-colors ${
                      isActive
                        ? 'bg-[#cc785c] text-white shadow-xs'
                        : 'text-[#6c6a64] dark:text-[#a09d96] bg-[#efe9de] dark:bg-[#252320]'
                    }`}
                  >
                    {p.label}
                  </span>
                  {idx < 3 && <span className="text-[#8e8b82] text-xs">→</span>}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="font-mono text-xs text-[#6c6a64] dark:text-[#a09d96] tabular-nums">
              Step {cursor + 1} / {Math.max(1, steps.length)}
            </span>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96]"
              title="Toggle advanced training controls"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>
          </div>
        </div>

        {/* Step description readout */}
        {currentStep && (
          <div className="px-2 pb-2 text-xs font-sans text-[#3d3d3a] dark:text-[#efe9de] flex flex-wrap items-center justify-between gap-2">
            <span className="truncate max-w-md">{currentStep.description}</span>
            {currentStep.detailMath && mode === 'student' && (
              <div className="shrink-0 max-w-xs">
                <FormattedMath
                  math={currentStep.detailMath.split('\n')[0].replace(/×/g, '\\cdot ')}
                  displayMode={false}
                  className="px-2 py-0.5 rounded text-[11px] text-[#cc785c] bg-[#efe9de] dark:bg-[#252320]"
                />
              </div>
            )}
          </div>
        )}

        {/* Primary Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* Playback cluster */}
          <div className="flex items-center gap-1">
            <button
              onClick={reset}
              className="p-2 rounded-xl hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
              title="Reset simulation"
            >
              <RotateCcw size={16} />
            </button>
            <button
              onClick={stepBack}
              disabled={cursor <= 0}
              className="p-2 rounded-xl hover:bg-[#efe9de] dark:hover:bg-[#252320] disabled:opacity-40 text-[#141413] dark:text-[#faf9f5] transition-colors"
              title="Step backward"
            >
              <SkipBack size={16} />
            </button>
            <button
              onClick={isPlaying ? pause : play}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white font-medium text-xs shadow-xs transition-colors"
            >
              {isPlaying ? <Pause size={15} /> : <Play size={15} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              onClick={stepForward}
              disabled={cursor >= steps.length - 1 && steps.length > 0}
              className="p-2 rounded-xl hover:bg-[#efe9de] dark:hover:bg-[#252320] disabled:opacity-40 text-[#141413] dark:text-[#faf9f5] transition-colors"
              title="Step forward"
            >
              <SkipForward size={16} />
            </button>
            <button
              onClick={runAll}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#efe9de] hover:bg-[#e8e0d2] dark:bg-[#252320] dark:hover:bg-[#383531] text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
              title="Compute instantly with no animation"
            >
              <Zap size={14} className="text-[#cc785c]" />
              <span className="hidden sm:inline">Run All</span>
            </button>
          </div>

          {/* Speed & Granularity Controls */}
          <div className="flex items-center gap-2 text-xs">
            {/* Speed toggle */}
            <div className="flex items-center bg-[#efe9de] dark:bg-[#252320] rounded-xl p-0.5">
              {([0.5, 1, 2] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-medium transition-colors ${
                    speed === s
                      ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                      : 'text-[#6c6a64] dark:text-[#a09d96]'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Granularity */}
            <button
              onClick={() => setGranularity(granularity === 'node' ? 'layer' : 'node')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#efe9de] hover:bg-[#e8e0d2] dark:bg-[#252320] dark:hover:bg-[#383531] text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
              title="Switch step granularity"
            >
              <Layers size={13} className="text-[#5db8a6]" />
              <span className="capitalize">{granularity}</span>
            </button>
          </div>

          {/* Weight Update & Train Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => updateWeights()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#efe9de] hover:bg-[#e8e0d2] dark:bg-[#252320] dark:hover:bg-[#383531] text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
              title="Apply one gradient descent update step"
            >
              <span>Update Weights</span>
            </button>
            <button
              onClick={() => trainN()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141413] dark:bg-[#faf9f5] hover:opacity-90 text-white dark:text-[#141413] text-xs font-medium shadow-xs transition-colors"
              title={`Train for ${trainEpochsCount} epochs`}
            >
              <TrendingDown size={14} className="text-[#cc785c]" />
              <span>Train ×{trainEpochsCount}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Advanced Training Drawer */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-[#e6dfd8] dark:border-[#383531] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#6c6a64] dark:text-[#a09d96]">Learning Rate (η)</span>
                <span className="font-mono font-bold text-[#cc785c]">{learningRate.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={0.01}
                max={1.0}
                step={0.01}
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[#6c6a64] dark:text-[#a09d96]">Epochs per Train click</span>
                <span className="font-mono font-bold">{trainEpochsCount}</span>
              </div>
              <input
                type="range"
                min={5}
                max={100}
                step={5}
                value={trainEpochsCount}
                onChange={(e) => setTrainEpochsCount(parseInt(e.target.value, 10))}
                className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

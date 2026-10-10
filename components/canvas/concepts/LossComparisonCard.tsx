'use client';

import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';

export const LossComparisonCard = memo(({ id, data, selected }: NodeProps) => {
  const [target, setTarget] = useState<number>(1);
  const [pred, setPred] = useState<number>(0.85);

  // Predictions bounded [0.01, 0.99] to prevent -log(0) infinity
  const p = Math.max(0.01, Math.min(0.99, pred));

  // Binary Cross-Entropy Loss: - [ y*log(p) + (1-y)*log(1-p) ]
  const bceLoss = target === 1 ? -Math.log(p) : -Math.log(1 - p);

  // Mean Squared Error (MSE): (p - target)^2
  const mseLoss = Math.pow(p - target, 2);

  // SVG Curve plot for p in [0.01, 0.99]
  const width = 340;
  const height = 120;
  const toX = (prob: number) => ((prob - 0.01) / 0.98) * width;
  const toY = (val: number) => height - Math.min(1, val / 4.0) * (height - 20) - 10;

  const bcePath: string[] = [];
  const msePath: string[] = [];
  for (let i = 0; i <= 50; i++) {
    const probeP = 0.02 + (i / 50) * 0.96;
    const bce = target === 1 ? -Math.log(probeP) : -Math.log(1 - probeP);
    const mse = Math.pow(probeP - target, 2);
    bcePath.push(`${i === 0 ? 'M' : 'L'} ${toX(probeP).toFixed(1)} ${toY(bce).toFixed(1)}`);
    msePath.push(`${i === 0 ? 'M' : 'L'} ${toX(probeP).toFixed(1)} ${toY(mse).toFixed(1)}`);
  }

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all select-none ${
        selected ? 'ring-2 ring-[#c64545] border-[#c64545]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#c64545]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#c64545]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">
          Cross-Entropy vs MSE Loss
        </span>
      </div>

      {/* Target Toggle */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-[#6c6a64] dark:text-[#a09d96]">True Class Target (y):</span>
        <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-0.5 rounded-lg">
          <button
            onClick={() => setTarget(1)}
            className={`px-3 py-1 rounded-md font-mono text-[11px] font-bold transition-colors ${
              target === 1
                ? 'bg-white dark:bg-[#1f1e1b] text-[#5db872] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96]'
            }`}
          >
            y = 1
          </button>
          <button
            onClick={() => setTarget(0)}
            className={`px-3 py-1 rounded-md font-mono text-[11px] font-bold transition-colors ${
              target === 0
                ? 'bg-white dark:bg-[#1f1e1b] text-[#c64545] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96]'
            }`}
          >
            y = 0
          </button>
        </div>
      </div>

      {/* Interactive Prediction Slider */}
      <div className="space-y-1 mb-2.5">
        <div className="flex items-center justify-between text-[11px]">
          <span>Prediction (ŷ = {pred.toFixed(2)})</span>
          <span className="font-mono text-[#8e8b82]">Confidence: {Math.round(pred * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.02}
          max={0.98}
          step={0.01}
          value={pred}
          onChange={(e) => setPred(parseFloat(e.target.value))}
          className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
        />
      </div>

      {/* SVG Comparison Curve */}
      <div className="rounded-xl bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] p-2 overflow-hidden">
        <svg width={width} height={height} className="w-full h-auto overflow-visible">
          {/* Subtle horizontal grid lines */}
          <line x1={0} y1={height - 10} x2={width} y2={height - 10} stroke="#efe9de" strokeWidth={1} />

          {/* Cross Entropy Path */}
          <path d={bcePath.join(' ')} fill="none" stroke="#c64545" strokeWidth={2.5} />

          {/* MSE Path */}
          <path d={msePath.join(' ')} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 3" />

          {/* Current Probe Marker */}
          <circle cx={toX(p)} cy={toY(bceLoss)} r={4} fill="#c64545" />
          <circle cx={toX(p)} cy={toY(mseLoss)} r={4} fill="#3b82f6" />
        </svg>

        <div className="flex items-center justify-between text-[10px] pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#c64545]" />
            <span className="text-[#c64545] font-semibold">Cross-Entropy: {bceLoss.toFixed(3)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#3b82f6] border-b border-dashed" />
            <span className="text-[#3b82f6] font-semibold">MSE: {mseLoss.toFixed(3)}</span>
          </div>
        </div>
      </div>

      {/* Explanation */}
      <p className="mt-2 text-[10px] text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
        Notice how Cross-Entropy penalizes confident wrong predictions steeply toward infinity, yielding steeper gradients that accelerate learning in classification tasks!
      </p>
    </div>
  );
});

LossComparisonCard.displayName = 'LossComparisonCard';

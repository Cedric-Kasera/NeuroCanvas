'use client';

import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';

export const RegularizationCard = memo(({ id, data, selected }: NodeProps) => {
  const [method, setMethod] = useState<'l1' | 'l2' | 'dropout'>('l1');
  const [strength, setStrength] = useState<number>(0.5);

  // Original unregularized weights
  const originalWeights = [1.8, 0.4, -1.2, 0.15];

  // Regulated weights
  const regularizedWeights = originalWeights.map((w) => {
    if (method === 'l1') {
      // Soft-thresholding: drives small weights to zero
      const sign = Math.sign(w);
      const mag = Math.max(0, Math.abs(w) - strength * 0.8);
      return sign * mag;
    } else if (method === 'l2') {
      // Weight decay: shrinks proportional to magnitude
      return w * (1 - strength * 0.5);
    } else {
      // Dropout: random zeroing with rate `strength`
      return w;
    }
  });

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all select-none ${
        selected ? 'ring-2 ring-[#8b5cf6] border-[#8b5cf6]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">
          Regularization & Dropout
        </span>
      </div>

      {/* Method selector tabs */}
      <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-1 rounded-lg mb-2.5">
        {[
          { id: 'l1', label: 'L1 Lasso (Sparsity)' },
          { id: 'l2', label: 'L2 Ridge (Decay)' },
          { id: 'dropout', label: 'Dropout (Noise)' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setMethod(item.id as any)}
            className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-colors ${
              method === item.id
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs font-semibold'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Parameter slider */}
      <div className="flex items-center justify-between text-[11px] text-[#6c6a64] dark:text-[#a09d96] mb-2">
        <span>{method === 'dropout' ? `Dropout Rate (p = ${strength.toFixed(2)})` : `Penalty λ = ${strength.toFixed(2)}`}</span>
        <input
          type="range"
          min={0.0}
          max={1.0}
          step={0.05}
          value={strength}
          onChange={(e) => setStrength(parseFloat(e.target.value))}
          className="w-28 h-1.5 accent-[#8b5cf6] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
        />
      </div>

      {/* Weights impact visualization */}
      <div className="rounded-xl bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] p-3 space-y-2">
        <div className="text-[10px] uppercase font-bold text-[#8e8b82] flex justify-between">
          <span>Synapse Weights w</span>
          <span>{method === 'l1' ? 'Diamond Contour |w|' : method === 'l2' ? 'Circle Contour w²' : 'Bernoulli Mask'}</span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {originalWeights.map((orig, i) => {
            const reg = regularizedWeights[i];
            const isZeroed = Math.abs(reg) < 0.001;

            return (
              <div
                key={i}
                className={`p-2 rounded-lg border text-center transition-all ${
                  isZeroed
                    ? 'border-[#c64545]/40 bg-[#fee2e2]/20 dark:bg-[#381a1a]/20'
                    : 'border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#252320]'
                }`}
              >
                <span className="text-[10px] font-mono text-[#8e8b82] block">w_{i + 1}</span>
                <span
                  className={`text-xs font-mono font-bold block my-0.5 ${
                    isZeroed ? 'text-[#c64545]' : 'text-[#8b5cf6]'
                  }`}
                >
                  {isZeroed ? '0.00' : reg.toFixed(2)}
                </span>
                <span className="text-[9px] text-[#8e8b82] line-through block">
                  orig: {orig.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Explanation banner */}
      <div className="mt-2.5 p-2 rounded-xl text-[11px] leading-relaxed bg-[#efe9de]/60 dark:bg-[#252320]/60 text-[#6c6a64] dark:text-[#a09d96]">
        {method === 'l1' &&
          'L1 adds λ·∑|w|. Its sharp diamond corners force irrelevant weights to exactly zero, performing automatic feature selection.'}
        {method === 'l2' &&
          'L2 adds ½λ·∑w². Its spherical contour pulls large weights smoothly toward zero without turning them completely off (weight decay).'}
        {method === 'dropout' &&
          `Dropout randomly mutes ${Math.round(strength * 100)}% of neurons every forward pass during training, preventing neurons from co-adapting.`}
      </div>
    </div>
  );
});

RegularizationCard.displayName = 'RegularizationCard';

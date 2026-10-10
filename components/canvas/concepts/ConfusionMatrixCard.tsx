import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';

export const ConfusionMatrixCard = memo(({ id, data, selected }: NodeProps) => {
  const [tp, setTp] = useState<number>(data?.tp !== undefined ? Number(data.tp) : 42);
  const [fp, setFp] = useState<number>(data?.fp !== undefined ? Number(data.fp) : 8);
  const [fn, setFn] = useState<number>(data?.fn !== undefined ? Number(data.fn) : 6);
  const [tn, setTn] = useState<number>(data?.tn !== undefined ? Number(data.tn) : 44);

  const total = tp + fp + fn + tn;
  const accuracy = total > 0 ? (tp + tn) / total : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
  const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all ${
        selected ? 'ring-2 ring-[#5db872] border-[#5db872]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5db872]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5db872]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">
          Confusion Matrix & Metrics
        </span>
      </div>

      {/* 2x2 Grid */}
      <div className="space-y-1 text-xs">
        <div className="grid grid-cols-2 gap-1.5 text-center">
          <div className="rounded-xl bg-[#eaf7ee] dark:bg-[#162e1c] p-2.5 border border-[#5db872]/30">
            <span className="text-[10px] uppercase font-bold text-[#5db872] block">True Positive (TP)</span>
            <span className="text-base font-mono font-bold text-[#141413] dark:text-[#faf9f5]">{tp}</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <button
                onClick={() => setTp((v) => Math.max(0, v - 1))}
                className="w-5 h-5 rounded bg-white dark:bg-[#252320] text-xs font-bold leading-none hover:bg-[#5db872] hover:text-white"
              >
                -
              </button>
              <button
                onClick={() => setTp((v) => v + 1)}
                className="w-5 h-5 rounded bg-white dark:bg-[#252320] text-xs font-bold leading-none hover:bg-[#5db872] hover:text-white"
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#fee2e2]/40 dark:bg-[#381a1a]/40 p-2.5 border border-[#c64545]/30">
            <span className="text-[10px] uppercase font-bold text-[#c64545] block">False Positive (FP)</span>
            <span className="text-base font-mono font-bold text-[#141413] dark:text-[#faf9f5]">{fp}</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <button
                onClick={() => setFp((v) => Math.max(0, v - 1))}
                className="w-5 h-5 rounded bg-white dark:bg-[#252320] text-xs font-bold leading-none hover:bg-[#c64545] hover:text-white"
              >
                -
              </button>
              <button
                onClick={() => setFp((v) => v + 1)}
                className="w-5 h-5 rounded bg-white dark:bg-[#252320] text-xs font-bold leading-none hover:bg-[#c64545] hover:text-white"
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#fee2e2]/40 dark:bg-[#381a1a]/40 p-2.5 border border-[#c64545]/30">
            <span className="text-[10px] uppercase font-bold text-[#c64545] block">False Negative (FN)</span>
            <span className="text-base font-mono font-bold text-[#141413] dark:text-[#faf9f5]">{fn}</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <button
                onClick={() => setFn((v) => Math.max(0, v - 1))}
                className="w-5 h-5 rounded bg-white dark:bg-[#252320] text-xs font-bold leading-none hover:bg-[#c64545] hover:text-white"
              >
                -
              </button>
              <button
                onClick={() => setFn((v) => v + 1)}
                className="w-5 h-5 rounded bg-white dark:bg-[#252320] text-xs font-bold leading-none hover:bg-[#c64545] hover:text-white"
              >
                +
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-[#eaf7ee] dark:bg-[#162e1c] p-2.5 border border-[#5db872]/30">
            <span className="text-[10px] uppercase font-bold text-[#5db872] block">True Negative (TN)</span>
            <span className="text-base font-mono font-bold text-[#141413] dark:text-[#faf9f5]">{tn}</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <button
                onClick={() => setTn((v) => Math.max(0, v - 1))}
                className="w-5 h-5 rounded bg-white dark:bg-[#252320] text-xs font-bold leading-none hover:bg-[#5db872] hover:text-white"
              >
                -
              </button>
              <button
                onClick={() => setTn((v) => v + 1)}
                className="w-5 h-5 rounded bg-white dark:bg-[#252320] text-xs font-bold leading-none hover:bg-[#5db872] hover:text-white"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Computed Summary Stats */}
      <div className="grid grid-cols-4 gap-1.5 mt-3 pt-2.5 border-t border-[#e6dfd8] dark:border-[#383531] text-center">
        <div>
          <span className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] block">Accuracy</span>
          <span className="font-mono font-bold text-xs text-[#cc785c]">{(accuracy * 100).toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] block">Precision</span>
          <span className="font-mono font-bold text-xs text-[#5db872]">{(precision * 100).toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] block">Recall</span>
          <span className="font-mono font-bold text-xs text-[#3b82f6]">{(recall * 100).toFixed(0)}%</span>
        </div>
        <div>
          <span className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] block">F1 Score</span>
          <span className="font-mono font-bold text-xs text-[#8b5cf6]">{f1.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
});

ConfusionMatrixCard.displayName = 'ConfusionMatrixCard';

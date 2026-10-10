import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';

export const OverfittingVisualizerCard = memo(({ id, data, selected }: NodeProps) => {
  const [complexity, setComplexity] = useState<'underfit' | 'balanced' | 'overfit'>('balanced');

  const configs = {
    underfit: {
      title: 'Underfitting (High Bias)',
      desc: 'Model is too rigid/simple (e.g. straight line for curved data). High training error & high testing error.',
      curve: 'M 10 90 L 290 30',
      color: '#3b82f6',
      badge: 'High Bias',
    },
    balanced: {
      title: 'Optimal Fit (Low Generalization Error)',
      desc: 'Learns the true underlying pattern while ignoring stochastic noise. Ideal test set performance.',
      curve: 'M 10 95 C 90 90, 110 30, 200 40 S 260 70, 290 25',
      color: '#5db872',
      badge: 'Balanced',
    },
    overfit: {
      title: 'Overfitting (High Variance)',
      desc: 'Model memorizes noise and outliers. Zero training loss but fails drastically on new unseen data.',
      curve: 'M 10 95 Q 35 15, 60 90 T 110 20 T 160 85 T 210 25 T 255 75 T 290 20',
      color: '#c64545',
      badge: 'High Variance',
    },
  };

  const points = [
    { x: 30, y: 85 },
    { x: 65, y: 75 },
    { x: 100, y: 40 },
    { x: 140, y: 55 },
    { x: 180, y: 42 },
    { x: 215, y: 50 },
    { x: 250, y: 65 },
    { x: 280, y: 28 },
  ];

  const current = configs[complexity];

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all ${
        selected ? 'ring-2 ring-[#8b5cf6] border-[#8b5cf6]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#8b5cf6]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#8b5cf6]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">
          Overfitting & Bias-Variance
        </span>
      </div>

      {/* Switcher */}
      <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-1 rounded-lg mb-2.5">
        {(['underfit', 'balanced', 'overfit'] as const).map((k) => (
          <button
            key={k}
            onClick={() => setComplexity(k)}
            className={`flex-1 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
              complexity === k
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            {k}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] p-1.5 overflow-hidden mb-2.5">
        <svg width={300} height={120} className="w-full h-auto">
          {/* Scatter Points */}
          {points.map((p, idx) => (
            <circle key={idx} cx={p.x} cy={p.y} r={3.5} fill="#cc785c" opacity={0.85} />
          ))}
          {/* Fitted Curve */}
          <path d={current.curve} fill="none" stroke={current.color} strokeWidth={2.5} />
        </svg>
      </div>

      <div className="rounded-xl bg-[#efe9de]/60 dark:bg-[#252320]/60 p-2.5 text-xs">
        <div className="flex items-center justify-between mb-0.5">
          <span className="font-bold text-[#141413] dark:text-[#faf9f5]">{current.title}</span>
          <span
            style={{ color: current.color }}
            className="text-[10px] font-mono font-bold uppercase tracking-wider"
          >
            {current.badge}
          </span>
        </div>
        <p className="text-[#6c6a64] dark:text-[#a09d96] leading-relaxed text-[11px]">{current.desc}</p>
      </div>
    </div>
  );
});

OverfittingVisualizerCard.displayName = 'OverfittingVisualizerCard';

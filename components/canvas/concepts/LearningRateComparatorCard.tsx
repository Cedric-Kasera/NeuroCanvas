import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';

export const LearningRateComparatorCard = memo(({ id, data, selected }: NodeProps) => {
  const [selectedLr, setSelectedLr] = useState<'low' | 'good' | 'high'>('good');

  const configs = {
    low: {
      lr: 0.01,
      title: 'Too Small (η = 0.01)',
      desc: 'Takes hundreds of epochs to crawl toward the minimum. Risks getting stuck on plateaus.',
      points: [4.2, 4.0, 3.82, 3.65, 3.49, 3.34, 3.2],
      color: '#3b82f6',
    },
    good: {
      lr: 0.25,
      title: 'Optimal (η = 0.25)',
      desc: 'Rapidly descends the gradient slope and settles smoothly at the global minimum.',
      points: [4.2, 2.5, 1.2, 0.45, 0.12, 0.02, 0.00],
      color: '#5db872',
    },
    high: {
      lr: 1.05,
      title: 'Too Large (η = 1.05)',
      desc: 'Overshoots the valley and oscillates wildly, causing training loss to explode to infinity.',
      points: [4.2, 2.1, 3.8, 1.4, 4.9, 0.8, 5.2],
      color: '#c64545',
    },
  };

  const current = configs[selectedLr];
  const width = 350;
  const height = 135;

  const toX = (idx: number) => (idx / (current.points.length - 1)) * width;
  const toY = (val: number) => height - (val / 5.5) * (height - 24) - 12;

  const path = current.points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p).toFixed(1)}`).join(' ');

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all ${
        selected ? 'ring-2 ring-[#cc785c] border-[#cc785c]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#cc785c]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#cc785c]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">
          Learning Rate Comparison
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-1 rounded-lg mb-2.5">
        {(['low', 'good', 'high'] as const).map((key) => (
          <button
            key={key}
            onClick={() => setSelectedLr(key)}
            className={`flex-1 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
              selectedLr === key
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            {key === 'low' ? 'Too Small' : key === 'good' ? 'Optimal' : 'Too High'}
          </button>
        ))}
      </div>

      {/* Mini curve */}
      <div className="rounded-xl bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] p-1.5 overflow-hidden mb-2.5">
        <svg width={width} height={height} className="w-full h-auto">
          <line x1={0} y1={height - 12} x2={width} y2={height - 12} stroke="#efe9de" strokeWidth={1} />
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#efe9de" strokeWidth={1} />
          <path d={path} fill="none" stroke={current.color} strokeWidth={2.5} />
          {current.points.map((p, i) => (
            <circle key={i} cx={toX(i)} cy={toY(p)} r={3} fill={current.color} />
          ))}
        </svg>
      </div>

      <div className="rounded-xl bg-[#efe9de]/60 dark:bg-[#252320]/60 p-2.5 text-xs">
        <span className="font-bold block text-[#141413] dark:text-[#faf9f5] mb-0.5">{current.title}</span>
        <p className="text-[#6c6a64] dark:text-[#a09d96] leading-relaxed text-[11px]">{current.desc}</p>
      </div>
    </div>
  );
});

LearningRateComparatorCard.displayName = 'LearningRateComparatorCard';

import React, { memo } from 'react';
import { NodeProps } from '@xyflow/react';
import { useSimStore } from '@/lib/state/simStore';

export const LossCurveCard = memo(({ id, data, selected }: NodeProps) => {
  const trainingHistory = useSimStore((s) => s.trainingHistory);

  // Fallback demo data if training has not begun yet
  const history = trainingHistory.length > 0 ? trainingHistory : [0.85, 0.65, 0.48, 0.32, 0.22, 0.15, 0.08, 0.04];

  const width = 350;
  const height = 160;
  const maxLoss = Math.max(1.0, ...history);
  const minLoss = 0;

  const toSvgX = (idx: number) => {
    if (history.length <= 1) return width / 2;
    return (idx / (history.length - 1)) * width;
  };
  const toSvgY = (loss: number) => {
    return height - ((loss - minLoss) / (maxLoss - minLoss)) * (height - 20) - 10;
  };

  const pathStr = history
    .map((val, idx) => `${idx === 0 ? 'M' : 'L'} ${toSvgX(idx).toFixed(1)} ${toSvgY(val).toFixed(1)}`)
    .join(' ');

  const currentLoss = history[history.length - 1];
  const startLoss = history[0];

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all ${
        selected ? 'ring-2 ring-[#c64545] border-[#c64545]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#c64545]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#c64545]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">Loss Curve</span>
      </div>

      <div className="rounded-xl bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] p-1.5 overflow-hidden">
        <svg width={width} height={height} className="w-full h-auto overflow-visible">
          {/* Subtle horizontal grid lines */}
          <line x1={0} y1={height - 10} x2={width} y2={height - 10} stroke="#efe9de" strokeWidth={1} />
          <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#efe9de" strokeWidth={1} />

          {/* Fill under curve */}
          <path
            d={`${pathStr} L ${toSvgX(history.length - 1)} ${height - 10} L 0 ${height - 10} Z`}
            fill="rgba(198, 69, 69, 0.08)"
          />

          {/* Stroke line */}
          <path d={pathStr} fill="none" stroke="#c64545" strokeWidth={2.5} />

          {/* Last dot */}
          <circle
            cx={toSvgX(history.length - 1)}
            cy={toSvgY(currentLoss)}
            r={4}
            fill="#c64545"
            stroke="#ffffff"
            strokeWidth={1.5}
          />
        </svg>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] block">Current Loss</span>
          <span className="font-mono font-bold text-[#c64545] tabular-nums">{currentLoss.toFixed(4)}</span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] block">Epochs</span>
          <span className="font-mono font-medium text-[#141413] dark:text-[#faf9f5] tabular-nums">{history.length}</span>
        </div>
      </div>
    </div>
  );
});

LossCurveCard.displayName = 'LossCurveCard';

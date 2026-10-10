import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';

export const GradientDescentCard = memo(({ id, data, selected }: NodeProps) => {
  const [lr, setLr] = useState<number>(data?.lr !== undefined ? Number(data.lr) : 0.25);
  const [pos, setPos] = useState<number>(data?.pos !== undefined ? Number(data.pos) : 2.2);
  const [stepCount, setStepCount] = useState<number>(0);

  // Parabolic loss landscape: L(w) = 0.5 * w^2
  // Gradient: dL/dw = w
  const currentLoss = 0.5 * pos * pos;
  const gradient = pos;

  const handleStep = () => {
    // w_new = w - lr * gradient
    const nextPos = pos - lr * gradient;
    setPos(Math.max(-3.5, Math.min(3.5, nextPos)));
    setStepCount((c) => c + 1);
  };

  const handleReset = () => {
    setPos(2.2);
    setStepCount(0);
  };

  // SVG coordinates: w in [-3, 3], Loss in [0, 5]
  const width = 350;
  const height = 155;
  const toSvgX = (w: number) => ((w + 3) / 6) * width;
  const toSvgY = (l: number) => height - (l / 5) * (height - 20) - 10;

  // Generate curve path
  const points: [number, number][] = [];
  for (let i = 0; i <= 40; i++) {
    const w = -3 + (i / 40) * 6;
    const l = 0.5 * w * w;
    points.push([toSvgX(w), toSvgY(l)]);
  }
  const bowlPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

  const ballX = toSvgX(pos);
  const ballY = toSvgY(currentLoss);

  // Behavior insight badge
  const behaviorNote =
    lr < 0.1
      ? 'Learning rate too slow (tiny steps)'
      : lr > 0.95
      ? 'Warning: Overshooting minimum!'
      : 'Optimal convergence';

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all ${
        selected ? 'ring-2 ring-[#e8a55a] border-[#e8a55a]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#e8a55a]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#e8a55a]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">Gradient Descent</span>
      </div>

      <div className="relative rounded-xl bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] p-1.5 overflow-hidden">
        <svg width={width} height={height} className="w-full h-auto overflow-visible">
          {/* Bowl path */}
          <path d={bowlPath} fill="none" stroke="#e8a55a" strokeWidth={2.5} />

          {/* Minima target tick */}
          <line
            x1={toSvgX(0)}
            y1={toSvgY(0)}
            x2={toSvgX(0)}
            y2={toSvgY(0) + 6}
            stroke="#5db872"
            strokeWidth={2}
          />

          {/* Gradient arrow from ball */}
          <line
            x1={ballX}
            y1={ballY}
            x2={ballX - Math.min(25, Math.max(-25, gradient * 12))}
            y2={ballY}
            stroke="#cc785c"
            strokeWidth={1.5}
            strokeDasharray="2 2"
          />

          {/* Ball */}
          <circle cx={ballX} cy={ballY} r={6} fill="#cc785c" stroke="#ffffff" strokeWidth={2} />
        </svg>

        <span className="absolute bottom-1 right-2 text-[9px] font-mono text-[#8e8b82]">Minima w=0</span>
      </div>

      <div className="mt-2 text-[11px] text-center text-[#6c6a64] dark:text-[#a09d96]">
        <span className={lr > 0.95 ? 'text-[#c64545] font-semibold' : 'text-[#5db872]'}>{behaviorNote}</span>
      </div>

      {/* Controls */}
      <div className="mt-2 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#6c6a64] dark:text-[#a09d96]">Learning Rate (η)</span>
          <span className="font-mono font-bold">{lr.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={0.02}
          max={1.1}
          step={0.02}
          value={lr}
          onChange={(e) => setLr(parseFloat(e.target.value))}
          className="w-full h-1.5 accent-[#e8a55a] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
        />

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleStep}
            className="flex-1 rounded-md bg-[#cc785c] hover:bg-[#a9583e] py-1 text-xs font-medium text-white transition-colors"
          >
            Step (-η·∇)
          </button>
          <button
            onClick={handleReset}
            className="rounded-md bg-[#efe9de] dark:bg-[#252320] hover:bg-[#e8e0d2] px-3 py-1 text-xs text-[#141413] dark:text-[#faf9f5] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="mt-2 pt-1 border-t border-[#e6dfd8] dark:border-[#383531] flex items-center justify-between text-[11px] text-[#6c6a64] dark:text-[#a09d96]">
        <span>Weight: <strong className="text-[#141413] dark:text-[#faf9f5] font-mono">{pos.toFixed(2)}</strong></span>
        <span>Loss: <strong className="text-[#c64545] font-mono">{currentLoss.toFixed(3)}</strong></span>
        <span>Steps: <strong className="font-mono">{stepCount}</strong></span>
      </div>
    </div>
  );
});

GradientDescentCard.displayName = 'GradientDescentCard';

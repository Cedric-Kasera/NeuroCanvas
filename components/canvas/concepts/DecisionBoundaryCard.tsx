import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';

interface Point {
  x1: number;
  x2: number;
  label: number;
}

const PRESETS: Record<string, { name: string; points: Point[] }> = {
  AND: {
    name: 'AND Gate',
    points: [
      { x1: 0, x2: 0, label: 0 },
      { x1: 1, x2: 0, label: 0 },
      { x1: 0, x2: 1, label: 0 },
      { x1: 1, x2: 1, label: 1 },
    ],
  },
  OR: {
    name: 'OR Gate',
    points: [
      { x1: 0, x2: 0, label: 0 },
      { x1: 1, x2: 0, label: 1 },
      { x1: 0, x2: 1, label: 1 },
      { x1: 1, x2: 1, label: 1 },
    ],
  },
  XOR: {
    name: 'XOR Gate',
    points: [
      { x1: 0, x2: 0, label: 0 },
      { x1: 1, x2: 0, label: 1 },
      { x1: 0, x2: 1, label: 1 },
      { x1: 1, x2: 1, label: 0 },
    ],
  },
};

export const DecisionBoundaryCard = memo(({ id, data, selected }: NodeProps) => {
  const [preset, setPreset] = useState<string>((data?.preset as string) || 'AND');
  const [w1, setW1] = useState<number>(data?.w1 !== undefined ? Number(data.w1) : 1.0);
  const [w2, setW2] = useState<number>(data?.w2 !== undefined ? Number(data.w2) : 1.0);
  const [bias, setBias] = useState<number>(data?.bias !== undefined ? Number(data.bias) : -1.5);

  const dataset = PRESETS[preset] || PRESETS.AND;

  // Geometry: SVG coordinates for box [ -0.3, 1.3 ] in both dimensions
  const size = 245;
  const minCoord = -0.3;
  const maxCoord = 1.3;
  const toSvg = (v: number) => ((v - minCoord) / (maxCoord - minCoord)) * size;
  const toSvgY = (v: number) => size - ((v - minCoord) / (maxCoord - minCoord)) * size;

  // Decision line endpoints: w1*x1 + w2*x2 + b = 0 => x2 = (-w1*x1 - b) / w2
  const xLeft = minCoord;
  const xRight = maxCoord;
  const yLeft = Math.abs(w2) > 0.001 ? (-w1 * xLeft - bias) / w2 : 0;
  const yRight = Math.abs(w2) > 0.001 ? (-w1 * xRight - bias) / w2 : 0;

  // Evaluate classification accuracy
  let correctCount = 0;
  for (const pt of dataset.points) {
    const val = w1 * pt.x1 + w2 * pt.x2 + bias;
    const pred = val >= 0 ? 1 : 0;
    if (pred === pt.label) correctCount++;
  }
  const isFullySeparated = correctCount === dataset.points.length;

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all ${
        selected ? 'ring-2 ring-[#5db8a6] border-[#5db8a6]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5db8a6]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5db8a6]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">Decision Boundary</span>
      </div>

      {/* Preset tabs */}
      <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-1 rounded-lg mb-2.5">
        {['AND', 'OR', 'XOR'].map((p) => (
          <button
            key={p}
            onClick={() => setPreset(p)}
            className={`flex-1 py-1 text-[11px] font-medium rounded-md transition-colors ${
              preset === p
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 2D Scatter Plot & Decision Line */}
      <div className="flex items-center justify-center p-1 bg-white dark:bg-[#181715] rounded-xl border border-[#e6dfd8] dark:border-[#383531]">
        <svg width={size} height={size} className="overflow-hidden">
          {/* Grid lines */}
          <line x1={toSvg(0)} y1={0} x2={toSvg(0)} y2={size} stroke="#efe9de" strokeWidth={1} />
          <line x1={toSvg(1)} y1={0} x2={toSvg(1)} y2={size} stroke="#efe9de" strokeWidth={1} />
          <line x1={0} y1={toSvgY(0)} x2={size} y2={toSvgY(0)} stroke="#efe9de" strokeWidth={1} />
          <line x1={0} y1={toSvgY(1)} x2={size} y2={toSvgY(1)} stroke="#efe9de" strokeWidth={1} />

          {/* Decision boundary line */}
          <line
            x1={toSvg(xLeft)}
            y1={toSvgY(yLeft)}
            x2={toSvg(xRight)}
            y2={toSvgY(yRight)}
            stroke="#cc785c"
            strokeWidth={2.5}
          />

          {/* Scatter points */}
          {dataset.points.map((pt, idx) => {
            const isOne = pt.label === 1;
            const ptVal = w1 * pt.x1 + w2 * pt.x2 + bias;
            const pred = ptVal >= 0 ? 1 : 0;
            const isCorrect = pred === pt.label;

            return (
              <g key={idx}>
                <circle
                  cx={toSvg(pt.x1)}
                  cy={toSvgY(pt.x2)}
                  r={isOne ? 7 : 6}
                  fill={isOne ? '#5db872' : '#c64545'}
                  stroke={isCorrect ? '#ffffff' : '#141413'}
                  strokeWidth={2}
                />
                <text
                  x={toSvg(pt.x1) + 10}
                  y={toSvgY(pt.x2) + 4}
                  fontSize={10}
                  className="font-mono font-bold fill-[#6c6a64] dark:fill-[#a09d96]"
                >
                  {isOne ? '1' : '0'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Accuracy Status */}
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-[#6c6a64] dark:text-[#a09d96]">Separation:</span>
        <span
          className={`font-semibold ${
            isFullySeparated ? 'text-[#5db872]' : preset === 'XOR' ? 'text-[#c64545]' : 'text-[#e8a55a]'
          }`}
        >
          {isFullySeparated
            ? '✓ Separable (4/4)'
            : preset === 'XOR'
            ? '✕ XOR Impossible'
            : `${correctCount}/4 Correct`}
        </span>
      </div>

      {/* Sliders */}
      <div className="mt-2 space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#6c6a64] dark:text-[#a09d96]">Weight w₁</span>
          <span className="font-mono font-bold">{w1.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={-3}
          max={3}
          step={0.1}
          value={w1}
          onChange={(e) => setW1(parseFloat(e.target.value))}
          className="w-full h-1 accent-[#5db8a6] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#6c6a64] dark:text-[#a09d96]">Weight w₂</span>
          <span className="font-mono font-bold">{w2.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={-3}
          max={3}
          step={0.1}
          value={w2}
          onChange={(e) => setW2(parseFloat(e.target.value))}
          className="w-full h-1 accent-[#5db8a6] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
        />

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#6c6a64] dark:text-[#a09d96]">Bias b</span>
          <span className="font-mono font-bold">{bias.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={-3}
          max={3}
          step={0.1}
          value={bias}
          onChange={(e) => setBias(parseFloat(e.target.value))}
          className="w-full h-1 accent-[#5db8a6] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
        />
      </div>
    </div>
  );
});

DecisionBoundaryCard.displayName = 'DecisionBoundaryCard';

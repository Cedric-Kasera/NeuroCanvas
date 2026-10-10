import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { ActivationFn } from '@/lib/engine/types';
import { activate, activateDerivative } from '@/lib/engine/activations';

export const ActivationPlotCard = memo(({ id, data, selected }: NodeProps) => {
  const [activeFn, setActiveFn] = useState<ActivationFn>((data?.activeFn as ActivationFn) || 'sigmoid');
  const [xVal, setXVal] = useState<number>(0.8);
  const [showDerivative, setShowDerivative] = useState<boolean>(true);

  const fx = activate(activeFn, xVal);
  const dfx = activateDerivative(activeFn, xVal, fx);

  // SVG coordinate transformation
  // Domain: x in [-4, 4], Range: y in [-1.5, 2.5]
  const width = 360;
  const height = 185;
  const toSvgX = (x: number) => ((x + 4) / 8) * width;
  const toSvgY = (y: number) => height - ((y + 1.5) / 4) * height;

  const pointsCount = 60;
  const pathPoints: [number, number][] = [];
  const derivPoints: [number, number][] = [];

  for (let i = 0; i <= pointsCount; i++) {
    const x = -4 + (i / pointsCount) * 8;
    const y = activate(activeFn, x);
    const dy = activateDerivative(activeFn, x, y);
    pathPoints.push([toSvgX(x), toSvgY(y)]);
    derivPoints.push([toSvgX(x), toSvgY(dy)]);
  }

  const curvePath = pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');
  const derivPath = derivPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ');

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
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">Activation Plot</span>
      </div>

      {/* Function switcher tabs */}
      <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-1 rounded-lg mb-2.5">
        {(['sigmoid', 'relu', 'tanh', 'step', 'identity'] as ActivationFn[]).map((fn) => (
          <button
            key={fn}
            onClick={() => setActiveFn(fn)}
            className={`flex-1 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
              activeFn === fn
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            {fn === 'identity' ? 'linear' : fn}
          </button>
        ))}
      </div>

      {/* SVG Canvas */}
      <div className="relative rounded-xl bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] p-1.5 overflow-hidden">
        <svg width={width} height={height} className="w-full h-auto overflow-visible">
          {/* Axis lines */}
          <line x1={0} y1={toSvgY(0)} x2={width} y2={toSvgY(0)} stroke="#e6dfd8" strokeWidth={1} />
          <line x1={toSvgX(0)} y1={0} x2={toSvgX(0)} y2={height} stroke="#e6dfd8" strokeWidth={1} />

          {/* Derivative curve */}
          {showDerivative && (
            <path d={derivPath} fill="none" stroke="#5db8a6" strokeWidth={1.5} strokeDasharray="3 3" opacity={0.8} />
          )}

          {/* Primary activation curve */}
          <path d={curvePath} fill="none" stroke="#cc785c" strokeWidth={2.5} />

          {/* Interactive probe circle */}
          <circle cx={toSvgX(xVal)} cy={toSvgY(fx)} r={5} fill="#cc785c" stroke="#ffffff" strokeWidth={2} />
        </svg>

        {/* Legend */}
        <div className="absolute top-2 right-2 flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-[#cc785c] font-medium">
            <span className="w-2.5 h-0.5 bg-[#cc785c] inline-block" /> f(x)
          </span>
          <button
            onClick={() => setShowDerivative(!showDerivative)}
            className={`flex items-center gap-1 font-medium transition-opacity ${
              showDerivative ? 'text-[#5db8a6] opacity-100' : 'text-[#8e8b82] opacity-50'
            }`}
          >
            <span className="w-2.5 h-0.5 border-t border-dashed border-[#5db8a6] inline-block" /> f′(x)
          </button>
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="mt-2.5 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6c6a64] dark:text-[#a09d96]">Probe x:</span>
          <span className="font-mono font-bold text-xs tabular-nums">{xVal.toFixed(2)}</span>
        </div>
        <input
          type="range"
          min={-3.5}
          max={3.5}
          step={0.1}
          value={xVal}
          onChange={(e) => setXVal(parseFloat(e.target.value))}
          className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
        />
      </div>

      {/* Values readout */}
      <div className="grid grid-cols-2 gap-2 mt-2 pt-1 border-t border-[#e6dfd8] dark:border-[#383531] text-xs">
        <div>
          <span className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] block">f(x) value:</span>
          <span className="font-mono font-bold text-[#cc785c] tabular-nums">{fx.toFixed(3)}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] block">Derivative f′(x):</span>
          <span className="font-mono font-bold text-[#5db8a6] tabular-nums">{dfx.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
});

ActivationPlotCard.displayName = 'ActivationPlotCard';

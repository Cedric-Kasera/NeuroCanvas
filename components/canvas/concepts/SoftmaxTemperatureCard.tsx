'use client';

import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';

export const SoftmaxTemperatureCard = memo(({ id, data, selected }: NodeProps) => {
  const [z1, setZ1] = useState<number>(2.0);
  const [z2, setZ2] = useState<number>(1.2);
  const [z3, setZ3] = useState<number>(0.1);
  const [temperature, setTemperature] = useState<number>(1.0);

  // Softmax with temperature: p_i = exp(z_i / T) / sum(exp(z_j / T))
  const t = Math.max(0.05, temperature);
  const exp1 = Math.exp(z1 / t);
  const exp2 = Math.exp(z2 / t);
  const exp3 = Math.exp(z3 / t);
  const sumExp = exp1 + exp2 + exp3;

  const p1 = exp1 / sumExp;
  const p2 = exp2 / sumExp;
  const p3 = exp3 / sumExp;

  const classes = [
    { label: 'Class A (Cat)', z: z1, p: p1, setZ: setZ1, color: '#cc785c' },
    { label: 'Class B (Dog)', z: z2, p: p2, setZ: setZ2, color: '#5db8a6' },
    { label: 'Class C (Bird)', z: z3, p: p3, setZ: setZ3, color: '#8b5cf6' },
  ];

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all select-none ${
        selected ? 'ring-2 ring-[#5db8a6] border-[#5db8a6]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#5db8a6]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5db8a6]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">
          Softmax & Temperature
        </span>
      </div>

      {/* Temperature Slider */}
      <div className="rounded-xl bg-[#efe9de]/50 dark:bg-[#252320]/50 p-2.5 mb-2.5 space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">
            Temperature (T): <span className="font-mono text-[#5db8a6]">{temperature.toFixed(2)}</span>
          </span>
          <span className="text-[10px] text-[#8e8b82]">
            {temperature < 0.4 ? 'Cold (Sharp / Argmax)' : temperature > 2.0 ? 'Hot (Uniform Entropy)' : 'Standard'}
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={3.0}
          step={0.05}
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full h-1.5 accent-[#5db8a6] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
        />
      </div>

      {/* Logits & Probabilities Grid */}
      <div className="space-y-2">
        {classes.map((cls, i) => (
          <div
            key={i}
            className="p-2 rounded-xl bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] space-y-1"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium">{cls.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[#8e8b82]">logit z = {cls.z.toFixed(1)}</span>
                <span className="font-mono font-bold text-xs" style={{ color: cls.color }}>
                  {(cls.p * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Probability Progress Bar */}
            <div className="h-2 w-full bg-[#efe9de] dark:bg-[#252320] rounded-full overflow-hidden">
              <div
                style={{ width: `${cls.p * 100}%`, backgroundColor: cls.color }}
                className="h-full rounded-full transition-all duration-200"
              />
            </div>

            {/* Slider to adjust logit */}
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[9px] text-[#8e8b82]">Adjust z:</span>
              <input
                type="range"
                min={-2}
                max={4}
                step={0.1}
                value={cls.z}
                onChange={(e) => cls.setZ(parseFloat(e.target.value))}
                className="flex-1 h-1 accent-[#8e8b82] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Pedagogical Note */}
      <p className="mt-2.5 text-[10px] text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
        Softmax maps unconstrained logits z into valid normalized probabilities (sum = 100%). Lowering temperature T toward 0 concentrates all probability into the maximum logit (argmax greedy sampling).
      </p>
    </div>
  );
});

SoftmaxTemperatureCard.displayName = 'SoftmaxTemperatureCard';

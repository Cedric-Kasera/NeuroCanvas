'use client';

import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';

export const GradientFlowCard = memo(({ id, data, selected }: NodeProps) => {
  const [activation, setActivation] = useState<'sigmoid' | 'tanh' | 'relu' | 'leakyRelu'>('sigmoid');
  const [layerCount, setLayerCount] = useState<number>(6);

  // Derivative magnitudes per activation
  const derivMax: Record<string, number> = {
    sigmoid: 0.25, // max sigmoid' is 0.25
    tanh: 0.65,    // max tanh' is 1.0, typical ~0.6-0.7
    relu: 1.0,     // ReLU derivative is 1.0 for positive
    leakyRelu: 0.95,
  };

  const factor = derivMax[activation];
  const layerGradients = Array.from({ length: layerCount }, (_, i) => {
    // Backprop multiplies derivatives backward from output (layer N) to input (layer 1)
    const depthFromOutput = layerCount - 1 - i;
    return Math.pow(factor, depthFromOutput);
  });

  const isVanishing = activation === 'sigmoid' || (activation === 'tanh' && layerCount > 5);

  return (
    <div
      className={`relative min-w-[390px] rounded-2xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all select-none ${
        selected ? 'ring-2 ring-[#cc785c] border-[#cc785c]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2 mb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#cc785c]" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#cc785c]">Concept</span>
        </div>
        <span className="text-xs font-serif font-medium text-[#6c6a64] dark:text-[#a09d96]">
          Vanishing & Exploding Gradients
        </span>
      </div>

      {/* Activation switcher */}
      <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-1 rounded-lg mb-2.5">
        {(['sigmoid', 'tanh', 'relu', 'leakyRelu'] as const).map((fn) => (
          <button
            key={fn}
            onClick={() => setActivation(fn)}
            className={`flex-1 py-1 text-[11px] font-medium rounded-md capitalize transition-colors ${
              activation === fn
                ? 'bg-white dark:bg-[#1f1e1b] text-[#141413] dark:text-[#faf9f5] shadow-xs font-semibold'
                : 'text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413]'
            }`}
          >
            {fn === 'leakyRelu' ? 'Leaky' : fn}
          </button>
        ))}
      </div>

      {/* Depth slider */}
      <div className="flex items-center justify-between text-[11px] text-[#6c6a64] dark:text-[#a09d96] mb-2">
        <span>Network Depth: {layerCount} Layers</span>
        <input
          type="range"
          min={3}
          max={8}
          value={layerCount}
          onChange={(e) => setLayerCount(parseInt(e.target.value))}
          className="w-28 h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
        />
      </div>

      {/* Gradient magnitude bar chart per layer */}
      <div className="rounded-xl bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] p-3 space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-[#8e8b82]">
          <span>Layer 1 (Earliest)</span>
          <span className="font-mono">Gradient Flow ∇L</span>
          <span>Layer {layerCount} (Output)</span>
        </div>

        <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${layerCount}, minmax(0, 1fr))` }}>
          {layerGradients.map((grad, idx) => {
            const heightPercent = Math.max(4, Math.min(100, grad * 100));
            const isZeroed = grad < 0.01;

            return (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div className="h-20 w-full bg-[#efe9de] dark:bg-[#252320] rounded-md flex flex-col justify-end p-0.5 overflow-hidden">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-xs transition-all duration-300 ${
                      isZeroed
                        ? 'bg-[#c64545]'
                        : grad < 0.2
                        ? 'bg-[#e8a55a]'
                        : 'bg-[#5db872]'
                    }`}
                  />
                </div>
                <span className="text-[9px] font-mono font-semibold text-[#8e8b82]">L{idx + 1}</span>
                <span className="text-[9px] font-mono text-[#6c6a64] dark:text-[#a09d96]">
                  {grad < 0.001 ? '≈0' : grad.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Insight banner */}
      <div
        className={`mt-2.5 p-2 rounded-xl text-[11px] leading-relaxed border ${
          isVanishing
            ? 'bg-[#fee2e2]/30 dark:bg-[#381a1a]/30 border-[#c64545]/30 text-[#c64545]'
            : 'bg-[#eaf7ee] dark:bg-[#162e1c] border-[#5db872]/30 text-[#5db872]'
        }`}
      >
        {isVanishing
          ? `⚠️ Vanishing gradient: Sigmoid derivatives max out at 0.25. Multiplied ${layerCount} times, the signal drops to ${layerGradients[0].toFixed(5)}, halting training in early layers.`
          : `✓ Healthy gradient flow: ${activation.toUpperCase()} derivatives maintain constant magnitude, enabling deep backpropagation through all layers.`}
      </div>
    </div>
  );
});

GradientFlowCard.displayName = 'GradientFlowCard';

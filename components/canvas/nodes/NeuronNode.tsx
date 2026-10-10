'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { ActivationFn } from '@/lib/engine/types';
import { X, Sparkles } from 'lucide-react';

export const NeuronNode = memo(({ id, data, selected }: NodeProps) => {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const highlightedNodeIds = useCanvasStore((s) => s.highlightedNodeIds);
  const isHighlighted = highlightedNodeIds.includes(id);

  const label = (data?.label as string) || 'Neuron';
  const bias = Number(data?.bias ?? 0.0);
  const activation = ((data?.activation as string) || 'sigmoid') as ActivationFn;

  const computedZ = data?.computedZ !== undefined ? Number(data.computedZ) : undefined;
  const computedA = data?.computedA !== undefined ? Number(data.computedA) : undefined;
  const computedDz = data?.computedDz !== undefined ? Number(data.computedDz) : undefined;

  // Background intensity calculated from activation output [0..1]
  const intensity = computedA !== undefined ? Math.max(0, Math.min(1, (computedA + 1) / 2)) : 0.1;

  const handleBiasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) updateNodeData(id, { bias: val });
  };

  const handleActivationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateNodeData(id, { activation: e.target.value });
  };

  return (
    <div
      className={`relative group min-w-[200px] rounded-2xl border bg-white dark:bg-[#1f1e1b] p-3 text-[#141413] dark:text-[#faf9f5] shadow-xs transition-all duration-200 ${
        selected ? 'ring-2 ring-[#cc785c] border-[#cc785c]' : 'border-[#e2dbd2] dark:border-[#383531]'
      } ${isHighlighted ? 'ring-4 ring-[#cc785c]/50 shadow-xl scale-105' : ''}`}
      style={{
        boxShadow:
          computedA !== undefined
            ? `0 0 18px rgba(204, 120, 92, ${0.15 + intensity * 0.4})`
            : undefined,
      }}
    >
      {/* On-canvas Direct Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeNodes([id]);
        }}
        className="absolute -top-2 -right-2 z-20 w-4 h-4 rounded-full bg-[#141413] text-white dark:bg-[#faf9f5] dark:text-[#141413] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-sm"
        title="Remove neuron from canvas"
      >
        <X size={10} />
      </button>

      {/* Input Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-[#6c6a64] !border-2 !border-white dark:!border-[#1f1e1b] shadow-sm hover:scale-125 transition-transform"
      />

      {/* Header: Label + Prominent Bias Badge */}
      <div className="flex items-center justify-between border-b border-[#ece7e1] dark:border-[#383531] pb-1.5 mb-2">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full transition-colors ${
              computedA !== undefined ? 'bg-[#cc785c] animate-pulse' : 'bg-[#a09d96]'
            }`}
          />
          <span className="text-[11px] font-bold text-[#141413] dark:text-[#faf9f5] truncate max-w-[90px]">
            {label}
          </span>
        </div>

        {/* Bias Badge */}
        <span
          className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#f7f5f0] dark:bg-[#252320] border border-[#e2dbd2] dark:border-[#383531] text-[#cc785c]"
          title={`Neuron bias: ${bias.toFixed(2)}`}
        >
          b: {bias >= 0 ? `+${bias.toFixed(2)}` : bias.toFixed(2)}
        </span>
      </div>

      <div className="space-y-2">
        {/* Activation Function selector & Bias slider */}
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#6c6a64] dark:text-[#a09d96] text-[11px]">Activation</span>
          <select
            value={activation}
            onChange={handleActivationChange}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag nopan text-[11px] bg-[#f7f5f0] dark:bg-[#252320] border border-[#e2dbd2] dark:border-[#383531] rounded-md px-1.5 py-0.5 font-mono text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] cursor-pointer"
          >
            <option value="sigmoid">Sigmoid</option>
            <option value="relu">ReLU</option>
            <option value="tanh">Tanh</option>
            <option value="step">Step</option>
            <option value="identity">Linear</option>
          </select>
        </div>

        {/* Bias slider */}
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1 text-[#6c6a64] dark:text-[#a09d96]">
            <span>Bias slider</span>
            <span className="font-mono font-bold text-[#141413] dark:text-[#faf9f5]">
              {bias >= 0 ? `+${bias.toFixed(2)}` : bias.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={-3}
            max={3}
            step={0.1}
            value={bias}
            onChange={handleBiasChange}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag nopan w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
          />
        </div>

        {/* Live Activation & Sum Values */}
        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
          <div className="rounded-lg bg-[#f7f5f0] dark:bg-[#252320] p-1.5 text-center">
            <span className="block text-[9px] uppercase tracking-wider text-[#6c6a64] dark:text-[#a09d96]">Sum z</span>
            <span className="font-mono text-xs font-bold text-[#141413] dark:text-[#faf9f5] tabular-nums">
              {computedZ !== undefined ? computedZ.toFixed(2) : '—'}
            </span>
          </div>
          <div
            className={`rounded-lg p-1.5 text-center transition-all ${
              computedA !== undefined
                ? 'bg-[#cc785c]/10 border border-[#cc785c]/30 text-[#cc785c]'
                : 'bg-[#f7f5f0] dark:bg-[#252320] text-[#cc785c]'
            }`}
          >
            <span className="block text-[9px] uppercase tracking-wider font-semibold">Active a</span>
            <span className="font-mono text-xs font-bold tabular-nums">
              {computedA !== undefined ? computedA.toFixed(3) : '—'}
            </span>
          </div>
        </div>

        {/* Gradient dL/dz if computed in backward pass */}
        {computedDz !== undefined && (
          <div className="rounded-md border border-[#e8a55a]/40 bg-[#e8a55a]/10 px-2 py-0.5 flex items-center justify-between text-[11px]">
            <span className="text-[#8e8b82] dark:text-[#a09d96]">∂L/∂z</span>
            <span className="font-mono font-semibold text-[#cc785c] tabular-nums">
              {computedDz.toFixed(4)}
            </span>
          </div>
        )}
      </div>

      {/* Output Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-[#cc785c] !border-2 !border-white dark:!border-[#1f1e1b] shadow-sm hover:scale-125 transition-transform"
      />
    </div>
  );
});

NeuronNode.displayName = 'NeuronNode';

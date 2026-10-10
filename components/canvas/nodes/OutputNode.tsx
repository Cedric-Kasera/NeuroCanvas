'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { X } from 'lucide-react';

export const OutputNode = memo(({ id, data, selected }: NodeProps) => {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const highlightedNodeIds = useCanvasStore((s) => s.highlightedNodeIds);
  const isHighlighted = highlightedNodeIds.includes(id);

  const label = (data?.label as string) || 'Output';
  const target = data?.target !== undefined ? Number(data.target) : 1.0;
  const computedA = data?.computedA !== undefined ? Number(data.computedA) : undefined;
  const diff = computedA !== undefined ? computedA - target : undefined;

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) updateNodeData(id, { target: val });
  };

  return (
    <div
      className={`relative group min-w-[190px] rounded-2xl border bg-white dark:bg-[#1f1e1b] p-3 text-[#141413] dark:text-[#faf9f5] shadow-xs transition-all duration-200 ${
        selected ? 'ring-2 ring-[#5db872] border-[#5db872]' : 'border-[#e2dbd2] dark:border-[#383531]'
      } ${isHighlighted ? 'ring-4 ring-[#5db872]/40 shadow-lg scale-105' : ''}`}
    >
      {/* On-canvas Direct Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeNodes([id]);
        }}
        className="absolute -top-2 -right-2 z-20 w-4 h-4 rounded-full bg-[#141413] text-white dark:bg-[#faf9f5] dark:text-[#141413] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-sm"
        title="Remove output node"
      >
        <X size={10} />
      </button>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-[#6c6a64] !border-2 !border-white dark:!border-[#1f1e1b] shadow-sm hover:scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-[#ece7e1] dark:border-[#383531] pb-1.5 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#5db872]">Output</span>
        <span className="text-xs font-mono font-medium text-[#6c6a64] dark:text-[#a09d96]">{label}</span>
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-lg bg-[#f7f5f0] dark:bg-[#252320] p-1.5 text-center">
            <span className="block text-[9px] uppercase tracking-wider text-[#6c6a64] dark:text-[#a09d96]">Prediction ŷ</span>
            <span className="font-mono text-sm font-bold text-[#5db872] tabular-nums">
              {computedA !== undefined ? computedA.toFixed(3) : '—'}
            </span>
          </div>

          <div className="rounded-lg bg-[#f7f5f0] dark:bg-[#252320] p-1.5 text-center">
            <span className="block text-[9px] uppercase tracking-wider text-[#6c6a64] dark:text-[#a09d96]">Target t</span>
            <span className="font-mono text-sm font-bold text-[#141413] dark:text-[#faf9f5] tabular-nums">
              {target.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-0.5">
          <span className="text-[#6c6a64] dark:text-[#a09d96] text-[11px]">Target slider</span>
          <input
            type="range"
            min={-2}
            max={2}
            step={0.1}
            value={target}
            onChange={handleTargetChange}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag nopan w-24 h-1.5 accent-[#5db872] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
          />
        </div>

        {diff !== undefined && (
          <div className="rounded-md border border-[#e2dbd2] dark:border-[#383531] px-2 py-0.5 flex items-center justify-between text-[11px]">
            <span className="text-[#6c6a64] dark:text-[#a09d96]">Delta (ŷ - t)</span>
            <span className={`font-mono font-bold tabular-nums ${Math.abs(diff) < 0.05 ? 'text-[#5db872]' : 'text-[#c64545]'}`}>
              {diff >= 0 ? `+${diff.toFixed(3)}` : diff.toFixed(3)}
            </span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-[#5db872] !border-2 !border-white dark:!border-[#1f1e1b] shadow-sm hover:scale-125 transition-transform"
      />
    </div>
  );
});

OutputNode.displayName = 'OutputNode';

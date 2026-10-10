'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { X } from 'lucide-react';

export const ActivationNode = memo(({ id, data, selected }: NodeProps) => {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const highlightedNodeIds = useCanvasStore((s) => s.highlightedNodeIds);
  const isHighlighted = highlightedNodeIds.includes(id);

  const fn = (data?.activation as string) || 'sigmoid';
  const computedA = data?.computedA !== undefined ? Number(data.computedA) : undefined;

  return (
    <div
      className={`relative group min-w-[150px] rounded-2xl border bg-white dark:bg-[#1f1e1b] p-3 text-[#141413] dark:text-[#faf9f5] shadow-xs transition-all duration-200 ${
        selected ? 'ring-2 ring-[#e8a55a] border-[#e8a55a]' : 'border-[#e2dbd2] dark:border-[#383531]'
      } ${isHighlighted ? 'ring-4 ring-[#e8a55a]/40 shadow-lg scale-105' : ''}`}
    >
      {/* On-canvas Direct Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeNodes([id]);
        }}
        className="absolute -top-2 -right-2 z-20 w-4 h-4 rounded-full bg-[#141413] text-white dark:bg-[#faf9f5] dark:text-[#141413] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-sm"
        title="Remove activation card"
      >
        <X size={10} />
      </button>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-[#6c6a64] !border-2 !border-white dark:!border-[#1f1e1b] shadow-sm hover:scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-[#ece7e1] dark:border-[#383531] pb-1.5 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#e8a55a]">Activation</span>
      </div>

      <div className="space-y-2">
        <select
          value={fn}
          onChange={(e) => updateNodeData(id, { activation: e.target.value })}
          onPointerDown={(e) => e.stopPropagation()}
          className="nodrag nopan w-full text-xs bg-[#f7f5f0] dark:bg-[#252320] border border-[#e2dbd2] dark:border-[#383531] rounded-md px-2 py-1 font-mono text-[#141413] dark:text-[#faf9f5] cursor-pointer"
        >
          <option value="sigmoid">Sigmoid</option>
          <option value="relu">ReLU</option>
          <option value="tanh">Tanh</option>
          <option value="step">Step</option>
          <option value="identity">Linear</option>
        </select>

        {computedA !== undefined && (
          <div className="rounded bg-[#f7f5f0] dark:bg-[#252320] px-2 py-1 flex items-center justify-between text-[11px]">
            <span className="text-[#6c6a64] dark:text-[#a09d96]">f(z)</span>
            <span className="font-mono font-bold text-[#e8a55a]">{computedA.toFixed(3)}</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-[#e8a55a] !border-2 !border-white dark:!border-[#1f1e1b] shadow-sm hover:scale-125 transition-transform"
      />
    </div>
  );
});

ActivationNode.displayName = 'ActivationNode';

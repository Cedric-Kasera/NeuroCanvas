'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useSimStore } from '@/lib/state/simStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { X } from 'lucide-react';

export const LossNode = memo(({ id, data, selected }: NodeProps) => {
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const highlightedNodeIds = useCanvasStore((s) => s.highlightedNodeIds);
  const isHighlighted = highlightedNodeIds.includes(id);
  const currentState = useSimStore((s) => s.currentState);

  const lossValue = currentState?.loss !== undefined ? currentState.loss : undefined;

  return (
    <div
      className={`relative group min-w-[170px] rounded-2xl border bg-white dark:bg-[#1f1e1b] p-3 text-[#141413] dark:text-[#faf9f5] shadow-xs transition-all duration-200 ${
        selected ? 'ring-2 ring-[#c64545] border-[#c64545]' : 'border-[#e2dbd2] dark:border-[#383531]'
      } ${isHighlighted ? 'ring-4 ring-[#c64545]/40 shadow-lg scale-105' : ''}`}
    >
      {/* On-canvas Direct Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeNodes([id]);
        }}
        className="absolute -top-2 -right-2 z-20 w-4 h-4 rounded-full bg-[#141413] text-white dark:bg-[#faf9f5] dark:text-[#141413] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-sm"
        title="Remove loss node"
      >
        <X size={10} />
      </button>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-[#c64545] !border-2 !border-white dark:!border-[#1f1e1b] shadow-sm hover:scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-[#ece7e1] dark:border-[#383531] pb-1.5 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#c64545]">Loss Function</span>
        <span className="text-[11px] font-mono font-medium text-[#6c6a64] dark:text-[#a09d96]">MSE</span>
      </div>

      <div className="space-y-1.5 text-center py-1">
        <span className="text-[10px] text-[#6c6a64] dark:text-[#a09d96] block">Mean Squared Error</span>
        <div className="rounded-xl bg-[#f7f5f0] dark:bg-[#252320] py-2">
          <span className="font-mono text-base font-bold text-[#c64545] tabular-nums">
            {lossValue !== undefined ? lossValue.toFixed(4) : '—'}
          </span>
        </div>
      </div>
    </div>
  );
});

LossNode.displayName = 'LossNode';

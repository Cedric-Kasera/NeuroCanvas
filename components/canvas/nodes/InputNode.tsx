'use client';

import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { X, Sliders } from 'lucide-react';

export const InputNode = memo(({ id, data, selected }: NodeProps) => {
  const [showSlider, setShowSlider] = useState(false);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const highlightedNodeIds = useCanvasStore((s) => s.highlightedNodeIds);
  const isHighlighted = highlightedNodeIds.includes(id);

  const label = (data?.label as string) || 'x';
  const val = Number(data?.value ?? 1.0);
  const computedA = data?.computedA !== undefined ? Number(data.computedA) : val;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = parseFloat(e.target.value);
    if (!isNaN(newVal)) {
      updateNodeData(id, { value: newVal });
    }
  };

  return (
    <div className="relative group">
      {/* Direct on-canvas remove button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          removeNodes([id]);
        }}
        className="absolute -top-1.5 -right-1.5 z-20 w-4 h-4 rounded-full bg-[#141413] text-white dark:bg-[#faf9f5] dark:text-[#141413] flex items-center justify-center opacity-0 group-hover:opacity-100 hover:scale-110 transition-all shadow-sm"
        title="Remove input node"
      >
        <X size={10} />
      </button>

      {/* Value Badge on top */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white dark:bg-[#252320] border border-[#e6dfd8] dark:border-[#383531] text-[#cc785c] shadow-2xs">
          x = {val >= 0 ? `+${val.toFixed(2)}` : val.toFixed(2)}
        </span>
      </div>

      {/* Circular Node Body */}
      <div
        onClick={() => setShowSlider(!showSlider)}
        className={`w-14 h-14 rounded-full border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 select-none ${
          selected
            ? 'ring-2 ring-[#cc785c] border-[#cc785c] bg-white dark:bg-[#252320]'
            : 'border-[#e2dbd2] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] hover:border-[#cc785c]'
        } ${
          isHighlighted
            ? 'ring-4 ring-[#cc785c]/40 shadow-lg scale-110 bg-[#faf5f0] dark:bg-[#2e2622]'
            : 'shadow-xs'
        }`}
        style={{
          boxShadow: isHighlighted ? '0 0 14px rgba(204, 120, 92, 0.45)' : undefined,
        }}
        title={`Input ${label}: ${val.toFixed(2)} (Click to adjust)`}
      >
        <span className="text-[9px] uppercase font-semibold tracking-wider text-[#cc785c]">
          in
        </span>
        <span className="font-mono text-xs font-bold text-[#141413] dark:text-[#faf9f5]">
          {label.replace('Input ', '')}
        </span>
      </div>

      {/* Interactive Quick Slider Popover */}
      {showSlider && (
        <div
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="nodrag nopan absolute top-16 left-1/2 -translate-x-1/2 z-50 min-w-[150px] rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] p-2.5 shadow-xl text-center"
        >
          <div className="flex items-center justify-between text-[10px] text-[#6c6a64] dark:text-[#a09d96] mb-1">
            <span>Input value (x)</span>
            <button
              onClick={() => setShowSlider(false)}
              className="text-[#cc785c] hover:opacity-80"
            >
              ✕
            </button>
          </div>
          <input
            type="range"
            min={-3}
            max={3}
            step={0.1}
            value={val}
            onChange={handleChange}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag nopan w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
          />
          <div className="flex items-center justify-between mt-1 text-[11px] font-mono font-bold">
            <span className="text-[#141413] dark:text-[#faf9f5]">{val.toFixed(2)}</span>
            {data?.computedA !== undefined && (
              <span className="text-[#cc785c]">a: {computedA.toFixed(2)}</span>
            )}
          </div>
        </div>
      )}

      {/* Output connection handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[#cc785c] !border-2 !border-white dark:!border-[#181715] shadow-sm hover:scale-125 transition-transform"
      />
    </div>
  );
});

InputNode.displayName = 'InputNode';

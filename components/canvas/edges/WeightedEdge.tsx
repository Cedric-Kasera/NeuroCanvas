'use client';

import React, { memo, useState } from 'react';
import { BaseEdge, getBezierPath, EdgeProps, EdgeLabelRenderer } from '@xyflow/react';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { X, Sliders } from 'lucide-react';

export const WeightedEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
  selected,
  source,
}: EdgeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);
  const removeEdges = useCanvasStore((s) => s.removeEdges);
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);
  const highlightedEdgeIds = useCanvasStore((s) => s.highlightedEdgeIds);
  const nodes = useCanvasStore((s) => s.nodes);

  const isPlaying = useSimStore((s) => s.isPlaying);
  const currentState = useSimStore((s) => s.currentState);

  const weight = Number(data?.weight ?? 1.0);
  const isHighlighted = highlightedEdgeIds.includes(id);

  // Retrieve source activation value to compute transmitted signal w * a
  const sourceNode = nodes.find((n) => n.id === source);
  const sourceA =
    sourceNode?.data?.computedA !== undefined
      ? Number(sourceNode.data.computedA)
      : sourceNode?.data?.value !== undefined
      ? Number(sourceNode.data.value)
      : undefined;
  const transmittedSignal = sourceA !== undefined ? weight * sourceA : undefined;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Color & width according to weight
  const isPositive = weight >= 0;
  const absWeight = Math.abs(weight);
  const strokeWidth = Math.min(5.5, Math.max(1.8, absWeight * 2.2));
  const strokeColor = isPositive ? (weight > 0 ? '#cc785c' : '#8e8b82') : '#c64545';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) updateEdgeData(id, { weight: val });
  };

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        className={isPlaying ? 'edge-running-flow' : ''}
        style={{
          ...style,
          strokeWidth,
          stroke: isHighlighted ? '#e8a55a' : strokeColor,
          opacity: isHighlighted ? 1 : isPlaying ? 0.95 : 0.85,
          filter: isHighlighted
            ? 'drop-shadow(0 0 6px rgba(232, 165, 90, 0.8))'
            : isPlaying
            ? 'drop-shadow(0 0 4px rgba(204, 120, 92, 0.4))'
            : undefined,
          transition: 'stroke 0.2s, stroke-width 0.2s',
        }}
      />

      {/* Animated travelling particle during simulation */}
      {(isPlaying || isHighlighted) && (
        <>
          <circle r={4.5} fill={isHighlighted ? '#e8a55a' : '#cc785c'} filter="drop-shadow(0 0 4px #cc785c)">
            <animateMotion dur={isPlaying ? '1.1s' : '0.7s'} repeatCount="indefinite" path={edgePath} />
          </circle>
          {/* Second trailing particle */}
          {isPlaying && (
            <circle r={3} fill="#5db8a6" opacity={0.8}>
              <animateMotion
                dur="1.1s"
                begin="0.55s"
                repeatCount="indefinite"
                path={edgePath}
              />
            </circle>
          )}
        </>
      )}

      {/* Weight badge & tool-tip */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className="relative group/edge">
            <button
              onClick={() => {
                setSelectedEdgeId(id);
                setIsEditing(!isEditing);
              }}
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-mono font-bold shadow-2xs transition-all hover:scale-110 ${
                isPositive
                  ? 'bg-white dark:bg-[#252320] text-[#141413] dark:text-[#faf9f5] border border-[#cc785c]/40'
                  : 'bg-white dark:bg-[#252320] text-[#c64545] border border-[#c64545]/40'
              } ${selected || isHighlighted ? 'ring-2 ring-[#cc785c]' : ''}`}
              title={`Synapse weight: ${weight.toFixed(2)}${
                transmittedSignal !== undefined ? ` · Signal flow: ${transmittedSignal.toFixed(3)}` : ''
              }`}
            >
              <span className="text-[9px] text-[#8e8b82]">w:</span>
              <span>{weight >= 0 ? `+${weight.toFixed(2)}` : weight.toFixed(2)}</span>
            </button>

            {/* Quick delete connection icon on hover */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeEdges([id]);
              }}
              className="absolute -top-2 -right-3 w-4 h-4 rounded-full bg-[#141413] text-white dark:bg-[#faf9f5] dark:text-[#141413] flex items-center justify-center opacity-0 group-hover/edge:opacity-100 hover:scale-110 transition-all shadow-sm"
              title="Remove connection"
            >
              <X size={10} />
            </button>

            {/* Quick edit slider card */}
            {isEditing && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute top-7 left-1/2 -translate-x-1/2 z-50 min-w-[150px] rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] p-2.5 shadow-xl text-center"
              >
                <div className="flex items-center justify-between text-[10px] text-[#6c6a64] dark:text-[#a09d96] mb-1">
                  <span>Weight (w)</span>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs text-[#cc785c] hover:underline"
                  >
                    ✕
                  </button>
                </div>
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.05}
                  value={weight}
                  onChange={handleSliderChange}
                  className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
                />
                <div className="flex items-center justify-between mt-1 text-[11px] font-mono">
                  <span className="font-bold text-[#141413] dark:text-[#faf9f5]">
                    {weight.toFixed(2)}
                  </span>
                  {transmittedSignal !== undefined && (
                    <span className="text-[#5db8a6] text-[10px]" title="Transmitted signal w · a">
                      w·a: {transmittedSignal.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

WeightedEdge.displayName = 'WeightedEdge';

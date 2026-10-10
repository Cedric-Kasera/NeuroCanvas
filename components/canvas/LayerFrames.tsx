'use client';

import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { useUIStore } from '@/lib/state/uiStore';
import { Layer } from '@/lib/engine/types';
import { CircleDot, Grid, CheckCircle2, Plus, GripVertical } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';

const LAYER_COLORS: Record<string, { border: string; bg: string; badge: string; text: string }> = {
  input: {
    border: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.04)',
    badge: '#3b82f6',
    text: '#ffffff',
  },
  hidden_0: {
    border: '#8b5cf6',
    bg: 'rgba(139, 92, 246, 0.04)',
    badge: '#8b5cf6',
    text: '#ffffff',
  },
  hidden_1: {
    border: '#a855f7',
    bg: 'rgba(168, 85, 247, 0.04)',
    badge: '#a855f7',
    text: '#ffffff',
  },
  output: {
    border: '#10b981',
    bg: 'rgba(16, 185, 129, 0.04)',
    badge: '#10b981',
    text: '#ffffff',
  },
};

export function LayerFrames() {
  const layers = useCanvasStore((s) => s.layers);
  const nodes = useCanvasStore((s) => s.nodes);
  const showLayerFrames = useCanvasStore((s) => s.settings.showLayerFrames ?? true);
  const selectedLayerId = useCanvasStore((s) => s.selectedLayerId);
  const setSelectedLayerId = useCanvasStore((s) => s.setSelectedLayerId);
  const addNodeToLayer = useCanvasStore((s) => s.addNodeToLayer);
  const moveLayer = useCanvasStore((s) => s.moveLayer);
  const pushHistorySnapshot = useCanvasStore((s) => s.pushHistorySnapshot);
  const highlightedLayerIds = useCanvasStore((s) => s.highlightedLayerIds);
  const setRightTab = useUIStore((s) => s.setRightTab);
  const setRightOpen = useUIStore((s) => s.setRightOpen);
  const { getZoom } = useReactFlow();

  const [draggingLayerId, setDraggingLayerId] = useState<string | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number } | null>(null);

  const steps = useSimStore((s) => s.steps);
  const cursor = useSimStore((s) => s.cursor);
  const currentStep = cursor >= 0 && cursor < steps.length ? steps[cursor] : null;

  // Window-level smooth pointer tracking for 60fps drag
  useEffect(() => {
    if (!draggingLayerId) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!dragStartRef.current) return;
      const zoom = getZoom() || 1;
      const deltaX = (e.clientX - dragStartRef.current.clientX) / zoom;
      const deltaY = (e.clientY - dragStartRef.current.clientY) / zoom;

      if (Math.abs(deltaX) >= 0.5 || Math.abs(deltaY) >= 0.5) {
        moveLayer(draggingLayerId, deltaX, deltaY);
        dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
      }
    };

    const handleWindowPointerUp = () => {
      dragStartRef.current = null;
      setDraggingLayerId(null);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('pointercancel', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('pointercancel', handleWindowPointerUp);
    };
  }, [draggingLayerId, getZoom, moveLayer]);

  // Handle Dragging Layer through Badge
  const handleBadgePointerDown = useCallback(
    (e: React.PointerEvent, layerId: string) => {
      if (e.button !== 0) return; // Left mouse button only
      e.stopPropagation();
      e.preventDefault();

      pushHistorySnapshot();
      dragStartRef.current = { clientX: e.clientX, clientY: e.clientY };
      setDraggingLayerId(layerId);
      setSelectedLayerId(layerId);
    },
    [pushHistorySnapshot, setSelectedLayerId]
  );

  // Compute bounding box for each layer with wider, comfortable padding for breathability
  const frames = useMemo(() => {
    if (!showLayerFrames || layers.length === 0) return [];

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));

    return layers
      .map((layer, index) => {
        const memberNodes = layer.nodeIds
          .map((id) => nodeMap.get(id))
          .filter((n): n is NonNullable<typeof n> => !!n);

        if (memberNodes.length === 0) return null;

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (const n of memberNodes) {
          const w = (n.measured?.width || 200);
          const h = (n.measured?.height || 100);
          const x = n.position.x;
          const y = n.position.y;

          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x + w > maxX) maxX = x + w;
          if (y + h > maxY) maxY = y + h;
        }

        // Bounding box + wider padding for airy, breathable design:
        // top 56px (for badge clearance), left/right 52px, bottom 48px
        const padX = 52;
        const padTop = 56;
        const padBottom = 48;

        const left = minX - padX;
        const top = minY - padTop;
        const width = maxX - minX + padX * 2;
        const height = maxY - minY + padTop + padBottom;

        // Color theme
        let colorKey: string = layer.kind;
        if (layer.kind === 'hidden') {
          colorKey = `hidden_${index % 2}`;
        }
        const colors = LAYER_COLORS[colorKey] || LAYER_COLORS.hidden_0;

        const label =
          layer.label ||
          (layer.kind === 'input'
            ? 'Input Layer'
            : layer.kind === 'output'
            ? 'Output Layer'
            : `Hidden Layer ${index + 1}`);

        return {
          id: layer.id,
          layer,
          left,
          top,
          width,
          height,
          colors,
          label,
          count: memberNodes.length,
        };
      })
      .filter((f): f is NonNullable<typeof f> => !!f);
  }, [layers, nodes, showLayerFrames]);

  if (frames.length === 0) return null;

  return (
    <div className="react-flow__layer-frames pointer-events-none absolute inset-0 z-0 overflow-visible">
      {frames.map((f) => {
        const isSelected = selectedLayerId === f.id;
        const isDragging = draggingLayerId === f.id;
        const isHighlighted =
          highlightedLayerIds.includes(f.id) ||
          currentStep?.layerId === f.id;

        return (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              left: `${f.left}px`,
              top: `${f.top}px`,
              width: `${f.width}px`,
              height: `${f.height}px`,
              backgroundColor: f.colors.bg,
              borderColor: isHighlighted || isSelected ? f.colors.border : `${f.colors.border}4D`,
              boxShadow: isHighlighted || isDragging ? `0 0 32px ${f.colors.border}44` : undefined,
            }}
            /* pointer-events-none ensures all nodes, sliders, inputs, handles inside remain completely clickable and interactive */
            className={`rounded-[28px] border-[1.5px] transition-all duration-150 pointer-events-none select-none ${
              isHighlighted ? 'scale-[1.01] animate-pulse' : ''
            } ${isSelected ? 'ring-2 ring-offset-2 ring-[#cc785c] dark:ring-offset-[#141413]' : ''} ${
              isDragging ? 'opacity-90 shadow-2xl' : ''
            }`}
          >
            {/* Top Badge: Draggable handle & selection trigger with pointer-events-auto */}
            <div
              style={{
                left: '50%',
                transform: 'translate(-50%, -50%)',
              }}
              className="absolute top-0 z-20 flex items-center gap-1.5 pointer-events-auto select-none"
            >
              <div
                onPointerDown={(e) => handleBadgePointerDown(e, f.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedLayerId(f.id);
                  setRightTab('inspector');
                  setRightOpen(true);
                }}
                style={{
                  backgroundColor: f.colors.badge,
                  color: f.colors.text,
                }}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold shadow-md border border-white/80 dark:border-[#181715] hover:scale-105 active:scale-95 transition-all cursor-grab active:cursor-grabbing ${
                  isSelected ? 'ring-2 ring-white shadow-lg' : ''
                } ${isDragging ? 'cursor-grabbing scale-105 ring-2 ring-white shadow-xl' : ''}`}
                title={`Drag badge to reposition ${f.label} · Click to inspect`}
              >
                <GripVertical size={13} className="opacity-80 -ml-0.5 cursor-grab" />
                {f.layer.kind === 'input' && <CircleDot size={12} />}
                {f.layer.kind === 'hidden' && <Grid size={12} />}
                {f.layer.kind === 'output' && <CheckCircle2 size={12} />}
                <span>{f.label}</span>
                <span className="opacity-90 font-mono text-[10px]">· ×{f.count}</span>
              </div>

              {/* Quick Add Node to this layer button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addNodeToLayer(f.id);
                }}
                style={{
                  backgroundColor: f.colors.badge,
                  color: f.colors.text,
                }}
                className="flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shadow-md border border-white/80 dark:border-[#181715] hover:scale-110 active:scale-95 transition-transform"
                title={`Add node inside ${f.label}`}
              >
                <Plus size={13} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

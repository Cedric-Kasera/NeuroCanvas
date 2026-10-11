'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  Node,
  Edge,
  ViewportPortal,
  OnNodeDrag,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { LayerFrames } from './LayerFrames';

import { useCanvasStore } from '@/lib/state/canvasStore';
import { useUIStore } from '@/lib/state/uiStore';
import { useSimStore } from '@/lib/state/simStore';
import { useLessonStore } from '@/lib/state/lessonStore';

import { InputNode } from './nodes/InputNode';
import { NeuronNode } from './nodes/NeuronNode';
import { ActivationNode } from './nodes/ActivationNode';
import { OutputNode } from './nodes/OutputNode';
import { LossNode } from './nodes/LossNode';
import { DatasetNode } from './nodes/DatasetNode';

import { ActivationPlotCard } from './concepts/ActivationPlotCard';
import { DecisionBoundaryCard } from './concepts/DecisionBoundaryCard';
import { LossCurveCard } from './concepts/LossCurveCard';
import { GradientDescentCard } from './concepts/GradientDescentCard';
import { NoteCard } from './concepts/NoteCard';
import { ConfusionMatrixCard } from './concepts/ConfusionMatrixCard';
import { LearningRateComparatorCard } from './concepts/LearningRateComparatorCard';
import { OverfittingVisualizerCard } from './concepts/OverfittingVisualizerCard';
import { GradientFlowCard } from './concepts/GradientFlowCard';
import { RegularizationCard } from './concepts/RegularizationCard';
import { SoftmaxTemperatureCard } from './concepts/SoftmaxTemperatureCard';
import { LossComparisonCard } from './concepts/LossComparisonCard';

import { WeightedEdge } from './edges/WeightedEdge';
import { Plus, Cpu, ArrowRightCircle, CheckCircle, Zap, Layers, Grid } from 'lucide-react';

const nodeTypes = {
  inputNode: InputNode,
  input: InputNode,
  neuronNode: NeuronNode,
  neuron: NeuronNode,
  activationNode: ActivationNode,
  activation: ActivationNode,
  outputNode: OutputNode,
  output: OutputNode,
  lossNode: LossNode,
  loss: LossNode,
  datasetNode: DatasetNode,
  activationPlotCard: ActivationPlotCard,
  decisionBoundaryCard: DecisionBoundaryCard,
  lossCurveCard: LossCurveCard,
  gradientDescentCard: GradientDescentCard,
  noteCard: NoteCard,
  confusionMatrixCard: ConfusionMatrixCard,
  learningRateComparatorCard: LearningRateComparatorCard,
  overfittingVisualizerCard: OverfittingVisualizerCard,
  gradientFlowCard: GradientFlowCard,
  regularizationCard: RegularizationCard,
  softmaxTemperatureCard: SoftmaxTemperatureCard,
  lossComparisonCard: LossComparisonCard,
};

const edgeTypes = {
  weightedEdge: WeightedEdge,
  default: WeightedEdge,
};

function InnerCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getViewport, fitView } = useReactFlow();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; flowX: number; flowY: number } | null>(null);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const setSelectedNodeId = useCanvasStore((s) => s.setSelectedNodeId);
  const setSelectedEdgeId = useCanvasStore((s) => s.setSelectedEdgeId);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const removeEdges = useCanvasStore((s) => s.removeEdges);
  const addNode = useCanvasStore((s) => s.addNode);
  const groupNodesIntoLayer = useCanvasStore((s) => s.groupNodesIntoLayer);
  const updateNodePositions = useCanvasStore((s) => s.updateNodePositions);
  const layers = useCanvasStore((s) => s.layers);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const settings = useCanvasStore((s) => s.settings);

  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const showToast = useUIStore((s) => s.showToast);

  const prevNodesLength = useRef(nodes.length);
  const userHasZoomedRef = useRef(false);
  const isAutoFittingRef = useRef(false);
  const prevZoomRef = useRef<number | null>(null);

  const currentLessonId = useLessonStore((s) => s.currentLessonId);
  const stepIndex = useLessonStore((s) => s.stepIndex);

  // Reset user zoom override when changing lessons or lesson steps
  useEffect(() => {
    userHasZoomedRef.current = false;
    prevNodesLength.current = nodes.length;
  }, [currentLessonId, stepIndex, nodes.length]);

  // Auto-resize canvas to show all nodes whenever a new one is added ONLY,
  // unless the user has specifically zoomed in or out manually.
  useEffect(() => {
    if (nodes.length > prevNodesLength.current) {
      if (!userHasZoomedRef.current) {
        isAutoFittingRef.current = true;
        const timer = setTimeout(() => {
          fitView({ padding: 0.22, duration: 320 });
          const endTimer = setTimeout(() => {
            isAutoFittingRef.current = false;
          }, 360);
          return () => clearTimeout(endTimer);
        }, 50);
        prevNodesLength.current = nodes.length;
        return () => clearTimeout(timer);
      }
    }
    prevNodesLength.current = nodes.length;
  }, [nodes.length, fitView]);

  const renderedNodes = React.useMemo(() => {
    if (selectedNodeIds.length <= 1) return nodes;
    const selectedSet = new Set(selectedNodeIds);
    return nodes.map((n) => ({
      ...n,
      selected: selectedSet.has(n.id) || n.selected,
    }));
  }, [nodes, selectedNodeIds]);

  const onMove = useCallback((_event: any, viewport: { x: number; y: number; zoom: number }) => {
    if (!isAutoFittingRef.current && prevZoomRef.current !== null) {
      // User specifically changed zoom
      if (Math.abs(viewport.zoom - prevZoomRef.current) > 0.005) {
        userHasZoomedRef.current = true;
      }
    }
    prevZoomRef.current = viewport.zoom;
  }, []);

  const theme = useUIStore((s) => s.theme);
  const setShortcutsModalOpen = useUIStore((s) => s.setShortcutsModalOpen);
  const setRightTab = useUIStore((s) => s.setRightTab);
  const setRightOpen = useUIStore((s) => s.setRightOpen);

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      if (event.ctrlKey || event.metaKey) {
        event.stopPropagation();
        setSelectedNodeIds((prev) => {
          if (prev.includes(node.id)) {
            const next = prev.filter((id) => id !== node.id);
            setSelectedNodeId(next.length > 0 ? next[next.length - 1] : null);
            return next;
          } else {
            const next = [...prev, node.id];
            setSelectedNodeId(node.id);
            return next;
          }
        });
        return;
      }

      setSelectedNodeIds([node.id]);
      setSelectedNodeId(node.id);
      setRightTab('inspector');
      setRightOpen(true);
      setContextMenu(null);
    },
    [setSelectedNodeId, setRightTab, setRightOpen]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      setSelectedNodeIds([]);
      setSelectedEdgeId(edge.id);
      setRightTab('inspector');
      setRightOpen(true);
      setContextMenu(null);
    },
    [setSelectedEdgeId, setRightTab, setRightOpen]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setContextMenu(null);
  }, [setSelectedNodeId, setSelectedEdgeId]);

  // Dynamic drag pushing: when a node inside a layer is dragged towards borders,
  // push downstream layers or nodes outwards smoothly to make room.
  const onNodeDrag: OnNodeDrag = useCallback(
    (_event, draggedNode) => {
      const activeLayers = layers;
      if (activeLayers.length === 0) return;

      // Find if dragged node belongs to a layer
      const enclosingLayer = activeLayers.find((l) => l.nodeIds.includes(draggedNode.id));
      if (!enclosingLayer) return;

      const memberNodes = enclosingLayer.nodeIds
        .map((id) => (id === draggedNode.id ? draggedNode : nodes.find((n) => n.id === id)))
        .filter((n): n is NonNullable<typeof n> => !!n);

      let maxLayerX = -Infinity;
      for (const n of memberNodes) {
        const w = (n.measured?.width || 200);
        if (n.position.x + w > maxLayerX) {
          maxLayerX = n.position.x + w;
        }
      }

      // Check all other nodes to the right of this layer
      // If any node is closer than 80px buffer from maxLayerX, push it smoothly
      const buffer = 80;
      const thresholdX = maxLayerX + buffer;
      const positionsToUpdate: { id: string; x: number; y: number }[] = [];

      for (const otherNode of nodes) {
        if (enclosingLayer.nodeIds.includes(otherNode.id)) continue;
        if (otherNode.position.x >= enclosingLayer.nodeIds.map(id => nodes.find(n => n.id === id)?.position.x || 0).reduce((a, b) => Math.min(a, b), Infinity)) {
          if (otherNode.position.x < thresholdX) {
            const shift = thresholdX - otherNode.position.x;
            positionsToUpdate.push({
              id: otherNode.id,
              x: otherNode.position.x + shift,
              y: otherNode.position.y,
            });
          }
        }
      }

      if (positionsToUpdate.length > 0) {
        updateNodePositions(positionsToUpdate);
      }
    },
    [layers, nodes, updateNodePositions]
  );

  // Group multiple selected nodes into a layer
  const handleGroupSelectedNodes = useCallback(() => {
    if (selectedNodeIds.length === 0) return;
    const res = groupNodesIntoLayer(selectedNodeIds);
    if (!res.success) {
      showToast(res.error || 'Cannot group nodes', 'error');
    } else {
      showToast('Layer successfully created from selected nodes!', 'success');
      setSelectedNodeIds([]);
    }
  }, [selectedNodeIds, groupNodesIntoLayer, showToast]);

  // Right-click context menu on canvas pane
  const onPaneContextMenu = useCallback(
    (event: MouseEvent | React.MouseEvent) => {
      event.preventDefault();
      const pos = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      setContextMenu({
        x: event.clientX,
        y: event.clientY,
        flowX: pos.x,
        flowY: pos.y,
      });
    },
    [screenToFlowPosition]
  );

  // Quick add at center of canvas view
  const handleQuickAdd = (type: string, customPos?: { x: number; y: number }) => {
    if (customPos) {
      addNode(type, customPos);
    } else {
      const vp = getViewport();
      // Estimate center of flow
      const centerPos = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      addNode(type, {
        x: centerPos.x + (Math.random() * 60 - 30),
        y: centerPos.y + (Math.random() * 60 - 30),
      });
    }
    setContextMenu(null);
  };

  // Drag and drop from Library onto Canvas
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/reactflow-nodetype');
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(nodeType, position);
    },
    [screenToFlowPosition, addNode]
  );

  // Global Keyboard Shortcuts
  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const { selectedNodeId, selectedEdgeId } = useCanvasStore.getState();
        if (selectedNodeId) removeNodes([selectedNodeId]);
        if (selectedEdgeId) removeEdges([selectedEdgeId]);
      } else if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        if (event.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if (event.key === '?') {
        event.preventDefault();
        setShortcutsModalOpen(true);
      }
    },
    [removeNodes, removeEdges, undo, redo, setShortcutsModalOpen]
  );

  return (
    <div
      ref={reactFlowWrapper}
      className="w-full h-full relative outline-none select-none"
      onKeyDown={onKeyDown}
      tabIndex={0}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* On-Canvas Direct Node Creation Toolbar */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 p-1 rounded-2xl bg-white/95 dark:bg-[#181715]/95 border border-[#e2dbd2] dark:border-[#383531] shadow-md backdrop-blur-xs">
        <span className="text-[10px] uppercase font-bold text-[#cc785c] px-2 py-0.5 tracking-wider hidden sm:inline">
          Add:
        </span>
        <button
          onClick={() => handleQuickAdd('inputNode')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#faf9f5] dark:bg-[#252320] hover:bg-[#efe9de] dark:hover:bg-[#383531] border border-[#e6dfd8] dark:border-[#383531] text-[11px] font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
          title="Add Input node directly on canvas"
        >
          <Plus size={11} className="text-[#cc785c]" />
          <span>Input</span>
        </button>
        <button
          onClick={() => handleQuickAdd('neuronNode')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-[11px] font-medium text-white shadow-2xs transition-colors"
          title="Add Neuron node directly on canvas"
        >
          <Plus size={11} />
          <span>Neuron</span>
        </button>
        <button
          onClick={() => handleQuickAdd('outputNode')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#faf9f5] dark:bg-[#252320] hover:bg-[#efe9de] dark:hover:bg-[#383531] border border-[#e6dfd8] dark:border-[#383531] text-[11px] font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
          title="Add Output node directly on canvas"
        >
          <Plus size={11} className="text-[#5db872]" />
          <span>Output</span>
        </button>
        <button
          onClick={() => handleQuickAdd('lossNode')}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#faf9f5] dark:bg-[#252320] hover:bg-[#efe9de] dark:hover:bg-[#383531] border border-[#e6dfd8] dark:border-[#383531] text-[11px] font-medium text-[#141413] dark:text-[#faf9f5] transition-colors hidden md:flex"
          title="Add Loss node directly on canvas"
        >
          <Plus size={11} className="text-[#c64545]" />
          <span>Loss</span>
        </button>

        {/* Group into Layer button when multiple nodes selected */}
        {selectedNodeIds.length > 1 && (
          <button
            onClick={handleGroupSelectedNodes}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#8b5cf6] hover:bg-[#7c3aed] text-white text-[11px] font-bold shadow-sm transition-all animate-pulse"
            title="Group selected nodes into a new layer frame"
          >
            <Grid size={12} />
            <span>Group ({selectedNodeIds.length}) into Layer</span>
          </button>
        )}
      </div>

      {/* Right-click Context Menu */}
      {contextMenu && (
        <div
          style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y }}
          className="z-50 min-w-[160px] rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] p-1.5 shadow-2xl text-xs space-y-0.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#8e8b82]">
            Create on Canvas
          </div>
          <button
            onClick={() => handleQuickAdd('neuronNode', { x: contextMenu.flowX, y: contextMenu.flowY })}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] flex items-center justify-between"
          >
            <span>Neuron Node</span>
            <span className="text-[10px] text-[#cc785c] font-mono">f(z)</span>
          </button>
          <button
            onClick={() => handleQuickAdd('inputNode', { x: contextMenu.flowX, y: contextMenu.flowY })}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] flex items-center justify-between"
          >
            <span>Input Node</span>
            <span className="text-[10px] text-[#6c6a64] font-mono">x</span>
          </button>
          <button
            onClick={() => handleQuickAdd('outputNode', { x: contextMenu.flowX, y: contextMenu.flowY })}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] flex items-center justify-between"
          >
            <span>Output Node</span>
            <span className="text-[10px] text-[#5db872] font-mono">ŷ</span>
          </button>
          <button
            onClick={() => handleQuickAdd('lossNode', { x: contextMenu.flowX, y: contextMenu.flowY })}
            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] flex items-center justify-between"
          >
            <span>Loss (MSE)</span>
            <span className="text-[10px] text-[#c64545] font-mono">L</span>
          </button>

          {selectedNodeIds.length > 1 && (
            <div className="pt-1 border-t border-[#e6dfd8] dark:border-[#383531]">
              <button
                onClick={() => {
                  handleGroupSelectedNodes();
                  setContextMenu(null);
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-lg bg-[#8b5cf6]/10 text-[#8b5cf6] font-semibold hover:bg-[#8b5cf6]/20 flex items-center justify-between"
              >
                <span>Group into Layer</span>
                <span className="text-[10px] font-mono">({selectedNodeIds.length})</span>
              </button>
            </div>
          )}
        </div>
      )}

      <ReactFlow
        nodes={renderedNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onNodeDrag={onNodeDrag}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onPaneContextMenu={onPaneContextMenu}
        onMove={onMove}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={{ type: 'weightedEdge' }}
        fitView
        snapToGrid={settings.snap}
        snapGrid={[20, 20]}
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        {settings.grid && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color={theme === 'dark' ? '#383531' : '#e6dfd8'}
          />
        )}

        <ViewportPortal>
          <LayerFrames />
        </ViewportPortal>

        <Controls
          className="!bg-white dark:!bg-[#1f1e1b] !border !border-[#e6dfd8] dark:!border-[#383531] !rounded-xl !shadow-sm overflow-hidden"
          showInteractive={false}
        />

        {settings.minimap && (
          <MiniMap
            className="!bg-white dark:!bg-[#1f1e1b] !border !border-[#e6dfd8] dark:!border-[#383531] !rounded-xl !shadow-md hidden md:block"
            nodeColor={(n) => {
              if (n.type === 'inputNode') return '#cc785c';
              if (n.type === 'outputNode') return '#5db872';
              if (n.type === 'lossNode') return '#c64545';
              return '#e8a55a';
            }}
            maskColor={theme === 'dark' ? 'rgba(24, 23, 21, 0.7)' : 'rgba(250, 249, 245, 0.7)'}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function CanvasView() {
  return (
    <ReactFlowProvider>
      <InnerCanvas />
    </ReactFlowProvider>
  );
}

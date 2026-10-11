import { create } from 'zustand';
import {
  type Node,
  type Edge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type Viewport,
  type Connection,
} from '@xyflow/react';
import { SerializedCanvas, CanvasSettings, migrateCanvas } from '../persistence/schema';
import { NetworkGraph, NetNode, NetEdge, Layer } from '../engine/types';
import { saveAutosave } from '../persistence/db';

const MAX_HISTORY = 50;

interface CanvasHistorySnapshot {
  nodes: Node[];
  edges: Edge[];
  layers: Layer[];
}

interface CanvasStoreState {
  canvasName: string;
  nodes: Node[];
  edges: Edge[];
  layers: Layer[];
  viewport: Viewport;
  settings: CanvasSettings;
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedLayerId: string | null;
  history: CanvasHistorySnapshot[];
  historyIndex: number;
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  highlightedLayerIds: string[];

  // Actions
  setCanvasName: (name: string) => void;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  addNode: (type: string, position?: { x: number; y: number }, initialData?: Record<string, any>) => string;
  updateNodeData: (id: string, patch: Record<string, any>) => void;
  updateEdgeData: (id: string, patch: Record<string, any>) => void;
  removeNodes: (ids: string[]) => void;
  removeEdges: (ids: string[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setSelectedLayerId: (id: string | null) => void;
  setViewport: (vp: Viewport) => void;
  updateSettings: (patch: Partial<CanvasSettings>) => void;
  setHighlights: (nodeIds?: string[], edgeIds?: string[], layerIds?: string[]) => void;

  setLayers: (layers: Layer[]) => void;
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: string) => void;
  addNodeToLayer: (layerId: string, nodeType?: string) => string | null;
  groupNodesIntoLayer: (nodeIds: string[], layerName?: string) => { success: boolean; error?: string; layerId?: string };
  updateNodePositions: (positions: { id: string; x: number; y: number }[]) => void;
  moveLayer: (layerId: string, deltaX: number, deltaY: number) => void;

  undo: () => void;
  redo: () => void;
  pushHistorySnapshot: () => void;

  clearCanvas: () => void;
  loadCanvas: (canvas: SerializedCanvas) => void;
  serialize: () => SerializedCanvas;
}

export function canvasToNetwork(nodes: Node[], edges: Edge[], layers: Layer[] = []): NetworkGraph {
  const netNodes: NetNode[] = [];

  for (const n of nodes) {
    if (n.type === 'inputNode' || n.type === 'input') {
      const val = Number(n.data?.value ?? (n.data as any)?.inputValue ?? 1.0);
      netNodes.push({
        id: n.id,
        kind: 'input',
        label: (n.data?.label as string) || n.id,
        inputValue: val,
      });
    } else if (n.type === 'neuronNode' || n.type === 'neuron') {
      netNodes.push({
        id: n.id,
        kind: 'neuron',
        label: (n.data?.label as string) || n.id,
        bias: Number(n.data?.bias ?? 0.0),
        activation: (n.data?.activation as any) || 'sigmoid',
      });
    } else if (n.type === 'activationNode' || n.type === 'activation') {
      netNodes.push({
        id: n.id,
        kind: 'activation',
        label: (n.data?.label as string) || n.id,
        activation: (n.data?.activation as any) || 'sigmoid',
      });
    } else if (n.type === 'outputNode' || n.type === 'output') {
      netNodes.push({
        id: n.id,
        kind: 'output',
        label: (n.data?.label as string) || n.id,
        target: n.data?.target !== undefined ? Number(n.data.target) : undefined,
      });
    } else if (n.type === 'lossNode' || n.type === 'loss') {
      netNodes.push({
        id: n.id,
        kind: 'loss',
        label: (n.data?.label as string) || n.id,
        target: n.data?.target !== undefined ? Number(n.data.target) : undefined,
      });
    }
  }

  const nodeIds = new Set(netNodes.map((n) => n.id));
  const netEdges: NetEdge[] = edges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => ({
      id: e.id,
      from: e.source,
      to: e.target,
      weight: Number(e.data?.weight ?? 1.0),
    }));

  return {
    nodes: netNodes,
    edges: netEdges,
    layers,
  };
}

let autosaveTimeout: NodeJS.Timeout | null = null;
function scheduleAutosave(state: CanvasStoreState) {
  if (autosaveTimeout) clearTimeout(autosaveTimeout);
  autosaveTimeout = setTimeout(() => {
    saveAutosave(state.serialize());
  }, 500);
}

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  canvasName: 'Untitled Network',
  nodes: [],
  edges: [],
  layers: [],
  viewport: { x: 50, y: 50, zoom: 1 },
  settings: {
    mode: 'beginner',
    snap: true,
    grid: true,
    minimap: true,
    showLayerFrames: true,
    precision: 2,
  },
  selectedNodeId: null,
  selectedEdgeId: null,
  selectedLayerId: null,
  history: [],
  historyIndex: -1,
  highlightedNodeIds: [],
  highlightedEdgeIds: [],
  highlightedLayerIds: [],

  setCanvasName: (name: string) => {
    set({ canvasName: name });
    scheduleAutosave(get());
  },

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
    scheduleAutosave(get());
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
    scheduleAutosave(get());
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;

    const currentEdges = get().edges;
    const exists = currentEdges.some(
      (e) => e.source === connection.source && e.target === connection.target
    );
    if (exists) return;

    get().pushHistorySnapshot();

    const newEdge: Edge = {
      id: `e_${connection.source}_${connection.target}_${Date.now()}`,
      source: connection.source,
      target: connection.target,
      type: 'weightedEdge',
      data: { weight: 0.5 },
    };

    set({ edges: addEdge(newEdge, currentEdges) });
    scheduleAutosave(get());
  },

  addNode: (type, position, initialData) => {
    get().pushHistorySnapshot();
    const id = `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const pos = position || {
      x: 200 + Math.random() * 80,
      y: 150 + Math.random() * 80,
    };

    const newNode: Node = {
      id,
      type,
      position: pos,
      data: initialData || {},
    };

    set((state) => ({
      nodes: [...state.nodes, newNode],
      selectedNodeId: id,
    }));

    scheduleAutosave(get());
    return id;
  },

  updateNodeData: (id, patch) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...patch },
          };
        }
        return node;
      }),
    }));
    scheduleAutosave(get());
  },

  updateEdgeData: (id, patch) => {
    set((state) => ({
      edges: state.edges.map((edge) => {
        if (edge.id === id) {
          return {
            ...edge,
            data: { ...edge.data, ...patch },
          };
        }
        return edge;
      }),
    }));
    scheduleAutosave(get());
  },

  removeNodes: (ids) => {
    if (ids.length === 0) return;
    get().pushHistorySnapshot();
    const idSet = new Set(ids);
    set((state) => ({
      nodes: state.nodes.filter((n) => !idSet.has(n.id)),
      edges: state.edges.filter((e) => !idSet.has(e.source) && !idSet.has(e.target)),
      layers: state.layers
        .map((l) => ({ ...l, nodeIds: l.nodeIds.filter((nid) => !idSet.has(nid)) }))
        .filter((l) => l.nodeIds.length > 0),
      selectedNodeId: ids.includes(state.selectedNodeId || '') ? null : state.selectedNodeId,
    }));
    scheduleAutosave(get());
  },

  removeEdges: (ids) => {
    if (ids.length === 0) return;
    get().pushHistorySnapshot();
    const idSet = new Set(ids);
    set((state) => ({
      edges: state.edges.filter((e) => !idSet.has(e.id)),
      selectedEdgeId: ids.includes(state.selectedEdgeId || '') ? null : state.selectedEdgeId,
    }));
    scheduleAutosave(get());
  },

  setSelectedNodeId: (id) =>
    set({ selectedNodeId: id, selectedEdgeId: id ? null : get().selectedEdgeId }),
  setSelectedEdgeId: (id) =>
    set({ selectedEdgeId: id, selectedNodeId: id ? null : get().selectedNodeId }),
  setSelectedLayerId: (id) => set({ selectedLayerId: id }),

  setViewport: (viewport) => set({ viewport }),

  updateSettings: (patch) => {
    set((state) => ({
      settings: { ...state.settings, ...patch },
    }));
    scheduleAutosave(get());
  },

  setHighlights: (nodeIds = [], edgeIds = [], layerIds = []) => {
    set({
      highlightedNodeIds: nodeIds,
      highlightedEdgeIds: edgeIds,
      highlightedLayerIds: layerIds,
    });
  },

  setLayers: (layers) => {
    set({ layers });
    scheduleAutosave(get());
  },

  addLayer: (layer) => {
    get().pushHistorySnapshot();
    set((s) => ({
      layers: [...s.layers.filter((l) => l.id !== layer.id), layer],
    }));
    scheduleAutosave(get());
  },

  removeLayer: (layerId) => {
    get().pushHistorySnapshot();
    set((s) => ({
      layers: s.layers.filter((l) => l.id !== layerId),
      selectedLayerId: s.selectedLayerId === layerId ? null : s.selectedLayerId,
    }));
    scheduleAutosave(get());
  },

  addNodeToLayer: (layerId, nodeType) => {
    const { layers, nodes } = get();
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return null;

    let allowedType = 'neuronNode';
    if (layer.kind === 'input') {
      allowedType = 'inputNode';
    } else if (layer.kind === 'output') {
      allowedType = 'outputNode';
    } else {
      allowedType = 'neuronNode';
    }

    if (nodeType && nodeType !== allowedType) {
      return null;
    }

    const memberNodes = layer.nodeIds
      .map((id) => nodes.find((n) => n.id === id))
      .filter((n): n is NonNullable<typeof n> => !!n);

    let nextPos = { x: 250, y: 150 };
    if (memberNodes.length > 0) {
      let maxX = memberNodes[0].position.x;
      let maxY = memberNodes[0].position.y;
      for (const mn of memberNodes) {
        if (mn.position.x > maxX) maxX = mn.position.x;
        if (mn.position.y > maxY) maxY = mn.position.y;
      }
      nextPos = { x: memberNodes[0].position.x, y: maxY + 140 };
    }

    get().pushHistorySnapshot();
    const newId = `node_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const defaultData =
      allowedType === 'inputNode'
        ? { value: 1.0, label: `x${memberNodes.length + 1}` }
        : allowedType === 'outputNode'
        ? { target: 1.0, label: `ŷ${memberNodes.length + 1}` }
        : { bias: 0.0, activation: 'sigmoid', label: `h${memberNodes.length + 1}` };

    const newNode: Node = {
      id: newId,
      type: allowedType,
      position: nextPos,
      data: defaultData,
    };

    set((s) => ({
      nodes: [...s.nodes, newNode],
      layers: s.layers.map((l) =>
        l.id === layerId ? { ...l, nodeIds: [...l.nodeIds, newId] } : l
      ),
      selectedNodeId: newId,
    }));

    scheduleAutosave(get());
    return newId;
  },

  groupNodesIntoLayer: (nodeIds, layerName) => {
    if (!nodeIds || nodeIds.length === 0) {
      return { success: false, error: 'No nodes selected to group.' };
    }

    const { nodes, layers } = get();
    const targetNodes = nodes.filter((n) => nodeIds.includes(n.id));
    if (targetNodes.length !== nodeIds.length) {
      return { success: false, error: 'Some nodes could not be found.' };
    }

    // Determine kinds: inputNode -> 'input', outputNode -> 'output', neuronNode/activationNode -> 'hidden'
    const kinds = new Set(
      targetNodes.map((n) => {
        if (n.type === 'inputNode') return 'input';
        if (n.type === 'outputNode') return 'output';
        return 'hidden';
      })
    );

    if (kinds.size > 1) {
      return {
        success: false,
        error: 'Cannot group mixed node types! Input, Hidden, and Output nodes cannot be placed in the same layer.',
      };
    }

    const kind = Array.from(kinds)[0] as 'input' | 'hidden' | 'output';

    get().pushHistorySnapshot();

    // Clean existing membership
    const cleanedLayers = layers
      .map((l) => ({
        ...l,
        nodeIds: l.nodeIds.filter((id) => !nodeIds.includes(id)),
      }))
      .filter((l) => l.nodeIds.length > 0);

    const layerId = `L_${kind}_${Date.now()}`;
    const defaultLabel =
      layerName ||
      (kind === 'input'
        ? 'Input Layer'
        : kind === 'output'
        ? 'Output Layer'
        : `Hidden Layer ${cleanedLayers.filter((l) => l.kind === 'hidden').length + 1}`);

    const newLayer: Layer = {
      id: layerId,
      kind,
      label: defaultLabel,
      order: cleanedLayers.length,
      nodeIds: [...nodeIds],
    };

    set({
      layers: [...cleanedLayers, newLayer],
      selectedLayerId: layerId,
    });

    scheduleAutosave(get());
    return { success: true, layerId };
  },

  updateNodePositions: (positions) => {
    if (positions.length === 0) return;
    const posMap = new Map(positions.map((p) => [p.id, { x: p.x, y: p.y }]));
    set((state) => ({
      nodes: state.nodes.map((n) => {
        const update = posMap.get(n.id);
        if (update) {
          return { ...n, position: update };
        }
        return n;
      }),
    }));
    scheduleAutosave(get());
  },

  moveLayer: (layerId, deltaX, deltaY) => {
    if (deltaX === 0 && deltaY === 0) return;
    const { layers, nodes } = get();
    const layer = layers.find((l) => l.id === layerId);
    if (!layer || layer.nodeIds.length === 0) return;

    const layerNodeSet = new Set(layer.nodeIds);
    set({
      nodes: nodes.map((n) => {
        if (layerNodeSet.has(n.id)) {
          return {
            ...n,
            position: {
              x: Math.round(n.position.x + deltaX),
              y: Math.round(n.position.y + deltaY),
            },
          };
        }
        return n;
      }),
    });
    scheduleAutosave(get());
  },

  pushHistorySnapshot: () => {
    const { nodes, edges, layers, history, historyIndex } = get();
    const nextHistory = history.slice(0, historyIndex + 1);
    if (nextHistory.length >= MAX_HISTORY) nextHistory.shift();
    nextHistory.push({
      nodes: JSON.parse(JSON.stringify(nodes)),
      edges: JSON.parse(JSON.stringify(edges)),
      layers: JSON.parse(JSON.stringify(layers)),
    });
    set({
      history: nextHistory,
      historyIndex: nextHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const targetIdx = historyIndex - 1;
    const snapshot = history[targetIdx];
    set({
      nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
      edges: JSON.parse(JSON.stringify(snapshot.edges)),
      layers: JSON.parse(JSON.stringify(snapshot.layers || [])),
      historyIndex: targetIdx,
    });
    scheduleAutosave(get());
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const targetIdx = historyIndex + 1;
    const snapshot = history[targetIdx];
    set({
      nodes: JSON.parse(JSON.stringify(snapshot.nodes)),
      edges: JSON.parse(JSON.stringify(snapshot.edges)),
      layers: JSON.parse(JSON.stringify(snapshot.layers || [])),
      historyIndex: targetIdx,
    });
    scheduleAutosave(get());
  },

  clearCanvas: () => {
    set({
      canvasName: 'Untitled Network',
      nodes: [],
      edges: [],
      layers: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedLayerId: null,
      highlightedNodeIds: [],
      highlightedEdgeIds: [],
      highlightedLayerIds: [],
    });
    scheduleAutosave(get());
  },

  loadCanvas: (canvas) => {
    const validated = migrateCanvas(canvas);
    set({
      canvasName: validated.name || 'Untitled Network',
      nodes: validated.nodes,
      edges: validated.edges,
      layers: validated.layers || [],
      viewport: validated.viewport,
      settings: validated.settings,
      selectedNodeId: null,
      selectedEdgeId: null,
      selectedLayerId: null,
      history: [
        {
          nodes: JSON.parse(JSON.stringify(validated.nodes)),
          edges: JSON.parse(JSON.stringify(validated.edges)),
          layers: JSON.parse(JSON.stringify(validated.layers || [])),
        },
      ],
      historyIndex: 0,
      highlightedNodeIds: [],
      highlightedEdgeIds: [],
      highlightedLayerIds: [],
    });
    scheduleAutosave(get());
  },

  serialize: () => {
    const { canvasName, nodes, edges, layers, viewport, settings } = get();
    return {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: canvasName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewport,
      settings,
      nodes,
      edges,
      layers,
    };
  },
}));

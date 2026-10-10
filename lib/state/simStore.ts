import { create } from 'zustand';
import { SimStep, SimState, TrainingSample } from '../engine/types';
import { buildSteps } from '../engine/steps';
import { forward } from '../engine/forward';
import { backward } from '../engine/backward';
import { trainEpochs, applyGradients } from '../engine/train';
import { useCanvasStore, canvasToNetwork } from './canvasStore';

interface SimStoreState {
  steps: SimStep[];
  cursor: number;
  isPlaying: boolean;
  speed: 0.5 | 1 | 2;
  granularity: 'node' | 'layer';
  learningRate: number;
  trainEpochsCount: number;
  trainingHistory: number[];
  currentState: SimState | null;

  // Actions
  setSpeed: (speed: 0.5 | 1 | 2) => void;
  setGranularity: (granularity: 'node' | 'layer') => void;
  setLearningRate: (lr: number) => void;
  setTrainEpochsCount: (n: number) => void;

  buildFromCanvas: () => void;
  runAll: () => void;
  stepForward: () => void;
  stepBack: () => void;
  reset: () => void;
  play: () => void;
  pause: () => void;

  updateWeights: (lr?: number) => void;
  trainN: (epochs?: number, lr?: number, datasetSamples?: TrainingSample[]) => void;
}

let playInterval: NodeJS.Timeout | null = null;

export const useSimStore = create<SimStoreState>((set, get) => ({
  steps: [],
  cursor: -1,
  isPlaying: false,
  speed: 1,
  granularity: 'node',
  learningRate: 0.2,
  trainEpochsCount: 20,
  trainingHistory: [],
  currentState: null,

  setSpeed: (speed) => {
    set({ speed });
    if (get().isPlaying) {
      get().pause();
      get().play();
    }
  },

  setGranularity: (granularity) => {
    set({ granularity });
    get().buildFromCanvas();
  },

  setLearningRate: (lr) => set({ learningRate: lr }),
  setTrainEpochsCount: (n) => set({ trainEpochsCount: n }),

  buildFromCanvas: () => {
    const { nodes, edges } = useCanvasStore.getState();
    try {
      const net = canvasToNetwork(nodes, edges);
      if (net.nodes.length === 0) {
        set({ steps: [], cursor: -1, currentState: null });
        return;
      }
      const steps = buildSteps(net, {
        granularity: get().granularity,
        includeBackward: true,
      });
      set({ steps, cursor: -1, currentState: null });
    } catch (err: any) {
      console.warn('Cannot build simulation steps:', err.message);
    }
  },

  runAll: () => {
    get().pause();
    const { nodes, edges, updateNodeData } = useCanvasStore.getState();
    try {
      const net = canvasToNetwork(nodes, edges);
      const fwd = forward(net);
      const bwd = backward(net, fwd);

      // Sync computed values to canvas nodes
      for (const [nodeId, ns] of Object.entries(bwd.nodeStates)) {
        updateNodeData(nodeId, {
          computedZ: ns.z,
          computedA: ns.a,
          computedDz: ns.dz,
          computedDa: ns.da,
        });
      }

      set({
        currentState: bwd,
        cursor: get().steps.length - 1,
      });
    } catch (err: any) {
      console.warn('Run all error:', err.message);
    }
  },

  stepForward: () => {
    const { steps, cursor } = get();
    if (steps.length === 0) {
      get().buildFromCanvas();
    }
    const currentSteps = get().steps;
    if (cursor >= currentSteps.length - 1) {
      get().pause();
      return;
    }

    const nextCursor = cursor + 1;
    const step = currentSteps[nextCursor];
    const { updateNodeData, setHighlights } = useCanvasStore.getState();

    // Highlight active node/edge
    setHighlights(step.nodeId ? [step.nodeId] : [], step.edgeId ? [step.edgeId] : []);

    // Sync node computed values up to this step
    for (const [nodeId, ns] of Object.entries(step.state.nodeStates)) {
      updateNodeData(nodeId, {
        computedZ: ns.z,
        computedA: ns.a,
        computedDz: ns.dz,
        computedDa: ns.da,
      });
    }

    set({ cursor: nextCursor, currentState: step.state });
  },

  stepBack: () => {
    const { cursor, steps } = get();
    if (cursor <= 0) {
      get().reset();
      return;
    }

    const prevCursor = cursor - 1;
    const step = steps[prevCursor];
    const { updateNodeData, setHighlights } = useCanvasStore.getState();

    setHighlights(step.nodeId ? [step.nodeId] : [], step.edgeId ? [step.edgeId] : []);

    for (const [nodeId, ns] of Object.entries(step.state.nodeStates)) {
      updateNodeData(nodeId, {
        computedZ: ns.z,
        computedA: ns.a,
        computedDz: ns.dz,
        computedDa: ns.da,
      });
    }

    set({ cursor: prevCursor, currentState: step.state });
  },

  reset: () => {
    get().pause();
    const { updateNodeData, setHighlights, nodes } = useCanvasStore.getState();
    setHighlights([], []);
    for (const n of nodes) {
      updateNodeData(n.id, {
        computedZ: undefined,
        computedA: undefined,
        computedDz: undefined,
        computedDa: undefined,
      });
    }
    set({ cursor: -1, currentState: null });
  },

  play: () => {
    if (get().isPlaying) return;
    set({ isPlaying: true });

    const delayMs = get().speed === 0.5 ? 1200 : get().speed === 1 ? 700 : 350;

    playInterval = setInterval(() => {
      const { cursor, steps } = get();
      if (cursor >= steps.length - 1) {
        get().pause();
      } else {
        get().stepForward();
      }
    }, delayMs);
  },

  pause: () => {
    if (playInterval) {
      clearInterval(playInterval);
      playInterval = null;
    }
    set({ isPlaying: false });
  },

  updateWeights: (customLr) => {
    const lr = customLr ?? get().learningRate;
    const { nodes, edges, updateEdgeData, updateNodeData, pushHistorySnapshot } = useCanvasStore.getState();
    try {
      const net = canvasToNetwork(nodes, edges);
      const fwd = forward(net);
      const bwd = backward(net, fwd);
      const updatedNet = applyGradients(net, bwd, lr);

      pushHistorySnapshot();

      // Write updated weights to edges
      for (const edge of updatedNet.edges) {
        updateEdgeData(edge.id, { weight: edge.weight });
      }

      // Write updated biases to nodes
      for (const node of updatedNet.nodes) {
        if (node.bias !== undefined) {
          updateNodeData(node.id, { bias: node.bias });
        }
      }

      // Record history
      set((s) => ({
        trainingHistory: [...s.trainingHistory, fwd.loss ?? 0],
      }));

      // Re-run forward with new weights
      get().runAll();
    } catch (err: any) {
      console.warn('Update weights error:', err.message);
    }
  },

  trainN: (customEpochs, customLr, datasetSamples) => {
    const epochs = customEpochs ?? get().trainEpochsCount;
    const lr = customLr ?? get().learningRate;
    const { nodes, edges, updateEdgeData, updateNodeData, pushHistorySnapshot } = useCanvasStore.getState();

    try {
      const net = canvasToNetwork(nodes, edges);

      // Default sample if none supplied: current inputs and targets
      const samples: TrainingSample[] = datasetSamples && datasetSamples.length > 0
        ? datasetSamples
        : [
            {
              inputs: net.nodes.filter((n) => n.kind === 'input').map((n) => n.inputValue ?? 0),
              target: net.nodes.find((n) => n.kind === 'output')?.target ?? 0.8,
            },
          ];

      const { graph: updatedNet, lossHistory } = trainEpochs(net, samples, lr, epochs);

      pushHistorySnapshot();

      for (const edge of updatedNet.edges) {
        updateEdgeData(edge.id, { weight: edge.weight });
      }

      for (const node of updatedNet.nodes) {
        if (node.bias !== undefined) {
          updateNodeData(node.id, { bias: node.bias });
        }
      }

      set((s) => ({
        trainingHistory: [...s.trainingHistory, ...lossHistory],
      }));

      // Rebuild & run all
      get().buildFromCanvas();
      get().runAll();
    } catch (err: any) {
      console.warn('Train N error:', err.message);
    }
  },
}));

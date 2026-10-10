import { NetworkGraph, SimState, TrainingSample } from './types';
import { forward } from './forward';
import { backward } from './backward';

/**
 * Applies gradient descent update:
 * w_new = w - lr * dL/dw
 * b_new = b - lr * dL/db
 * Returns a new immutable NetworkGraph.
 */
export function applyGradients(
  graph: NetworkGraph,
  state: SimState,
  learningRate: number
): NetworkGraph {
  const newEdges = graph.edges.map((edge) => {
    const grad = state.edgeGrads[edge.id] || 0;
    // Guard against NaN
    const delta = isNaN(grad) || !isFinite(grad) ? 0 : learningRate * grad;
    const newWeight = Number((edge.weight - delta).toFixed(5));
    return {
      ...edge,
      weight: newWeight,
    };
  });

  const newNodes = graph.nodes.map((node) => {
    if (node.kind === 'neuron' || node.kind === 'output') {
      const grad = state.biasGrads[node.id] || 0;
      const delta = isNaN(grad) || !isFinite(grad) ? 0 : learningRate * grad;
      const currentBias = node.bias ?? 0;
      const newBias = Number((currentBias - delta).toFixed(5));
      return {
        ...node,
        bias: newBias,
      };
    }
    return node;
  });

  return {
    nodes: newNodes,
    edges: newEdges,
  };
}

/**
 * Executes a single training step on a list of samples.
 * Computes average gradients across samples and updates the network.
 */
export function trainStep(
  graph: NetworkGraph,
  samples: TrainingSample[],
  learningRate: number
): { graph: NetworkGraph; loss: number } {
  if (samples.length === 0) {
    const fwd = forward(graph);
    const bwd = backward(graph, fwd);
    const updated = applyGradients(graph, bwd, learningRate);
    return { graph: updated, loss: fwd.loss ?? 0 };
  }

  // Accumulate gradients across all samples
  const accumulatedEdgeGrads: Record<string, number> = {};
  const accumulatedBiasGrads: Record<string, number> = {};
  let totalLoss = 0;

  for (const edge of graph.edges) accumulatedEdgeGrads[edge.id] = 0;
  for (const node of graph.nodes) accumulatedBiasGrads[node.id] = 0;

  const inputNodes = graph.nodes.filter((n) => n.kind === 'input');
  const outputNodes = graph.nodes.filter((n) => n.kind === 'output');

  for (const sample of samples) {
    // Set inputs and targets on a cloned graph
    const sampleGraph: NetworkGraph = {
      nodes: graph.nodes.map((node, idx) => {
        if (node.kind === 'input') {
          const inputIdx = inputNodes.indexOf(node);
          const sampleVal = sample.inputs[inputIdx] ?? sample.inputs[0] ?? 0;
          return { ...node, inputValue: sampleVal };
        }
        if (node.kind === 'output') {
          return { ...node, target: sample.target };
        }
        return { ...node };
      }),
      edges: graph.edges,
    };

    const fwd = forward(sampleGraph);
    const bwd = backward(sampleGraph, fwd);
    totalLoss += fwd.loss ?? 0;

    for (const [edgeId, grad] of Object.entries(bwd.edgeGrads)) {
      accumulatedEdgeGrads[edgeId] = (accumulatedEdgeGrads[edgeId] || 0) + grad;
    }
    for (const [nodeId, grad] of Object.entries(bwd.biasGrads)) {
      accumulatedBiasGrads[nodeId] = (accumulatedBiasGrads[nodeId] || 0) + grad;
    }
  }

  const num = samples.length;
  const avgEdgeGrads: Record<string, number> = {};
  const avgBiasGrads: Record<string, number> = {};

  for (const [edgeId, grad] of Object.entries(accumulatedEdgeGrads)) {
    avgEdgeGrads[edgeId] = grad / num;
  }
  for (const [nodeId, grad] of Object.entries(accumulatedBiasGrads)) {
    avgBiasGrads[nodeId] = grad / num;
  }

  const avgState: SimState = {
    nodeStates: {},
    edgeGrads: avgEdgeGrads,
    biasGrads: avgBiasGrads,
    loss: totalLoss / num,
  };

  const updatedGraph = applyGradients(graph, avgState, learningRate);
  return {
    graph: updatedGraph,
    loss: totalLoss / num,
  };
}

/**
 * Runs N epochs of training, returning updated graph and loss curve history.
 */
export function trainEpochs(
  initialGraph: NetworkGraph,
  samples: TrainingSample[],
  learningRate: number,
  epochs: number
): { graph: NetworkGraph; lossHistory: number[] } {
  let currentGraph = initialGraph;
  const lossHistory: number[] = [];

  for (let e = 0; e < epochs; e++) {
    const { graph, loss } = trainStep(currentGraph, samples, learningRate);
    currentGraph = graph;
    lossHistory.push(loss);
  }

  return { graph: currentGraph, lossHistory };
}

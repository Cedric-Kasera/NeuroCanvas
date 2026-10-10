import { NetworkGraph, SimState, NodeState } from './types';
import { topologicalOrder, getNode, getIncomingEdges } from './graph';
import { activate } from './activations';

/**
 * Computes forward pass over the entire DAG.
 * Returns updated SimState with z and a for each node.
 */
export function forward(graph: NetworkGraph, existingState?: SimState): SimState {
  const topo = topologicalOrder(graph);
  const nodeStates: Record<string, NodeState> = { ...(existingState?.nodeStates || {}) };

  for (const nodeId of topo) {
    const node = getNode(graph, nodeId);
    if (!node) continue;

    if (node.kind === 'input') {
      const val = node.inputValue ?? (node.inputValues ? node.inputValues[0] : 0);
      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        z: val,
        a: val,
      };
      continue;
    }

    const inEdges = getIncomingEdges(graph, nodeId);

    if (node.kind === 'neuron') {
      let sum = 0;
      for (const edge of inEdges) {
        const sourceA = nodeStates[edge.from]?.a ?? 0;
        sum += edge.weight * sourceA;
      }
      const bias = node.bias ?? 0;
      const z = sum + bias;
      const actFn = node.activation || 'sigmoid';
      const a = activate(actFn, z);

      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        z,
        a,
      };
      continue;
    }

    if (node.kind === 'activation') {
      let inputVal = 0;
      if (inEdges.length > 0) {
        inputVal = nodeStates[inEdges[0].from]?.a ?? 0;
      }
      const actFn = node.activation || 'sigmoid';
      const a = activate(actFn, inputVal);
      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        z: inputVal,
        a,
      };
      continue;
    }

    if (node.kind === 'output') {
      let sum = 0;
      for (const edge of inEdges) {
        const sourceA = nodeStates[edge.from]?.a ?? 0;
        sum += edge.weight * sourceA;
      }
      // Output node passes through sum
      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        z: sum,
        a: sum,
      };
      continue;
    }

    if (node.kind === 'loss') {
      // Handled in computeLoss
      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
      };
    }
  }

  const simState: SimState = {
    nodeStates,
    edgeGrads: existingState?.edgeGrads || {},
    biasGrads: existingState?.biasGrads || {},
  };

  simState.loss = computeLoss(graph, simState);
  return simState;
}

/**
 * Computes MSE Loss across output nodes that have a target specified
 * or an attached LossNode.
 */
export function computeLoss(graph: NetworkGraph, state: SimState): number {
  const outputNodes = graph.nodes.filter((n) => n.kind === 'output' && n.target !== undefined);
  if (outputNodes.length > 0) {
    let sumSq = 0;
    for (const out of outputNodes) {
      const pred = state.nodeStates[out.id]?.a ?? 0;
      const target = out.target ?? 0;
      const diff = pred - target;
      sumSq += diff * diff;
    }
    return sumSq / outputNodes.length;
  }

  // Look for dedicated LossNode connected to output
  const lossNodes = graph.nodes.filter((n) => n.kind === 'loss');
  if (lossNodes.length > 0) {
    let total = 0;
    for (const lossNode of lossNodes) {
      const inEdges = getIncomingEdges(graph, lossNode.id);
      if (inEdges.length === 0) continue;
      const pred = state.nodeStates[inEdges[0].from]?.a ?? 0;
      const target = lossNode.target ?? 0;
      const diff = pred - target;
      total += diff * diff;
    }
    return total / lossNodes.length;
  }

  return 0;
}

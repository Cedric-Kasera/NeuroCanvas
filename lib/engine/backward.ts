import { NetworkGraph, SimState, NodeState } from './types';
import { topologicalOrder, getNode, getIncomingEdges, getOutgoingEdges } from './graph';
import { activateDerivative } from './activations';

/**
 * Computes backward pass (Backpropagation) through the network graph.
 * Fills dz, da, edgeGrads (dL/dw), and biasGrads (dL/db).
 */
export function backward(graph: NetworkGraph, state: SimState): SimState {
  const topo = topologicalOrder(graph);
  // Reverse topological order: outputs first, inputs last
  const revTopo = [...topo].reverse();

  const nodeStates: Record<string, NodeState> = {};
  for (const id of Object.keys(state.nodeStates)) {
    nodeStates[id] = { ...state.nodeStates[id] };
  }

  const edgeGrads: Record<string, number> = {};
  const biasGrads: Record<string, number> = {};

  // Find output targets
  const outputsWithTarget = graph.nodes.filter(
    (n) => (n.kind === 'output' && n.target !== undefined) || n.kind === 'loss'
  );
  const N = Math.max(1, outputsWithTarget.length);

  for (const nodeId of revTopo) {
    const node = getNode(graph, nodeId);
    if (!node) continue;

    const outEdges = getOutgoingEdges(graph, nodeId);
    let da = 0;

    if (node.kind === 'output') {
      const pred = nodeStates[nodeId]?.a ?? 0;
      const target = node.target ?? 0;
      // dL/da = (2 / N) * (pred - target)
      da = (2 / N) * (pred - target);

      // Output node passes through directly so dz = da
      const dz = da;
      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        da,
        dz,
      };

      // Output node bias gradient if any
      biasGrads[nodeId] = dz;
    } else if (node.kind === 'loss') {
      const inEdges = getIncomingEdges(graph, nodeId);
      const target = node.target ?? 0;
      for (const inEdge of inEdges) {
        const pred = nodeStates[inEdge.from]?.a ?? 0;
        const inDa = (2 / N) * (pred - target);
        nodeStates[inEdge.from] = {
          ...nodeStates[inEdge.from],
          da: inDa,
        };
      }
    } else if (node.kind === 'neuron') {
      // If da wasn't preset (e.g. from a loss node or output), accumulate from outgoing edges
      if (nodeStates[nodeId]?.da !== undefined && outEdges.length === 0) {
        da = nodeStates[nodeId]!.da!;
      } else {
        da = 0;
        for (const outEdge of outEdges) {
          const targetDz = nodeStates[outEdge.to]?.dz ?? 0;
          da += targetDz * outEdge.weight;
        }
      }

      const z = nodeStates[nodeId]?.z ?? 0;
      const a = nodeStates[nodeId]?.a ?? 0;
      const actFn = node.activation || 'sigmoid';
      const fPrime = activateDerivative(actFn, z, a);
      const dz = da * fPrime;

      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        da,
        dz,
      };

      biasGrads[nodeId] = dz;
    } else if (node.kind === 'activation') {
      da = 0;
      for (const outEdge of outEdges) {
        const targetDz = nodeStates[outEdge.to]?.dz ?? 0;
        da += targetDz * outEdge.weight;
      }
      const z = nodeStates[nodeId]?.z ?? 0;
      const a = nodeStates[nodeId]?.a ?? 0;
      const actFn = node.activation || 'sigmoid';
      const fPrime = activateDerivative(actFn, z, a);
      const dz = da * fPrime;

      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        da,
        dz,
      };
    } else if (node.kind === 'input') {
      da = 0;
      for (const outEdge of outEdges) {
        const targetDz = nodeStates[outEdge.to]?.dz ?? 0;
        da += targetDz * outEdge.weight;
      }
      nodeStates[nodeId] = {
        ...nodeStates[nodeId],
        da,
        dz: da,
      };
    }

    // Now compute gradients for incoming edges into this node
    const inEdges = getIncomingEdges(graph, nodeId);
    const nodeDz = nodeStates[nodeId]?.dz ?? 0;

    for (const inEdge of inEdges) {
      const sourceA = nodeStates[inEdge.from]?.a ?? 0;
      // dL/dw = dL/dz_target * a_source
      edgeGrads[inEdge.id] = nodeDz * sourceA;
    }
  }

  return {
    ...state,
    nodeStates,
    edgeGrads,
    biasGrads,
  };
}

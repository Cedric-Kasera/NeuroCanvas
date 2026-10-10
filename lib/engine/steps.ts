import { NetworkGraph, SimStep, SimState, NodeState } from './types';
import { topologicalOrder, getNode, getIncomingEdges, getOutgoingEdges, partitionLayers } from './graph';
import { activate, activateDerivative } from './activations';
import { backward } from './backward';

export interface BuildStepsOptions {
  granularity: 'node' | 'layer';
  includeBackward?: boolean;
}

export function buildSteps(graph: NetworkGraph, opts: BuildStepsOptions): SimStep[] {
  const steps: SimStep[] = [];
  const topo = topologicalOrder(graph);
  const layers = partitionLayers(graph);

  // Incremental node states during forward pass
  const runningNodeStates: Record<string, NodeState> = {};
  for (const node of graph.nodes) {
    runningNodeStates[node.id] = {};
  }

  // --- PHASE 1: FORWARD PASS ---
  if (opts.granularity === 'node') {
    for (const nodeId of topo) {
      const node = getNode(graph, nodeId);
      if (!node) continue;

      if (node.kind === 'input') {
        const val = node.inputValue ?? (node.inputValues ? node.inputValues[0] : 0);
        runningNodeStates[nodeId] = { z: val, a: val };

        steps.push({
          phase: 'forward',
          nodeId,
          description: `Input node "${node.label || nodeId}" feeds value ${val.toFixed(2)} into the network.`,
          detailMath: `a = ${val.toFixed(3)}`,
          state: {
            nodeStates: JSON.parse(JSON.stringify(runningNodeStates)),
            edgeGrads: {},
            biasGrads: {},
          },
        });
        continue;
      }

      const inEdges = getIncomingEdges(graph, nodeId);

      if (node.kind === 'neuron') {
        let sum = 0;
        const terms: string[] = [];
        for (const edge of inEdges) {
          const sourceA = runningNodeStates[edge.from]?.a ?? 0;
          const weighted = edge.weight * sourceA;
          sum += weighted;
          terms.push(`(${edge.weight.toFixed(2)} × ${sourceA.toFixed(2)})`);
        }
        const bias = node.bias ?? 0;
        const z = sum + bias;
        const actFn = node.activation || 'sigmoid';
        const a = activate(actFn, z);

        runningNodeStates[nodeId] = { z, a };

        const termsStr = terms.length > 0 ? terms.join(' + ') : '0';
        steps.push({
          phase: 'forward',
          nodeId,
          description: `Neuron "${node.label || nodeId}" receives weighted inputs + bias (${bias >= 0 ? '+' : ''}${bias.toFixed(2)}). Sum z = ${z.toFixed(2)}, activation a = ${a.toFixed(3)}.`,
          detailMath: `z = ${termsStr} ${bias >= 0 ? '+' : '-'} ${Math.abs(bias).toFixed(2)} = ${z.toFixed(3)}\na = ${actFn}(${z.toFixed(2)}) = ${a.toFixed(3)}`,
          state: {
            nodeStates: JSON.parse(JSON.stringify(runningNodeStates)),
            edgeGrads: {},
            biasGrads: {},
          },
        });
        continue;
      }

      if (node.kind === 'output') {
        let sum = 0;
        for (const edge of inEdges) {
          const sourceA = runningNodeStates[edge.from]?.a ?? 0;
          sum += edge.weight * sourceA;
        }
        runningNodeStates[nodeId] = { z: sum, a: sum };

        steps.push({
          phase: 'forward',
          nodeId,
          description: `Output node "${node.label || nodeId}" computes prediction y = ${sum.toFixed(3)}${node.target !== undefined ? `, target = ${node.target}` : ''}.`,
          detailMath: `y = ${sum.toFixed(3)}`,
          state: {
            nodeStates: JSON.parse(JSON.stringify(runningNodeStates)),
            edgeGrads: {},
            biasGrads: {},
          },
        });
      }
    }
  } else {
    // Layer by layer forward
    for (let layerIdx = 0; layerIdx < layers.length; layerIdx++) {
      const layerNodeIds = layers[layerIdx];
      for (const nodeId of layerNodeIds) {
        const node = getNode(graph, nodeId);
        if (!node) continue;
        if (node.kind === 'input') {
          const val = node.inputValue ?? 0;
          runningNodeStates[nodeId] = { z: val, a: val };
        } else if (node.kind === 'neuron') {
          const inEdges = getIncomingEdges(graph, nodeId);
          let sum = 0;
          for (const edge of inEdges) {
            const sourceA = runningNodeStates[edge.from]?.a ?? 0;
            sum += edge.weight * sourceA;
          }
          const z = sum + (node.bias ?? 0);
          const a = activate(node.activation || 'sigmoid', z);
          runningNodeStates[nodeId] = { z, a };
        } else if (node.kind === 'output') {
          const inEdges = getIncomingEdges(graph, nodeId);
          let sum = 0;
          for (const edge of inEdges) {
            sum += edge.weight * (runningNodeStates[edge.from]?.a ?? 0);
          }
          runningNodeStates[nodeId] = { z: sum, a: sum };
        }
      }

      steps.push({
        phase: 'forward',
        layerIndex: layerIdx,
        description: `Forward pass evaluated for Layer ${layerIdx + 1} (${layerNodeIds.length} node${layerNodeIds.length > 1 ? 's' : ''}).`,
        state: {
          nodeStates: JSON.parse(JSON.stringify(runningNodeStates)),
          edgeGrads: {},
          biasGrads: {},
        },
      });
    }
  }

  // --- PHASE 2: LOSS COMPUTATION ---
  const outputNodes = graph.nodes.filter((n) => n.kind === 'output');
  let totalLoss = 0;
  let lossDetail = '';
  for (const out of outputNodes) {
    const pred = runningNodeStates[out.id]?.a ?? 0;
    const target = out.target ?? 0;
    const diff = pred - target;
    const loss = diff * diff;
    totalLoss += loss;
    lossDetail += `Node ${out.label || out.id}: (y - t)² = (${pred.toFixed(2)} - ${target.toFixed(2)})² = ${loss.toFixed(4)}\n`;
  }
  const avgLoss = outputNodes.length > 0 ? totalLoss / outputNodes.length : 0;

  steps.push({
    phase: 'loss',
    description: `Mean Squared Error (MSE) loss calculated: ${avgLoss.toFixed(4)}.`,
    detailMath: lossDetail || `MSE = ${avgLoss.toFixed(4)}`,
    state: {
      nodeStates: JSON.parse(JSON.stringify(runningNodeStates)),
      edgeGrads: {},
      biasGrads: {},
      loss: avgLoss,
    },
  });

  if (!opts.includeBackward) {
    return steps;
  }

  // --- PHASE 3: BACKWARD PASS ---
  const finalFwdState: SimState = {
    nodeStates: runningNodeStates,
    edgeGrads: {},
    biasGrads: {},
    loss: avgLoss,
  };
  const fullBwd = backward(graph, finalFwdState);

  const revTopo = [...topo].reverse();
  const runningGrads = {
    edgeGrads: {} as Record<string, number>,
    biasGrads: {} as Record<string, number>,
    nodeStates: JSON.parse(JSON.stringify(fullBwd.nodeStates)),
  };

  for (const nodeId of revTopo) {
    const node = getNode(graph, nodeId);
    if (!node) continue;

    const ns = fullBwd.nodeStates[nodeId];
    if (!ns) continue;

    if (node.kind === 'output') {
      runningGrads.biasGrads[nodeId] = fullBwd.biasGrads[nodeId] ?? 0;
      steps.push({
        phase: 'backward',
        nodeId,
        description: `Output node "${node.label || nodeId}" output gradient: dL/da = 2(y - t) = ${(ns.da ?? 0).toFixed(3)}.`,
        detailMath: `dL/da = 2 × (${(ns.a ?? 0).toFixed(2)} - ${(node.target ?? 0).toFixed(2)}) = ${(ns.da ?? 0).toFixed(3)}`,
        state: {
          nodeStates: runningGrads.nodeStates,
          edgeGrads: { ...runningGrads.edgeGrads },
          biasGrads: { ...runningGrads.biasGrads },
          loss: avgLoss,
        },
      });
    } else if (node.kind === 'neuron') {
      const z = ns.z ?? 0;
      const actFn = node.activation || 'sigmoid';
      const fPrime = activateDerivative(actFn, z, ns.a);

      runningGrads.biasGrads[nodeId] = fullBwd.biasGrads[nodeId] ?? 0;

      // Also compute gradients for incoming edges
      const inEdges = getIncomingEdges(graph, nodeId);
      for (const inEdge of inEdges) {
        runningGrads.edgeGrads[inEdge.id] = fullBwd.edgeGrads[inEdge.id] ?? 0;
      }

      steps.push({
        phase: 'backward',
        nodeId,
        description: `Neuron "${node.label || nodeId}" receives upstream gradient dL/da = ${(ns.da ?? 0).toFixed(3)}. By chain rule, dL/dz = dL/da × f'(z) = ${(ns.dz ?? 0).toFixed(3)}.`,
        detailMath: `f'(z) = ${fPrime.toFixed(3)}\ndL/dz = ${(ns.da ?? 0).toFixed(3)} × ${fPrime.toFixed(3)} = ${(ns.dz ?? 0).toFixed(3)}\ndL/db = ${(ns.dz ?? 0).toFixed(3)}`,
        state: {
          nodeStates: runningGrads.nodeStates,
          edgeGrads: { ...runningGrads.edgeGrads },
          biasGrads: { ...runningGrads.biasGrads },
          loss: avgLoss,
        },
      });
    }
  }

  // --- PHASE 4: WEIGHT UPDATE SUMMARY ---
  steps.push({
    phase: 'update',
    description: `All gradients computed! Ready to adjust weights and biases: w ← w - η(dL/dw), b ← b - η(dL/db).`,
    detailMath: `Gradient vector has ${Object.keys(fullBwd.edgeGrads).length} weights and ${Object.keys(fullBwd.biasGrads).length} biases.`,
    state: fullBwd,
  });

  return steps;
}

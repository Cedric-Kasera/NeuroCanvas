import { NetworkGraph, SimState, NetNode, NetEdge } from './types';
import { forward } from './forward';
import { backward } from './backward';

export interface GradientInfo {
  edgeId: string;
  from: string;
  to: string;
  weight: number;
  grad: number;
  absGrad: number;
  logMagnitude: number; // log10(absGrad + 1e-10)
}

export interface SymmetryPair {
  node1Id: string;
  node2Id: string;
  layerId?: string;
  diff: number;
}

export interface ActivationDistribution {
  min: number;
  max: number;
  mean: number;
  variance: number;
  saturatedLowCount: number; // count near min/0
  saturatedHighCount: number; // count near max/1
  totalCount: number;
  isSaturated: boolean; // >80% within 5% of ends
}

/**
 * Returns gradient magnitudes for all edges in the graph.
 */
export function gradientMagnitudes(
  graph: NetworkGraph,
  state: SimState
): Record<string, GradientInfo> {
  const result: Record<string, GradientInfo> = {};

  for (const edge of graph.edges) {
    const grad = state.edgeGrads[edge.id] ?? 0;
    const absGrad = Math.abs(grad);
    const logMagnitude = Math.log10(absGrad + 1e-9);

    result[edge.id] = {
      edgeId: edge.id,
      from: edge.from,
      to: edge.to,
      weight: edge.weight,
      grad,
      absGrad,
      logMagnitude,
    };
  }

  return result;
}

/**
 * Detects ReLU neurons whose output is exactly 0 for EVERY dataset sample.
 * (Leaky ReLU, ELU, GELU are never marked dead).
 */
export function deadNeurons(
  graph: NetworkGraph,
  dataset: Array<{ inputs: number[]; target?: number }>
): string[] {
  if (dataset.length === 0) return [];

  // Filter candidate neurons: activation must be 'relu' (not leakyRelu)
  const reluNeurons = graph.nodes.filter(
    (n) => n.kind === 'neuron' && (n.activation === 'relu' || (!n.activation && false))
  );

  if (reluNeurons.length === 0) return [];

  const deadCandidates = new Set<string>(reluNeurons.map((n) => n.id));

  const inputNodes = graph.nodes.filter((n) => n.kind === 'input');

  for (const sample of dataset) {
    // Clone graph with sample inputs
    const sampleGraph: NetworkGraph = {
      nodes: graph.nodes.map((node) => {
        if (node.kind === 'input') {
          const inputIdx = inputNodes.indexOf(node);
          const sampleVal = sample.inputs[inputIdx] ?? sample.inputs[0] ?? 0;
          return { ...node, inputValue: sampleVal };
        }
        return { ...node };
      }),
      edges: graph.edges,
    };

    const fwd = forward(sampleGraph);

    for (const neuronId of Array.from(deadCandidates)) {
      const a = fwd.nodeStates[neuronId]?.a ?? 0;
      // If output is > 0 on any sample, it's NOT dead
      if (Math.abs(a) > 1e-7) {
        deadCandidates.delete(neuronId);
      }
    }

    if (deadCandidates.size === 0) break;
  }

  return Array.from(deadCandidates);
}

/**
 * Finds pairs of neurons in the same layer whose incoming weights, bias,
 * and outgoing weights are identical within eps (default 1e-7).
 */
export function symmetricPairs(
  graph: NetworkGraph,
  eps = 1e-7
): SymmetryPair[] {
  const pairs: SymmetryPair[] = [];
  const neuronNodes = graph.nodes.filter((n) => n.kind === 'neuron');

  // Group by layer if layers are defined, otherwise group by incoming input connections
  for (let i = 0; i < neuronNodes.length; i++) {
    for (let j = i + 1; j < neuronNodes.length; j++) {
      const n1 = neuronNodes[i];
      const n2 = neuronNodes[j];

      // Compare biases
      const b1 = n1.bias ?? 0;
      const b2 = n2.bias ?? 0;
      const biasDiff = Math.abs(b1 - b2);
      if (biasDiff > eps) continue;

      // Compare incoming edges
      const in1 = graph.edges.filter((e) => e.to === n1.id);
      const in2 = graph.edges.filter((e) => e.to === n2.id);

      if (in1.length !== in2.length) continue;

      let weightsMatch = true;
      let totalDiff = biasDiff;

      for (const e1 of in1) {
        const matchingE2 = in2.find((e) => e.from === e1.from);
        if (!matchingE2) {
          weightsMatch = false;
          break;
        }
        const diff = Math.abs(e1.weight - matchingE2.weight);
        totalDiff += diff;
        if (diff > eps) {
          weightsMatch = false;
          break;
        }
      }

      if (!weightsMatch) continue;

      // Compare outgoing edges
      const out1 = graph.edges.filter((e) => e.from === n1.id);
      const out2 = graph.edges.filter((e) => e.from === n2.id);

      for (const o1 of out1) {
        const matchingO2 = out2.find((e) => e.to === o1.to);
        if (matchingO2) {
          const diff = Math.abs(o1.weight - matchingO2.weight);
          totalDiff += diff;
          if (diff > eps) {
            weightsMatch = false;
            break;
          }
        }
      }

      if (weightsMatch) {
        pairs.push({
          node1Id: n1.id,
          node2Id: n2.id,
          diff: totalDiff,
        });
      }
    }
  }

  return pairs;
}

/**
 * Computes activation distribution stats (mean, variance, saturation).
 */
export function activationStats(
  activations: number[],
  minBound = 0,
  maxBound = 1
): ActivationDistribution {
  if (activations.length === 0) {
    return {
      min: 0,
      max: 0,
      mean: 0,
      variance: 0,
      saturatedLowCount: 0,
      saturatedHighCount: 0,
      totalCount: 0,
      isSaturated: false,
    };
  }

  let min = Infinity;
  let max = -Infinity;
  let sum = 0;

  for (const a of activations) {
    if (a < min) min = a;
    if (a > max) max = a;
    sum += a;
  }

  const mean = sum / activations.length;
  let varSum = 0;
  for (const a of activations) {
    varSum += (a - mean) ** 2;
  }
  const variance = varSum / activations.length;

  const span = maxBound - minBound;
  const threshold = 0.05 * span;

  let satLow = 0;
  let satHigh = 0;

  for (const a of activations) {
    if (a <= minBound + threshold) satLow++;
    if (a >= maxBound - threshold) satHigh++;
  }

  const isSaturated = (satLow + satHigh) / activations.length > 0.8;

  return {
    min,
    max,
    mean,
    variance,
    saturatedLowCount: satLow,
    saturatedHighCount: satHigh,
    totalCount: activations.length,
    isSaturated,
  };
}

import { Layer, NetEdge, NetNode, NetworkGraph, InitMethod, ActivationFn } from './types';
import { mulberry32, seededRandomRange } from './rng';

export function layerOrder(layers: Layer[]): Layer[] {
  return [...layers].sort((a, b) => a.order - b.order);
}

export function architecture(layers: Layer[], nodes: NetNode[]): number[] {
  const ordered = layerOrder(layers);
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  return ordered.map((l) => l.nodeIds.filter((id) => nodeMap.has(id)).length);
}

export function architectureString(layers: Layer[], nodes: NetNode[]): string {
  const arch = architecture(layers, nodes);
  return arch.length >= 2 ? arch.join('-') : '';
}

export function nodeLayerMap(layers: Layer[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const l of layers) {
    for (const nid of l.nodeIds) {
      map[nid] = l.id;
    }
  }
  return map;
}

// Box-Muller transform for standard normal N(0, 1) sampling
export function normalRandom(rng: () => number, mean = 0, std = 1): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + num * std;
}

// Weight initialization catalogue from File 3
export function initWeights(
  fanIn: number,
  fanOut: number,
  method: InitMethod,
  rng: () => number
): number[][] {
  const matrix: number[][] = [];

  for (let r = 0; r < fanOut; r++) {
    const row: number[] = [];
    for (let c = 0; c < fanIn; c++) {
      let w = 0;
      switch (method) {
        case 'glorotUniform': {
          const limit = Math.sqrt(6.0 / (fanIn + fanOut));
          w = seededRandomRange(rng, -limit, limit);
          break;
        }
        case 'glorotNormal': {
          const std = Math.sqrt(2.0 / (fanIn + fanOut));
          w = normalRandom(rng, 0, std);
          break;
        }
        case 'heNormal': {
          const std = Math.sqrt(2.0 / Math.max(1, fanIn));
          w = normalRandom(rng, 0, std);
          break;
        }
        case 'heUniform': {
          const limit = Math.sqrt(6.0 / Math.max(1, fanIn));
          w = seededRandomRange(rng, -limit, limit);
          break;
        }
        case 'lecunNormal': {
          const std = Math.sqrt(1.0 / Math.max(1, fanIn));
          w = normalRandom(rng, 0, std);
          break;
        }
        case 'smallNormal': {
          w = normalRandom(rng, 0, 0.1);
          break;
        }
        case 'uniform1': {
          w = seededRandomRange(rng, -1.0, 1.0);
          break;
        }
        case 'zeros': {
          w = 0;
          break;
        }
      }
      row.push(Number(w.toFixed(4)));
    }
    matrix.push(row);
  }

  return matrix;
}

// Picks standard init method automatically based on activation function
export function defaultInitForActivation(fn: ActivationFn): InitMethod {
  if (['relu', 'leakyRelu', 'elu', 'gelu', 'swish', 'softplus'].includes(fn)) {
    return 'heNormal';
  }
  return 'glorotUniform';
}

export function denseConnect(
  graph: NetworkGraph,
  fromLayer: Layer,
  toLayer: Layer,
  rng: () => number = mulberry32(42),
  initMethod: InitMethod = 'glorotUniform'
): NetEdge[] {
  const existingSet = new Set(graph.edges.map((e) => `${e.from}->${e.to}`));
  const fanIn = fromLayer.nodeIds.length;
  const fanOut = toLayer.nodeIds.length;
  const weights = initWeights(fanIn, fanOut, initMethod, rng);

  const newEdges: NetEdge[] = [];

  for (let toIdx = 0; toIdx < fanOut; toIdx++) {
    const toId = toLayer.nodeIds[toIdx];
    for (let fromIdx = 0; fromIdx < fanIn; fromIdx++) {
      const fromId = fromLayer.nodeIds[fromIdx];
      const key = `${fromId}->${toId}`;
      if (!existingSet.has(key)) {
        newEdges.push({
          id: `e_${fromId}_${toId}`,
          from: fromId,
          to: toId,
          weight: weights[toIdx][fromIdx],
        });
      }
    }
  }

  return newEdges;
}

export function countParams(graph: NetworkGraph): number {
  let count = graph.edges.length;
  for (const node of graph.nodes) {
    if (node.kind === 'neuron' || node.kind === 'output') {
      count++; // bias
    }
  }
  return count;
}

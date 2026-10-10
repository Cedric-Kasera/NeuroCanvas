import { NetworkGraph, NetNode, NetEdge } from './types';

/**
 * Computes topological order of nodes in graph (Kahn's algorithm).
 * Throws an Error if a cycle is detected.
 */
export function topologicalOrder(graph: NetworkGraph): string[] {
  const inDegree: Record<string, number> = {};
  const adj: Record<string, string[]> = {};

  for (const node of graph.nodes) {
    inDegree[node.id] = 0;
    adj[node.id] = [];
  }

  for (const edge of graph.edges) {
    if (inDegree[edge.to] !== undefined) {
      inDegree[edge.to] = (inDegree[edge.to] || 0) + 1;
    }
    if (adj[edge.from]) {
      adj[edge.from].push(edge.to);
    }
  }

  const queue: string[] = [];
  for (const node of graph.nodes) {
    if (inDegree[node.id] === 0) {
      queue.push(node.id);
    }
  }

  const order: string[] = [];
  while (queue.length > 0) {
    const u = queue.shift()!;
    order.push(u);

    for (const v of adj[u] || []) {
      inDegree[v]--;
      if (inDegree[v] === 0) {
        queue.push(v);
      }
    }
  }

  if (order.length !== graph.nodes.length) {
    throw new Error('Cycle detected in network graph. Neural networks must be feed-forward DAGs.');
  }

  return order;
}

/**
 * Partitions nodes into layers according to topological depth.
 */
export function partitionLayers(graph: NetworkGraph): string[][] {
  const topo = topologicalOrder(graph);
  const depth: Record<string, number> = {};

  for (const id of topo) {
    depth[id] = 0;
  }

  for (const id of topo) {
    const outEdges = graph.edges.filter((e) => e.from === id);
    for (const edge of outEdges) {
      depth[edge.to] = Math.max(depth[edge.to] || 0, (depth[id] || 0) + 1);
    }
  }

  const maxDepth = Math.max(0, ...Object.values(depth));
  const layers: string[][] = Array.from({ length: maxDepth + 1 }, () => []);

  for (const id of topo) {
    const d = depth[id] || 0;
    layers[d].push(id);
  }

  return layers.filter((l) => l.length > 0);
}

export function getNode(graph: NetworkGraph, id: string): NetNode | undefined {
  return graph.nodes.find((n) => n.id === id);
}

export function getIncomingEdges(graph: NetworkGraph, nodeId: string): NetEdge[] {
  return graph.edges.filter((e) => e.to === nodeId);
}

export function getOutgoingEdges(graph: NetworkGraph, nodeId: string): NetEdge[] {
  return graph.edges.filter((e) => e.from === nodeId);
}

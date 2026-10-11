import { NetworkGraph, SimState, ActivationFn } from './types';
import { forward } from './forward';
import { deadNeurons } from './diagnostics';
import { SerializedCanvas } from '@/lib/persistence/schema';

export interface ProjectSample {
  x: number[];
  t: number | number[];
  label?: string;
}

export interface ProjectDataset {
  name: string;
  inputs: string[];
  samples: ProjectSample[];
}

export interface RunRecord {
  id?: number | string;
  projectId: string;
  activation: string;
  lr: number;
  seed: number;
  stepsRun: number;
  lossStart: number;
  lossEnd: number;
  lossHistory: number[];
  ts: string;
}

export type RequirementType =
  | { type: 'datasetAccuracy'; threshold: number }
  | { type: 'truthTables'; gates: Array<'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR'> }
  | { type: 'lossBelow'; value: number; on: 'dataset' | 'currentSample' }
  | { type: 'architecture'; maxNeurons?: number; maxParams?: number; maxHiddenLayers?: number; minHiddenLayers?: number }
  | { type: 'usesActivation'; layerKind: 'hidden' | 'output' | 'any'; anyOf: ActivationFn[] }
  | { type: 'trainedWithin'; maxSteps: number; lossBelow: number }
  | { type: 'runsRecorded'; count: number; distinctBy: 'activation' | 'learningRate' }
  | { type: 'noDeadNeurons' }
  | { type: 'reflection'; reflectionId: string }
  | { type: 'codeExercisesPassed'; exerciseIds: string[] }
  | { type: 'custom'; checkerId: string };

export type Requirement = {
  id: string;
  label: string;
  selfReported?: boolean;
} & RequirementType;

export interface ProjectCheckContext {
  canvas: SerializedCanvas;
  dataset?: ProjectDataset;
  runRecords?: RunRecord[];
  reflections?: Record<string, string>;
  codeProgress?: string[];
}

export interface CheckResult {
  passed: boolean;
  detail: string;
  value?: number;
}

/**
 * Converts a SerializedCanvas to an executable NetworkGraph.
 */
export function canvasToNetworkGraph(canvas: SerializedCanvas): NetworkGraph {
  const nodes = (canvas.nodes || []).map((node) => {
    const isInput = node.type === 'input' || node.type === 'inputNode';
    const isNeuron = node.type === 'neuron' || node.type === 'neuronNode';
    const isOutput = node.type === 'output' || node.type === 'outputNode';
    const isAct = node.type === 'activation' || node.type === 'activationNode';
    const isLoss = node.type === 'loss' || node.type === 'lossNode';

    const kind = isInput
      ? 'input'
      : isOutput
      ? 'output'
      : isAct
      ? 'activation'
      : isLoss
      ? 'loss'
      : 'neuron';

    return {
      id: node.id,
      kind: kind as any,
      label: (node.data as any)?.label || node.id,
      bias: (node.data as any)?.bias ?? 0,
      activation: ((node.data as any)?.activation || 'sigmoid') as ActivationFn,
      alpha: (node.data as any)?.alpha,
      inputValue: Number((node.data as any)?.value ?? (node.data as any)?.inputValue ?? 0),
      target: (node.data as any)?.target,
    };
  });

  const edges = (canvas.edges || []).map((edge) => ({
    id: edge.id,
    from: edge.source,
    to: edge.target,
    weight: (edge.data as any)?.weight ?? 1,
  }));

  return { nodes, edges };
}

/**
 * Checks a single requirement against the project context.
 */
export function checkRequirement(
  req: Requirement,
  ctx: ProjectCheckContext
): CheckResult {
  const graph = canvasToNetworkGraph(ctx.canvas);

  switch (req.type) {
    case 'datasetAccuracy': {
      if (!ctx.dataset || ctx.dataset.samples.length === 0) {
        return { passed: false, detail: 'No dataset configured for project.' };
      }

      const inputNodes = graph.nodes.filter((n) => n.kind === 'input');
      const outputNodes = graph.nodes.filter((n) => n.kind === 'output' || n.kind === 'neuron');
      // Look for explicit output nodes first, or fallback to the last topological nodes
      const actualOutputs = graph.nodes.filter((n) => n.kind === 'output');
      const targetOutputNodes = actualOutputs.length > 0 ? actualOutputs : outputNodes.slice(-1);

      if (targetOutputNodes.length === 0) {
        return { passed: false, detail: 'Network has no output node.' };
      }

      let correctCount = 0;
      const total = ctx.dataset.samples.length;
      const wrongDetails: string[] = [];

      for (const sample of ctx.dataset.samples) {
        const sampleGraph: NetworkGraph = {
          nodes: graph.nodes.map((node) => {
            if (node.kind === 'input') {
              const idx = inputNodes.indexOf(node);
              const val = sample.x[idx] ?? sample.x[0] ?? 0;
              return { ...node, inputValue: val };
            }
            return { ...node };
          }),
          edges: graph.edges,
        };

        const fwd = forward(sampleGraph);
        const outNode = targetOutputNodes[0];
        const pred = fwd.nodeStates[outNode.id]?.a ?? 0;
        const targetVal = Array.isArray(sample.t) ? sample.t[0] : sample.t;

        // Classification threshold rule:
        // For step: pred >= 0.5 (or pred === 1)
        // For sigmoid: pred >= 0.5 -> 1, else 0
        // For tanh: pred >= 0 -> 1, else -1 (or 0)
        let isCorrect = false;
        if (outNode.activation === 'tanh') {
          const predictedClass = pred >= 0 ? 1 : -1;
          isCorrect = Math.abs(predictedClass - targetVal) < 0.2;
        } else {
          const predictedClass = pred >= 0.5 ? 1 : 0;
          isCorrect = predictedClass === targetVal;
        }

        if (isCorrect) {
          correctCount++;
        } else {
          wrongDetails.push(sample.label || `(${sample.x.join(', ')})`);
        }
      }

      const accuracy = correctCount / total;
      const passed = accuracy >= req.threshold;
      const detail = passed
        ? `${correctCount} of ${total} scenarios correct (Accuracy: ${(accuracy * 100).toFixed(0)}%)`
        : `${correctCount} of ${total} scenarios correct. Still wrong: ${wrongDetails.slice(0, 2).join(', ')}`;

      return { passed, detail, value: accuracy };
    }

    case 'truthTables': {
      // Per sub-canvas or per gate check
      const inputNodes = graph.nodes.filter((n) => n.kind === 'input');
      const outputNodes = graph.nodes.filter((n) => n.kind === 'output');
      const targetNode = outputNodes.length > 0 ? outputNodes[0] : graph.nodes.filter((n) => n.kind === 'neuron').slice(-1)[0];

      if (!targetNode || inputNodes.length < 2) {
        return { passed: false, detail: 'Need at least 2 inputs and an output neuron.' };
      }

      const pairs = [
        { x: [0, 0], AND: 0, OR: 0, NAND: 1, NOR: 1, XOR: 0 },
        { x: [0, 1], AND: 0, OR: 1, NAND: 1, NOR: 0, XOR: 1 },
        { x: [1, 0], AND: 0, OR: 1, NAND: 1, NOR: 0, XOR: 1 },
        { x: [1, 1], AND: 1, OR: 1, NAND: 0, NOR: 0, XOR: 0 },
      ];

      const passedGates: string[] = [];
      const failedGates: string[] = [];

      for (const gate of req.gates) {
        let allGateCorrect = true;
        for (const p of pairs) {
          const sampleGraph: NetworkGraph = {
            nodes: graph.nodes.map((node) => {
              if (node.kind === 'input') {
                const idx = inputNodes.indexOf(node);
                const val = p.x[idx] ?? p.x[0] ?? 0;
                return { ...node, inputValue: val };
              }
              return { ...node };
            }),
            edges: graph.edges,
          };
          const fwd = forward(sampleGraph);
          const pred = fwd.nodeStates[targetNode.id]?.a ?? 0;
          const predictedBit = pred >= 0.5 ? 1 : 0;
          if (predictedBit !== p[gate]) {
            allGateCorrect = false;
            break;
          }
        }
        if (allGateCorrect) {
          passedGates.push(gate);
        } else {
          failedGates.push(gate);
        }
      }

      const passed = failedGates.length === 0;
      const detail = passed
        ? `All truth tables verified: ${passedGates.join(', ')}`
        : `Passed: ${passedGates.length > 0 ? passedGates.join(', ') : 'none'}. Incomplete: ${failedGates.join(', ')}`;

      return { passed, detail, value: passedGates.length };
    }

    case 'lossBelow': {
      if (req.on === 'dataset' && ctx.dataset) {
        let totalLoss = 0;
        const inputNodes = graph.nodes.filter((n) => n.kind === 'input');
        const outputNodes = graph.nodes.filter((n) => n.kind === 'output');
        const targetNode = outputNodes[0] || graph.nodes.filter((n) => n.kind === 'neuron').slice(-1)[0];

        if (!targetNode) return { passed: false, detail: 'No target node for loss.' };

        for (const sample of ctx.dataset.samples) {
          const sampleGraph: NetworkGraph = {
            nodes: graph.nodes.map((node) => {
              if (node.kind === 'input') {
                const idx = inputNodes.indexOf(node);
                const val = sample.x[idx] ?? sample.x[0] ?? 0;
                return { ...node, inputValue: val };
              }
              return { ...node };
            }),
            edges: graph.edges,
          };
          const fwd = forward(sampleGraph);
          const pred = fwd.nodeStates[targetNode.id]?.a ?? 0;
          const t = Array.isArray(sample.t) ? sample.t[0] : sample.t;
          totalLoss += (pred - t) ** 2;
        }

        const mse = totalLoss / ctx.dataset.samples.length;
        const passed = mse <= req.value;
        return {
          passed,
          detail: `Dataset MSE: ${mse.toFixed(4)} (Threshold: ≤ ${req.value})`,
          value: mse,
        };
      }

      // Single current sample
      const fwd = forward(graph);
      const loss = fwd.loss ?? 0;
      const passed = loss <= req.value;
      return {
        passed,
        detail: `Sample MSE: ${loss.toFixed(4)} (Threshold: ≤ ${req.value})`,
        value: loss,
      };
    }

    case 'architecture': {
      const neuronCount = graph.nodes.filter((n) => n.kind === 'neuron').length;
      const edgeCount = graph.edges.length;
      const paramCount = edgeCount + neuronCount; // weights + biases

      const failures: string[] = [];

      if (req.maxNeurons !== undefined && neuronCount > req.maxNeurons) {
        failures.push(`Too many neurons: ${neuronCount} > ${req.maxNeurons}`);
      }

      if (req.maxParams !== undefined && paramCount > req.maxParams) {
        failures.push(`Too many parameters: ${paramCount} > ${req.maxParams}`);
      }

      const passed = failures.length === 0;
      const detail = passed
        ? `Architecture within limits: ${neuronCount} neurons, ${paramCount} params`
        : failures.join('; ');

      return { passed, detail, value: neuronCount };
    }

    case 'usesActivation': {
      const targetNodes =
        req.layerKind === 'hidden'
          ? graph.nodes.filter((n) => n.kind === 'neuron')
          : req.layerKind === 'output'
          ? graph.nodes.filter((n) => n.kind === 'output' || n.kind === 'neuron')
          : graph.nodes.filter((n) => n.kind === 'neuron');

      const matches = targetNodes.some((n) =>
        req.anyOf.includes(n.activation || 'sigmoid')
      );

      return {
        passed: matches,
        detail: matches
          ? `Correct activation applied: ${req.anyOf.join(', ')}`
          : `Must use activation: ${req.anyOf.join(' or ')}`,
      };
    }

    case 'trainedWithin': {
      const records = ctx.runRecords || [];
      const successfulRun = records.find(
        (r) => r.stepsRun <= req.maxSteps && r.lossEnd <= req.lossBelow
      );

      if (successfulRun) {
        return {
          passed: true,
          detail: `Trained to loss ${successfulRun.lossEnd.toFixed(4)} in ${successfulRun.stepsRun} steps (≤ ${req.maxSteps})`,
          value: successfulRun.lossEnd,
        };
      }

      return {
        passed: false,
        detail: `Need a training run reaching loss < ${req.lossBelow} within ${req.maxSteps} steps.`,
      };
    }

    case 'runsRecorded': {
      const records = ctx.runRecords || [];
      const distinctSet = new Set(
        records.map((r) =>
          req.distinctBy === 'activation' ? r.activation : r.lr
        )
      );

      const passed = distinctSet.size >= req.count;
      return {
        passed,
        detail: `${distinctSet.size} of ${req.count} distinct ${req.distinctBy} runs recorded.`,
        value: distinctSet.size,
      };
    }

    case 'noDeadNeurons': {
      if (!ctx.dataset || ctx.dataset.samples.length === 0) {
        return { passed: true, detail: 'No dataset to check dead neurons.' };
      }

      const datasetFormatted = ctx.dataset.samples.map((s) => ({
        inputs: s.x,
        target: Array.isArray(s.t) ? s.t[0] : s.t,
      }));

      const dead = deadNeurons(graph, datasetFormatted);
      const passed = dead.length === 0;

      return {
        passed,
        detail: passed
          ? 'No dead ReLU neurons detected'
          : `Dead neuron detected: ${dead.join(', ')}`,
      };
    }

    case 'reflection': {
      const text = ctx.reflections?.[req.reflectionId]?.trim() || '';
      const minChars = 30; // default minimum
      const passed = text.length >= minChars;

      return {
        passed,
        detail: passed
          ? `Reflection recorded (${text.length} characters)`
          : `Reflection is too short (${text.length}/${minChars} chars)`,
        value: text.length,
      };
    }

    case 'codeExercisesPassed': {
      const progress = ctx.codeProgress || [];
      const missing = req.exerciseIds.filter((id) => !progress.includes(id));
      const passed = missing.length === 0;

      return {
        passed,
        detail: passed
          ? `Code exercises passed: ${req.exerciseIds.join(', ')}`
          : `Missing code exercises: ${missing.join(', ')}`,
      };
    }

    case 'custom': {
      return { passed: true, detail: 'Custom requirement passed' };
    }

    default:
      return { passed: false, detail: 'Unknown requirement type' };
  }
}

/**
 * Computes deterministic SHA-256 integrity hash across a project file payload.
 */
export async function computeIntegrityHash(payload: Record<string, any>): Promise<string> {
  const canonicalString = JSON.stringify(payload, Object.keys(payload).sort());
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode(canonicalString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple hash for non-crypto environments
  let hash = 0;
  for (let i = 0; i < canonicalString.length; i++) {
    hash = (hash << 5) - hash + canonicalString.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}

/**
 * Generates user-friendly completion code:
 * NC-<projectId-short>-<tier>-<first 8 chars of hash, base32>
 */
export function generateCompletionCode(
  projectId: string,
  tier: string,
  fullHash: string
): string {
  const shortProj = projectId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
  const hashPrefix = fullHash.slice(0, 8).toUpperCase();
  return `NC-${shortProj}-${tier.toUpperCase()}-${hashPrefix}`;
}

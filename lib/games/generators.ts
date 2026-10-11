import { ActivationFn } from '@/lib/engine/types';
import { activate } from '@/lib/engine/activations';
import { forward } from '@/lib/engine/forward';
import { backward } from '@/lib/engine/backward';
import { SerializedCanvas } from '@/lib/persistence/schema';

export interface TunerLevel {
  id: string;
  difficulty: 1 | 2 | 3;
  activation: ActivationFn;
  inputs: number[];
  targetOutput: number;
  tolerance: number;
  initialWeights: number[];
  initialBias: number;
  solutionWeights: number[];
  solutionBias: number;
  maxMoves: number;
}

export interface CurveRound {
  id: string;
  kind: 'curve-to-name' | 'name-to-curve' | 'saturation';
  targetActivation?: ActivationFn;
  curveData?: Array<{ x: number; y: number }>;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
  distractorCurves?: Array<Array<{ x: number; y: number }>>;
}

export interface BlameLevel {
  id: string;
  target: number;
  inputValues: [number, number];
  weights: {
    w_in1_h1: number;
    w_in1_h2: number;
    w_in2_h1: number;
    w_in2_h2: number;
    w_h1_out: number;
    w_h2_out: number;
  };
  candidateEdges: Array<{
    id: string;
    label: string;
    weight: number;
    gradient: number;
    absGradient: number;
  }>;
  winningEdgeId: string;
}

/** Simple deterministic PRNG based on Mulberry32 */
export function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Generates a sample curve for an activation function across range [-4, 4] */
export function sampleCurve(act: ActivationFn, points = 30): Array<{ x: number; y: number }> {
  const result: Array<{ x: number; y: number }> = [];
  const start = -4;
  const end = 4;
  const step = (end - start) / (points - 1);
  for (let i = 0; i < points; i++) {
    const x = Number((start + i * step).toFixed(2));
    const y = Number(activate(act, x).toFixed(3));
    result.push({ x, y });
  }
  return result;
}

/** Generates a Weight Tuner level */
export function genTunerLevel(seed: number, difficulty: 1 | 2 | 3): TunerLevel {
  const rng = mulberry32(seed);

  let activation: ActivationFn = 'identity';
  if (difficulty === 2) activation = 'sigmoid';
  if (difficulty === 3) activation = rng() > 0.5 ? 'tanh' : 'relu';

  // Input on 0.5 grid
  const x1 = Math.round((rng() * 4 - 2) * 2) / 2 || 1.0;
  const x2 = Math.round((rng() * 4 - 2) * 2) / 2 || 0.5;

  // Solution parameters
  const solW1 = Math.round((rng() * 3 - 1.5) * 2) / 2 || 1.0;
  const solW2 = Math.round((rng() * 3 - 1.5) * 2) / 2 || -0.5;
  const solB = Math.round((rng() * 2 - 1.0) * 2) / 2 || 0.0;

  const solZ = x1 * solW1 + x2 * solW2 + solB;
  const targetOutput = Number(activate(activation, solZ).toFixed(3));

  // Initial perturbed starting point
  const initW1 = Math.round((solW1 + (rng() > 0.5 ? 1 : -1)) * 2) / 2;
  const initW2 = Math.round((solW2 + (rng() > 0.5 ? 1 : -1)) * 2) / 2;
  const initB = Math.round((solB + (rng() > 0.5 ? 0.5 : -0.5)) * 2) / 2;

  const tolerance = activation === 'sigmoid' || activation === 'tanh' ? 0.03 : 0.05;
  const maxMoves = difficulty === 3 ? 5 : 6;

  return {
    id: `tuner_${seed}_d${difficulty}`,
    difficulty,
    activation,
    inputs: [x1, x2],
    targetOutput,
    tolerance,
    initialWeights: [initW1, initW2],
    initialBias: initB,
    solutionWeights: [solW1, solW2],
    solutionBias: solB,
    maxMoves,
  };
}

/** Generates a Curve Detective round */
export function genCurveRound(seed: number, difficulty: 1 | 2 | 3): CurveRound {
  const rng = mulberry32(seed);

  const basePool: ActivationFn[] = ['identity', 'step', 'sigmoid', 'tanh', 'relu'];
  const advancedPool: ActivationFn[] = [
    'identity',
    'step',
    'sigmoid',
    'tanh',
    'relu',
    'leakyRelu',
    'elu',
    'softplus',
    'swish',
    'gelu',
  ];
  const pool = difficulty === 3 ? advancedPool : basePool;

  const targetAct = pool[Math.floor(rng() * pool.length)];
  const curveData = sampleCurve(targetAct);

  // Distractors
  const distractors = pool.filter((a) => a !== targetAct);
  // Shuffle and pick 3
  const shuffled = distractors.sort(() => rng() - 0.5).slice(0, 3);
  const options = [targetAct, ...shuffled].sort(() => rng() - 0.5);
  const correctOptionIndex = options.indexOf(targetAct);

  return {
    id: `curve_${seed}_${targetAct}`,
    kind: 'curve-to-name',
    targetActivation: targetAct,
    curveData,
    options,
    correctOptionIndex,
    explanation: `The graph shows ${targetAct}. Notice its output range and asymptotic behavior!`,
  };
}

/** Generates a Blame Game level where one weight gradient is >= 20% higher */
export function genBlameLevel(seed: number): BlameLevel {
  let currentSeed = seed;
  let attempts = 0;

  while (attempts < 50) {
    attempts++;
    const rng = mulberry32(currentSeed++);

    const in1 = rng() > 0.5 ? 1 : 0;
    const in2 = rng() > 0.5 ? 1 : 0;
    const target = rng() > 0.5 ? 1 : 0;

    const w1 = Number((rng() * 2 - 1).toFixed(2));
    const w2 = Number((rng() * 2 - 1).toFixed(2));
    const w3 = Number((rng() * 2 - 1).toFixed(2));
    const w4 = Number((rng() * 2 - 1).toFixed(2));
    const w5 = Number((rng() * 2 - 1).toFixed(2));
    const w6 = Number((rng() * 2 - 1).toFixed(2));

    const graph = {
      nodes: [
        { id: 'in1', kind: 'input' as const, inputValue: in1 },
        { id: 'in2', kind: 'input' as const, inputValue: in2 },
        { id: 'h1', kind: 'neuron' as const, bias: 0.1, activation: 'sigmoid' as ActivationFn },
        { id: 'h2', kind: 'neuron' as const, bias: -0.1, activation: 'sigmoid' as ActivationFn },
        { id: 'out', kind: 'neuron' as const, bias: 0.0, activation: 'sigmoid' as ActivationFn },
        { id: 'loss', kind: 'output' as const, target },
      ],
      edges: [
        { id: 'e_in1_h1', from: 'in1', to: 'h1', weight: w1 },
        { id: 'e_in1_h2', from: 'in1', to: 'h2', weight: w2 },
        { id: 'e_in2_h1', from: 'in2', to: 'h1', weight: w3 },
        { id: 'e_in2_h2', from: 'in2', to: 'h2', weight: w4 },
        { id: 'e_h1_out', from: 'h1', to: 'out', weight: w5 },
        { id: 'e_h2_out', from: 'h2', to: 'out', weight: w6 },
        { id: 'e_out_loss', from: 'out', to: 'loss', weight: 1.0 },
      ],
    };

    const fwd = forward(graph);
    const bwd = backward(graph, fwd);

    const candidateEdges = [
      { id: 'e_in1_h1', label: 'w(in₁ → h₁)', weight: w1, gradient: bwd.edgeGrads['e_in1_h1'] || 0 },
      { id: 'e_in2_h2', label: 'w(in₂ → h₂)', weight: w4, gradient: bwd.edgeGrads['e_in2_h2'] || 0 },
      { id: 'e_h1_out', label: 'w(h₁ → out)', weight: w5, gradient: bwd.edgeGrads['e_h1_out'] || 0 },
    ].map((c) => ({
      ...c,
      absGradient: Math.abs(c.gradient),
    }));

    // Sort by abs gradient descending
    const sorted = [...candidateEdges].sort((a, b) => b.absGradient - a.absGradient);

    // Verify top gradient is at least 0.01 and exceeds second by >= 20%
    if (sorted[0].absGradient > 0.01 && sorted[0].absGradient >= sorted[1].absGradient * 1.2) {
      return {
        id: `blame_${seed}`,
        target,
        inputValues: [in1, in2],
        weights: {
          w_in1_h1: w1,
          w_in1_h2: w2,
          w_in2_h1: w3,
          w_in2_h2: w4,
          w_h1_out: w5,
          w_h2_out: w6,
        },
        candidateEdges,
        winningEdgeId: sorted[0].id,
      };
    }
  }

  // Fallback preset if random draws were close
  return {
    id: `blame_${seed}_fallback`,
    target: 1,
    inputValues: [1, 0],
    weights: {
      w_in1_h1: 0.8,
      w_in1_h2: -0.4,
      w_in2_h1: 0.2,
      w_in2_h2: 0.5,
      w_h1_out: 1.2,
      w_h2_out: -0.3,
    },
    candidateEdges: [
      { id: 'e_in1_h1', label: 'w(in₁ → h₁)', weight: 0.8, gradient: 0.05, absGradient: 0.05 },
      { id: 'e_in2_h2', label: 'w(in₂ → h₂)', weight: 0.5, gradient: 0.01, absGradient: 0.01 },
      { id: 'e_h1_out', label: 'w(h₁ → out)', weight: 1.2, gradient: 0.18, absGradient: 0.18 },
    ],
    winningEdgeId: 'e_h1_out',
  };
}

/** Computes date key and seed from UTC date */
export function dailySeed(date = new Date()): { dateKey: string; seed: number; dayNumber: number } {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const dateKey = `${year}-${month}-${day}`;

  // Epoch constant: 2026-01-01
  const epoch = Date.UTC(2026, 0, 1);
  const currentUtc = Date.UTC(year, date.getUTCMonth(), date.getUTCDate());
  const dayNumber = Math.max(1, Math.floor((currentUtc - epoch) / (1000 * 60 * 60 * 24)));

  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }

  return { dateKey, seed: Math.abs(hash), dayNumber };
}

/** Generates shareable string */
export function shareDailyResult(dayNumber: number, totalStars: number, streak: number): string {
  return `NeuroCanvas Daily #${dayNumber} ⭐ ${totalStars}/15 🔥 ${streak}-day streak\nhttps://neurocanvas.app`;
}

/**
 * Converts a Weight Tuner level into an interactive visual SerializedCanvas
 */
export function tunerLevelToCanvas(
  level: TunerLevel,
  weights: number[],
  bias: number
): SerializedCanvas {
  const nodes: any[] = level.inputs.map((val, idx) => ({
    id: `in_${idx + 1}`,
    type: 'inputNode',
    position: { x: 100, y: 120 + idx * 120 },
    data: { label: `Input x${idx + 1}`, value: val, inputValue: val },
  }));

  nodes.push({
    id: 'neuron_tuner',
    type: 'neuronNode',
    position: { x: 380, y: 160 },
    data: { label: 'Tuner Neuron', bias, activation: level.activation },
  });

  nodes.push({
    id: 'out_target',
    type: 'outputNode',
    position: { x: 620, y: 160 },
    data: { label: 'Target Output', target: level.targetOutput },
  });

  const edges: any[] = level.inputs.map((_, idx) => ({
    id: `e_in${idx + 1}_neuron`,
    source: `in_${idx + 1}`,
    target: 'neuron_tuner',
    data: { weight: weights[idx] ?? 0.5 },
    type: 'weightedEdge',
  }));

  edges.push({
    id: 'e_neuron_out',
    source: 'neuron_tuner',
    target: 'out_target',
    data: { weight: 1.0 },
    type: 'weightedEdge',
  });

  return {
    app: 'neurocanvas',
    schemaVersion: 2,
    name: `Weight Tuner - Level ${level.difficulty}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewport: { x: 50, y: 50, zoom: 1 },
    settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
    nodes,
    edges,
    layers: [],
  };
}

/**
 * Converts a Blame Game topology into an interactive visual SerializedCanvas
 */
export function blameLevelToCanvas(level: BlameLevel): SerializedCanvas {
  return {
    app: 'neurocanvas',
    schemaVersion: 2,
    name: 'Blame Game Topology',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    viewport: { x: 50, y: 50, zoom: 1 },
    settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
    nodes: [
      { id: 'in1', type: 'inputNode', position: { x: 100, y: 100 }, data: { label: 'x₁', value: level.inputValues[0], inputValue: level.inputValues[0] } },
      { id: 'in2', type: 'inputNode', position: { x: 100, y: 240 }, data: { label: 'x₂', value: level.inputValues[1], inputValue: level.inputValues[1] } },
      { id: 'h1', type: 'neuronNode', position: { x: 340, y: 100 }, data: { label: 'h₁', bias: 0, activation: 'sigmoid' } },
      { id: 'h2', type: 'neuronNode', position: { x: 340, y: 240 }, data: { label: 'h₂', bias: 0, activation: 'sigmoid' } },
      { id: 'out', type: 'outputNode', position: { x: 560, y: 170 }, data: { label: 'Output', target: level.target } },
    ],
    edges: [
      { id: 'e_in1_h1', source: 'in1', target: 'h1', data: { weight: level.weights.w_in1_h1 }, type: 'weightedEdge' },
      { id: 'e_in1_h2', source: 'in1', target: 'h2', data: { weight: level.weights.w_in1_h2 }, type: 'weightedEdge' },
      { id: 'e_in2_h1', source: 'in2', target: 'h1', data: { weight: level.weights.w_in2_h1 }, type: 'weightedEdge' },
      { id: 'e_in2_h2', source: 'in2', target: 'h2', data: { weight: level.weights.w_in2_h2 }, type: 'weightedEdge' },
      { id: 'e_h1_out', source: 'h1', target: 'out', data: { weight: level.weights.w_h1_out }, type: 'weightedEdge' },
      { id: 'e_h2_out', source: 'h2', target: 'out', data: { weight: level.weights.w_h2_out }, type: 'weightedEdge' },
    ],
    layers: [],
  };
}

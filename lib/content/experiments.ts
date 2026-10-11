import { SerializedCanvas } from '@/lib/persistence/schema';

export type ExperimentGate =
  | { type: 'lossBelowAfterTraining'; value: number; steps: number }
  | { type: 'lossDropsBy'; factor: number; steps: number }
  | { type: 'gradRatioAbove'; firstEdge: string; lastEdge: string; value: number }
  | { type: 'deadNeuronsEqual'; value: number }
  | { type: 'neuronsDiffer'; layerId?: string; epsilon: number };

export interface ExperimentDefinition {
  id: string;
  title: string;
  hook: string;
  difficulty: 1 | 2 | 3;
  minutes: number;
  recommendedAfter?: string;
  preset: SerializedCanvas;
  dataset?: Array<{ inputs: number[]; target: number }>;
  lockedControls?: { keys?: string[]; nodeIds?: string[] };
  predict: {
    question: string;
    options: string[];
    correct: number;
    reveal: string;
  };
  run: {
    train: { n: number; lr: number };
    diagnostics: Array<'lossCurve' | 'gradBars' | 'deadBadges' | 'symmetryBadge' | 'activationHist'>;
  };
  observe: string[];
  diagnose: {
    question: string;
    options: string[];
    correct: number;
    explain: string;
  };
  fix: {
    instruction: string;
    allowedChanges: string[];
    gate: ExperimentGate;
    solutionHint: string;
  };
  takeaway: string[];
  tags: string[];
  relatedLessonId?: string;
}

export const EXPERIMENTS: ExperimentDefinition[] = [
  {
    id: 'x1-runaway-learning-rate',
    title: 'The Runaway Learning Rate',
    hook: 'This network refuses to learn and its error explodes. Can you work out why?',
    difficulty: 1,
    minutes: 3,
    recommendedAfter: 'lesson-08-gradient-descent',
    preset: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Runaway Learning Rate',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 100, y: 150, zoom: 1 },
      settings: { mode: 'student', snap: true, grid: true, minimap: false, precision: 3 },
      nodes: [
        { id: 'x1_in', type: 'input', position: { x: 120, y: 180 }, data: { label: 'Input x = 1.0', inputValue: 1.0 } },
        { id: 'x1_neuron', type: 'neuron', position: { x: 360, y: 180 }, data: { label: 'Identity Neuron', bias: 0.0, activation: 'identity' } },
        { id: 'x1_out', type: 'output', position: { x: 580, y: 180 }, data: { label: 'Target = 2.0', target: 2.0 } },
      ],
      edges: [
        { id: 'e_x1_w', source: 'x1_in', target: 'x1_neuron', data: { weight: 0.0 } },
        { id: 'e_x1_out', source: 'x1_neuron', target: 'x1_out', data: { weight: 1.0 } },
      ],
    },
    lockedControls: { nodeIds: ['x1_neuron'] }, // bias fixed at 0
    predict: {
      question: 'With learning rate η = 1.1, what will the loss curve do when we train?',
      options: ['Fall smoothly towards zero', 'Bounce wildly and grow exponentially', 'Stay completely flat'],
      correct: 1,
      reveal: 'At η = 1.1, each step multiplies the distance from target by (1 - 2·η) = -1.2, so error oscillates and explodes!',
    },
    run: {
      train: { n: 10, lr: 1.1 },
      diagnostics: ['lossCurve', 'gradBars'],
    },
    observe: [
      'Watch the loss sequence: 4.00 → 5.76 → 8.29 → 11.94 … it diverges!',
      'Notice the weight bouncing back and forth across 2.0: 0 → 4.4 → -0.88 → 5.45 …',
      'The gradients are getting larger each step because the error is growing.',
    ],
    diagnose: {
      question: 'Why is the network failing to reach the target?',
      options: [
        'The neuron activation function is fundamentally broken',
        'The steps are too big and violently overshoot the target minimum',
        'Target 2.0 is mathematically unreachable for this network',
      ],
      correct: 1,
      explain: 'When the learning rate is larger than 1.0, the update step overshoots the minimum and lands further away than where it started!',
    },
    fix: {
      instruction: 'Lower the learning rate slider into the stable zone (e.g., 0.1 to 0.5) and run 10 training steps.',
      allowedChanges: ['learningRate'],
      gate: { type: 'lossDropsBy', factor: 10, steps: 10 },
      solutionHint: 'Set learning rate to 0.5 (arrives in 1 step) or 0.1, then click Train ×10.',
    },
    takeaway: [
      'Too-large learning rates cause gradient descent to overshoot and diverge.',
      'Too-small rates take forever to converge; the optimal rate balances speed and stability.',
      'In deep learning, learning rate schedulers and adaptive optimizers (Adam) help tame this.',
    ],
    tags: ['learning-rate', 'gradient-descent', 'divergence'],
    relatedLessonId: 'lesson-08-gradient-descent',
  },
  {
    id: 'x2-vanishing-gradients',
    title: 'Vanishing Gradients',
    hook: 'Why do deep networks with sigmoids struggle to train early layers? Watch gradients evaporate.',
    difficulty: 2,
    minutes: 4,
    recommendedAfter: 'lesson-09-backpropagation',
    preset: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Vanishing Gradients Deep Chain',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 40, y: 150, zoom: 0.85 },
      settings: { mode: 'student', snap: true, grid: true, minimap: false, precision: 4 },
      nodes: [
        { id: 'v_in', type: 'input', position: { x: 50, y: 180 }, data: { label: 'x = 1', inputValue: 1.0 } },
        { id: 'v_n1', type: 'neuron', position: { x: 190, y: 180 }, data: { label: 'Layer 1 (Sigmoid)', bias: 0.0, activation: 'sigmoid' } },
        { id: 'v_n2', type: 'neuron', position: { x: 330, y: 180 }, data: { label: 'Layer 2 (Sigmoid)', bias: 0.0, activation: 'sigmoid' } },
        { id: 'v_n3', type: 'neuron', position: { x: 470, y: 180 }, data: { label: 'Layer 3 (Sigmoid)', bias: 0.0, activation: 'sigmoid' } },
        { id: 'v_n4', type: 'neuron', position: { x: 610, y: 180 }, data: { label: 'Layer 4 (Sigmoid)', bias: 0.0, activation: 'sigmoid' } },
        { id: 'v_n5', type: 'neuron', position: { x: 750, y: 180 }, data: { label: 'Layer 5 (Sigmoid)', bias: 0.0, activation: 'sigmoid' } },
        { id: 'v_out', type: 'output', position: { x: 890, y: 180 }, data: { label: 'Target = 0.0', target: 0.0 } },
      ],
      edges: [
        { id: 'e_v_1', source: 'v_in', target: 'v_n1', data: { weight: 1.0 } },
        { id: 'e_v_2', source: 'v_n1', target: 'v_n2', data: { weight: 1.0 } },
        { id: 'e_v_3', source: 'v_n2', target: 'v_n3', data: { weight: 1.0 } },
        { id: 'e_v_4', source: 'v_n3', target: 'v_n4', data: { weight: 1.0 } },
        { id: 'e_v_5', source: 'v_n4', target: 'v_n5', data: { weight: 1.0 } },
        { id: 'e_v_6', source: 'v_n5', target: 'v_out', data: { weight: 1.0 } },
      ],
    },
    predict: {
      question: 'Which weight gets the largest gradient magnitude during backpropagation?',
      options: ['The first weight (near the input)', 'The middle weight', 'The last weight (near the output)'],
      correct: 2,
      reveal: 'The output weight gets the direct error! Each backward step multiplies by σ′(z) ≤ 0.25, shrinking blame exponentially.',
    },
    run: {
      train: { n: 1, lr: 1.0 },
      diagnostics: ['gradBars', 'lossCurve'],
    },
    observe: [
      'Compare the gradient bar for weight 1 vs weight 6.',
      'The gradient at the first weight is over 100× smaller than at the last weight!',
      'Because of this, the first layers barely update, paralyzing deep network learning.',
    ],
    diagnose: {
      question: 'What causes the gradient to evaporate across layers?',
      options: [
        'Floating point precision rounding errors in JavaScript',
        'Sigmoid derivatives are at most 0.25, so multiplying them repeatedly shrinks the signal exponentially',
        'The loss function was configured incorrectly',
      ],
      correct: 1,
      explain: 'Each layer multiplies the gradient by w · σ′(z). Since max(σ′) = 0.25, 4 layers shrink the gradient by at least 1/256.',
    },
    fix: {
      instruction: 'Switch hidden neurons n1, n2, n3, and n4 from Sigmoid to ReLU (whose derivative is 1.0 for positive inputs).',
      allowedChanges: ['activation'],
      gate: { type: 'gradRatioAbove', firstEdge: 'e_v_1', lastEdge: 'e_v_5', value: 0.5 },
      solutionHint: 'Click on neurons n1 through n4 and change their activation function to ReLU.',
    },
    takeaway: [
      'Saturating activations (Sigmoid, Tanh) suffer from vanishing gradients in deep networks.',
      'Non-saturating activations like ReLU have a constant derivative of 1 for z > 0, preserving gradients across depth.',
      'This discovery is why deep architectures (AlexNet, ResNets) unlocked the modern deep learning boom.',
    ],
    tags: ['vanishing-gradient', 'backprop', 'relu', 'depth'],
    relatedLessonId: 'lesson-09-backpropagation',
  },
  {
    id: 'x3-the-dead-relu',
    title: 'The Dead ReLU',
    hook: 'One neuron in this network is completely lifeless. It will never learn again. Why?',
    difficulty: 2,
    minutes: 3,
    preset: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Dead ReLU Demo',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 80, y: 120, zoom: 0.95 },
      settings: { mode: 'student', snap: true, grid: true, minimap: false, precision: 3 },
      nodes: [
        { id: 'd_in1', type: 'input', position: { x: 80, y: 120 }, data: { label: 'x₁', inputValue: 0 } },
        { id: 'd_in2', type: 'input', position: { x: 80, y: 260 }, data: { label: 'x₂', inputValue: 0 } },
        { id: 'd_h1', type: 'neuron', position: { x: 300, y: 120 }, data: { label: 'Dead ReLU (h₁)', bias: -5.0, activation: 'relu' } },
        { id: 'd_h2', type: 'neuron', position: { x: 300, y: 260 }, data: { label: 'Healthy ReLU (h₂)', bias: -0.2, activation: 'relu' } },
        { id: 'd_out', type: 'neuron', position: { x: 520, y: 190 }, data: { label: 'Output', bias: 0.0, activation: 'sigmoid' } },
        { id: 'd_tar', type: 'output', position: { x: 700, y: 190 }, data: { label: 'Target', target: 0 } },
      ],
      edges: [
        { id: 'e_d_1', source: 'd_in1', target: 'd_h1', data: { weight: 0.5 } },
        { id: 'e_d_2', source: 'd_in2', target: 'd_h1', data: { weight: 0.5 } },
        { id: 'e_d_3', source: 'd_in1', target: 'd_h2', data: { weight: 1.0 } },
        { id: 'e_d_4', source: 'd_in2', target: 'd_h2', data: { weight: 1.0 } },
        { id: 'e_d_5', source: 'd_h1', target: 'd_out', data: { weight: 0.8 } },
        { id: 'e_d_6', source: 'd_h2', target: 'd_out', data: { weight: 0.8 } },
        { id: 'e_d_7', source: 'd_out', target: 'd_tar', data: { weight: 1.0 } },
      ],
    },
    dataset: [
      { inputs: [0, 0], target: 0 },
      { inputs: [0, 1], target: 1 },
      { inputs: [1, 0], target: 1 },
      { inputs: [1, 1], target: 1 },
    ],
    predict: {
      question: 'Will h₁ with bias -5 ever wake up if we train for 200 steps?',
      options: ['Yes, gradient descent will eventually push its bias up', 'No, it will never wake up', 'Only if we double the learning rate'],
      correct: 1,
      reveal: 'Because z is negative for all training samples, ReLU output is 0 and its derivative is 0 everywhere. Zero gradient means zero update!',
    },
    run: {
      train: { n: 200, lr: 0.5 },
      diagnostics: ['deadBadges', 'lossCurve'],
    },
    observe: [
      'Notice the "DEAD" warning badge on neuron h₁.',
      'Even after 200 training steps, h₁ incoming weights and bias have not budged by even 0.0001.',
      'The network only has 1 functioning hidden neuron, crippling capacity.',
    ],
    diagnose: {
      question: 'Why does a dead ReLU stay dead forever?',
      options: [
        'When sum z < 0, ReLU derivative is strictly 0.0, so the gradient update is identically 0',
        'The loss function ignores neurons with negative bias',
        'Weights are capped at zero by the activation layer',
      ],
      correct: 0,
      explain: 'Since ReLU(z)=0 for z<0 and d/dz=0, no gradient can pass backward into the neuron. With zero gradient, its parameters never change.',
    },
    fix: {
      instruction: 'Fix the dead neuron: Set h₁ bias to 0.0, or switch h₁ activation to Leaky ReLU (or ELU). Then train to verify.',
      allowedChanges: ['bias', 'activation'],
      gate: { type: 'deadNeuronsEqual', value: 0 },
      solutionHint: 'Select neuron h₁ and change its bias from -5.0 to 0.0, or change its activation to Leaky ReLU.',
    },
    takeaway: [
      'A ReLU that outputs zero across the whole training distribution is permanently dead.',
      'Leaky ReLU (f(z) = 0.01z for z < 0) solves this by providing a small gradient slope everywhere.',
      'Proper weight initialization (He normal) and small positive bias initialization prevent neurons from dying at start.',
    ],
    tags: ['dead-relu', 'leaky-relu', 'gradient', 'zero-slope'],
  },
  {
    id: 'x4-the-symmetry-trap',
    title: 'The Symmetry Trap',
    hook: 'All hidden neurons start with zero weights. Why do they refuse to learn different features?',
    difficulty: 2,
    minutes: 3,
    preset: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Zero-Init Symmetry Trap',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 80, y: 120, zoom: 0.95 },
      settings: { mode: 'student', snap: true, grid: true, minimap: false, precision: 3 },
      nodes: [
        { id: 's_in1', type: 'input', position: { x: 80, y: 120 }, data: { label: 'x₁', inputValue: 0 } },
        { id: 's_in2', type: 'input', position: { x: 80, y: 260 }, data: { label: 'x₂', inputValue: 0 } },
        { id: 's_h1', type: 'neuron', position: { x: 300, y: 100 }, data: { label: 'Hidden 1', bias: 0.0, activation: 'sigmoid' } },
        { id: 's_h2', type: 'neuron', position: { x: 300, y: 200 }, data: { label: 'Hidden 2', bias: 0.0, activation: 'sigmoid' } },
        { id: 's_h3', type: 'neuron', position: { x: 300, y: 300 }, data: { label: 'Hidden 3', bias: 0.0, activation: 'sigmoid' } },
        { id: 's_out', type: 'neuron', position: { x: 520, y: 200 }, data: { label: 'Output', bias: 0.0, activation: 'sigmoid' } },
        { id: 's_tar', type: 'output', position: { x: 700, y: 200 }, data: { label: 'Target', target: 0 } },
      ],
      edges: [
        { id: 'e_s_1', source: 's_in1', target: 's_h1', data: { weight: 0.0 } },
        { id: 'e_s_2', source: 's_in1', target: 's_h2', data: { weight: 0.0 } },
        { id: 'e_s_3', source: 's_in1', target: 's_h3', data: { weight: 0.0 } },
        { id: 'e_s_4', source: 's_in2', target: 's_h1', data: { weight: 0.0 } },
        { id: 'e_s_5', source: 's_in2', target: 's_h2', data: { weight: 0.0 } },
        { id: 'e_s_6', source: 's_in2', target: 's_h3', data: { weight: 0.0 } },
        { id: 'e_s_7', source: 's_h1', target: 's_out', data: { weight: 0.0 } },
        { id: 'e_s_8', source: 's_h2', target: 's_out', data: { weight: 0.0 } },
        { id: 'e_s_9', source: 's_h3', target: 's_out', data: { weight: 0.0 } },
        { id: 'e_s_10', source: 's_out', target: 's_tar', data: { weight: 1.0 } },
      ],
    },
    dataset: [
      { inputs: [0, 0], target: 0 },
      { inputs: [0, 1], target: 1 },
      { inputs: [1, 0], target: 1 },
      { inputs: [1, 1], target: 0 },
    ],
    predict: {
      question: 'After 500 training steps, will Hidden 1, Hidden 2, and Hidden 3 compute different values?',
      options: ['Yes, non-linearities naturally split them up', 'No, they will remain 100% identical forever'],
      correct: 1,
      reveal: 'Because all weights start identical, every hidden neuron receives the exact same gradient. They update in complete lockstep!',
    },
    run: {
      train: { n: 100, lr: 1.0 },
      diagnostics: ['symmetryBadge', 'lossCurve'],
    },
    observe: [
      'Check the "Symmetric" warning icon between the three hidden neurons.',
      'Every weight in each hidden neuron updates to the exact same value.',
      'Having three symmetric neurons is mathematically identical to having just one neuron!',
    ],
    diagnose: {
      question: 'What breaks this symmetry so neurons can specialize?',
      options: [
        'Running more training epochs',
        'Random weight initialization (breaking symmetry)',
        'Decreasing the learning rate',
      ],
      correct: 1,
      explain: 'Random initialization gives each neuron different initial weights, so they receive different gradient signals and specialize into distinct feature detectors.',
    },
    fix: {
      instruction: 'Click "Re-init Glorot" to break symmetry with random weights, then train for 100 steps.',
      allowedChanges: ['reinit'],
      gate: { type: 'neuronsDiffer', epsilon: 0.001 },
      solutionHint: 'Click the Re-init button on the simulation bar to generate random weights.',
    },
    takeaway: [
      'Initializing all weights to zero forces symmetric neurons to learn identical features forever.',
      'Random weight initialization (Glorot, He) is essential to break symmetry.',
      'Good initialization scales randomness by layer width (fan-in, fan-out) to stabilize activation variance.',
    ],
    tags: ['symmetry', 'initialization', 'glorot', 'weight-init'],
  },
  {
    id: 'x5-the-step-that-cant-learn',
    title: "The Step That Can't Learn",
    hook: 'Single neuron with a Step activation function. Why does gradient descent freeze completely?',
    difficulty: 1,
    minutes: 3,
    preset: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: "Step Function Can't Learn",
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 100, y: 150, zoom: 1 },
      settings: { mode: 'student', snap: true, grid: true, minimap: false, precision: 2 },
      nodes: [
        { id: 'st_in1', type: 'input', position: { x: 100, y: 120 }, data: { label: 'x₁', inputValue: 0 } },
        { id: 'st_in2', type: 'input', position: { x: 100, y: 260 }, data: { label: 'x₂', inputValue: 0 } },
        { id: 'st_n', type: 'neuron', position: { x: 320, y: 190 }, data: { label: 'Step Neuron', bias: 0.0, activation: 'step' } },
        { id: 'st_out', type: 'output', position: { x: 540, y: 190 }, data: { label: 'Target', target: 0 } },
      ],
      edges: [
        { id: 'e_st_1', source: 'st_in1', target: 'st_n', data: { weight: 0.0 } },
        { id: 'e_st_2', source: 'st_in2', target: 'st_n', data: { weight: 0.0 } },
        { id: 'e_st_3', source: 'st_n', target: 'st_out', data: { weight: 1.0 } },
      ],
    },
    dataset: [
      { inputs: [0, 0], target: 0 },
      { inputs: [0, 1], target: 0 },
      { inputs: [1, 0], target: 0 },
      { inputs: [1, 1], target: 1 },
    ],
    predict: {
      question: 'With step activation and loss = 0.75, will 50 steps of gradient descent improve the loss?',
      options: ['Yes, it will smoothly learn the AND gate', 'No, the loss will remain stuck at 0.75 forever'],
      correct: 1,
      reveal: 'The step function is flat everywhere (slope = 0) with a jump discontinuity. Zero slope means zero gradient!',
    },
    run: {
      train: { n: 50, lr: 1.0 },
      diagnostics: ['lossCurve', 'gradBars'],
    },
    observe: [
      'Loss stays frozen at exactly 0.75.',
      'Gradient bars are all zero: dL/dw = 0 everywhere.',
      'Gradient descent has no slope to follow downhill.',
    ],
    diagnose: {
      question: 'Why can gradient descent not train step neurons?',
      options: [
        'The step function slope is 0 everywhere except the jump, so gradients are always zero',
        'AND gate is impossible to learn for single neurons',
        'Step neurons only work on negative numbers',
      ],
      correct: 0,
      explain: 'Gradient descent needs continuous derivatives. Because the step function derivative is zero almost everywhere, the update is always w - η·0 = w.',
    },
    fix: {
      instruction: 'Switch the neuron activation from Step to Sigmoid, then click Train ×50.',
      allowedChanges: ['activation'],
      gate: { type: 'lossBelowAfterTraining', value: 0.3, steps: 50 },
      solutionHint: 'Select the neuron, switch its activation dropdown to Sigmoid, and click Train ×50.',
    },
    takeaway: [
      'Frank Rosenblatt’s original Perceptron used step functions and a discrete learning rule, not calculus.',
      'Modern deep learning works because activations are smooth and differentiable.',
      'Replacing step with sigmoid was the critical breakthrough that enabled backpropagation.',
    ],
    tags: ['step-function', 'differentiability', 'sigmoid', 'perceptron'],
  },
];

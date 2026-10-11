import { ProjectDataset, Requirement } from '@/lib/engine/projectChecks';
import { SerializedCanvas } from '@/lib/persistence/schema';
import { ActivationFn } from '@/lib/engine/types';

export interface ProjectTier {
  id: 'bronze' | 'silver' | 'gold';
  title: string;
  requirementIds: string[];
}

export interface ProjectReflectionPrompt {
  id: string;
  prompt: string;
  minChars: number;
}

export interface ProjectDefinition {
  id: string;
  version: number;
  title: string;
  tagline: string;
  story: string;
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  recommendedAfter?: string;
  skills: string[];
  starterCanvas: SerializedCanvas;
  allowed?: {
    activations?: ActivationFn[];
    maxNeurons?: number;
    maxLayers?: number;
    tools?: string[];
  };
  dataset?: ProjectDataset;
  tiers?: ProjectTier[];
  requirements: Requirement[];
  reflections?: ProjectReflectionPrompt[];
  hints: string[];
  reward: { badgeId: string; title: string };
}

export const PROJECTS: ProjectDefinition[] = [
  {
    id: 'logic-gate-lab',
    version: 1,
    title: 'Logic Gate Lab',
    tagline: 'Teach single neurons to speak the fundamental language of computers.',
    story:
      'Logic gates are the alphabet of digital computers. A single artificial neuron can compute AND, OR, NAND, and NOR by adjusting just two weights and a threshold bias. Can you configure neurons to solve all four fundamental gates?',
    difficulty: 1,
    estimatedMinutes: 10,
    recommendedAfter: 'lesson-03-step-activation',
    skills: ['Binary Classification', 'Linear Separability', 'Threshold Logic', 'Perceptron'],
    reward: { badgeId: 'gate-keeper', title: 'Gate Keeper' },
    starterCanvas: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Logic Gate Lab Starter',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 80, y: 120, zoom: 1 },
      settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
      nodes: [
        {
          id: 'in_x1',
          type: 'input',
          position: { x: 100, y: 120 },
          data: { label: 'Input x₁', inputValue: 0 },
        },
        {
          id: 'in_x2',
          type: 'input',
          position: { x: 100, y: 240 },
          data: { label: 'Input x₂', inputValue: 0 },
        },
        {
          id: 'gate_neuron',
          type: 'neuron',
          position: { x: 340, y: 180 },
          data: { label: 'Gate Neuron', bias: -1.5, activation: 'step' },
        },
        {
          id: 'gate_out',
          type: 'output',
          position: { x: 540, y: 180 },
          data: { label: 'Output Gate', target: 0 },
        },
      ],
      edges: [
        {
          id: 'e_x1_gate',
          source: 'in_x1',
          target: 'gate_neuron',
          data: { weight: 1.0 },
        },
        {
          id: 'e_x2_gate',
          source: 'in_x2',
          target: 'gate_neuron',
          data: { weight: 1.0 },
        },
        {
          id: 'e_gate_out',
          source: 'gate_neuron',
          target: 'gate_out',
          data: { weight: 1.0 },
        },
      ],
    },
    requirements: [
      {
        id: 'req_truth_and_or',
        label: 'Configure neuron for AND and OR gates (w=(1,1), b=-1.5 for AND; b=-0.5 for OR)',
        type: 'truthTables',
        gates: ['AND', 'OR'],
      },
      {
        id: 'req_truth_nand_nor',
        label: 'Configure neuron for inverted gates NAND and NOR (w=(-1,-1), b=1.5 for NAND; b=0.5 for NOR)',
        type: 'truthTables',
        gates: ['NAND', 'NOR'],
      },
      {
        id: 'req_reflec_xor',
        label: 'Explain why one linear neuron cannot compute XOR',
        type: 'reflection',
        reflectionId: 'ref_xor_linear',
      },
    ],
    reflections: [
      {
        id: 'ref_xor_linear',
        prompt: 'Why can a single linear boundary never separate XOR outputs (0,0)→0, (0,1)→1, (1,0)→1, (1,1)→0?',
        minChars: 40,
      },
    ],
    hints: [
      'For AND: both inputs must be 1 to overcome bias. Try weights 1.0, 1.0 and bias -1.5.',
      'For OR: either input 1 should trigger the neuron. Try bias -0.5.',
      'For NOR: both inputs 0 must output 1, but any 1 drops output to 0. Try weights -1.0, -1.0 and bias +0.5.',
    ],
  },
  {
    id: 'smallest-xor',
    version: 1,
    title: 'Smallest XOR',
    tagline: 'Find the absolute most minimal network that solves non-linear XOR.',
    story:
      'The infamous XOR problem proved single-layer perceptrons had limits, launching the neural network winter in 1969. With hidden neurons or skip connections, non-linear boundaries appear. Can you build the smallest possible architecture to solve all 4 cases?',
    difficulty: 2,
    estimatedMinutes: 15,
    recommendedAfter: 'lesson-05-xor-problem',
    skills: ['Hidden Representations', 'Skip Connections', 'Architecture Pruning', 'Non-linear Separation'],
    reward: { badgeId: 'xor-minimalist', title: 'XOR Minimalist' },
    dataset: {
      name: 'XOR Truth Table',
      inputs: ['x₁', 'x₂'],
      samples: [
        { x: [0, 0], t: 0, label: '(0, 0) → 0' },
        { x: [0, 1], t: 1, label: '(0, 1) → 1' },
        { x: [1, 0], t: 1, label: '(1, 0) → 1' },
        { x: [1, 1], t: 0, label: '(1, 1) → 0' },
      ],
    },
    starterCanvas: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Smallest XOR Starter',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 80, y: 120, zoom: 1 },
      settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
      nodes: [
        {
          id: 'xor_in1',
          type: 'input',
          position: { x: 100, y: 120 },
          data: { label: 'x₁', inputValue: 0 },
        },
        {
          id: 'xor_in2',
          type: 'input',
          position: { x: 100, y: 260 },
          data: { label: 'x₂', inputValue: 0 },
        },
        {
          id: 'xor_out',
          type: 'output',
          position: { x: 540, y: 190 },
          data: { label: 'Output XOR', target: 0 },
        },
      ],
      edges: [],
    },
    tiers: [
      { id: 'bronze', title: 'Bronze: Solve XOR with ≤ 3 neurons', requirementIds: ['xor_acc', 'xor_arch_bronze'] },
      { id: 'silver', title: 'Silver: ≤ 3 neurons & ≤ 9 parameters', requirementIds: ['xor_acc', 'xor_arch_silver'] },
      { id: 'gold', title: 'Gold: ≤ 2 neurons with skip connection (7 params)', requirementIds: ['xor_acc', 'xor_arch_gold', 'xor_reflec'] },
    ],
    requirements: [
      {
        id: 'xor_acc',
        label: '100% Accuracy on XOR dataset (all 4 cases correct)',
        type: 'datasetAccuracy',
        threshold: 1.0,
      },
      {
        id: 'xor_arch_bronze',
        label: 'Network has at most 3 neurons',
        type: 'architecture',
        maxNeurons: 3,
      },
      {
        id: 'xor_arch_silver',
        label: 'Network has ≤ 3 neurons and ≤ 9 total parameters',
        type: 'architecture',
        maxNeurons: 3,
        maxParams: 9,
      },
      {
        id: 'xor_arch_gold',
        label: 'Ultra-compact network: ≤ 2 neurons (Gold skip-connection solution)',
        type: 'architecture',
        maxNeurons: 2,
        maxParams: 7,
      },
      {
        id: 'xor_reflec',
        label: 'Reflect on how skip connections reduce neuron count',
        type: 'reflection',
        reflectionId: 'ref_xor_skip',
      },
    ],
    reflections: [
      {
        id: 'ref_xor_skip',
        prompt: 'How does feeding x₁ and x₂ directly to the output alongside a hidden AND neuron allow 2 neurons to solve XOR?',
        minChars: 40,
      },
    ],
    hints: [
      'Classic 2-2-1 solution: 2 hidden neurons (one NAND, one OR) feeding an AND output neuron.',
      'Gold solution shortcut: Let a hidden neuron compute AND(x1,x2) with weights (1,1) and bias -1.5.',
      'Connect x1 (+1), x2 (+1), and the hidden neuron (-2) directly to the output with bias -0.5!',
    ],
  },
  {
    id: 'matatu-or-walk',
    version: 1,
    title: 'Matatu or Walk?',
    tagline: 'Help a Nairobi student decide whether to take public transit or walk to campus.',
    story:
      'Every morning, students weigh distance against Nairobi rain. Using real scenario observations, teach a single sigmoid neuron to make the optimal decision: walk (0) or take a matatu (1).',
    difficulty: 1,
    estimatedMinutes: 10,
    recommendedAfter: 'lesson-03-step-activation',
    skills: ['Input Normalization', 'Feature Weighting', 'Logistic Regression', 'Real-world Modeling'],
    reward: { badgeId: 'matatu-master', title: 'Matatu Master' },
    dataset: {
      name: 'Campus Commute',
      inputs: ['Rain (0/1)', 'Distance (km / 10)'],
      samples: [
        { x: [0, 0.1], t: 0, label: 'Dry, 1 km → Walk' },
        { x: [0, 0.3], t: 0, label: 'Dry, 3 km → Walk' },
        { x: [0, 0.4], t: 0, label: 'Dry, 4 km → Walk' },
        { x: [0, 0.6], t: 1, label: 'Dry, 6 km → Matatu' },
        { x: [0, 0.8], t: 1, label: 'Dry, 8 km → Matatu' },
        { x: [1, 0.1], t: 1, label: 'Rain, 1 km → Matatu' },
        { x: [1, 0.3], t: 1, label: 'Rain, 3 km → Matatu' },
      ],
    },
    starterCanvas: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Matatu Commute Starter',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 80, y: 120, zoom: 1 },
      settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
      nodes: [
        {
          id: 'commute_rain',
          type: 'input',
          position: { x: 100, y: 120 },
          data: { label: 'Rain (0/1)', inputValue: 0 },
        },
        {
          id: 'commute_dist',
          type: 'input',
          position: { x: 100, y: 260 },
          data: { label: 'Dist (km/10)', inputValue: 0.4 },
        },
        {
          id: 'commute_neuron',
          type: 'neuron',
          position: { x: 360, y: 190 },
          data: { label: 'Decision Neuron', bias: -0.5, activation: 'sigmoid' },
        },
        {
          id: 'commute_out',
          type: 'output',
          position: { x: 560, y: 190 },
          data: { label: 'Ride Matatu?', target: 0 },
        },
      ],
      edges: [
        {
          id: 'e_rain_dec',
          source: 'commute_rain',
          target: 'commute_neuron',
          data: { weight: 0.6 },
        },
        {
          id: 'e_dist_dec',
          source: 'commute_dist',
          target: 'commute_neuron',
          data: { weight: 1.0 },
        },
        {
          id: 'e_dec_out',
          source: 'commute_neuron',
          target: 'commute_out',
          data: { weight: 1.0 },
        },
      ],
    },
    tiers: [
      { id: 'bronze', title: 'Bronze: Correctly classify all 7 scenarios', requirementIds: ['commute_acc'] },
      { id: 'silver', title: 'Silver: Train to MSE < 0.05', requirementIds: ['commute_acc', 'commute_loss', 'commute_reflec'] },
    ],
    requirements: [
      {
        id: 'commute_acc',
        label: 'Classify all 7 commute scenarios correctly (Accuracy = 100%)',
        type: 'datasetAccuracy',
        threshold: 1.0,
      },
      {
        id: 'commute_loss',
        label: 'Train dataset loss below MSE 0.05',
        type: 'lossBelow',
        on: 'dataset',
        value: 0.05,
        selfReported: true,
      },
      {
        id: 'commute_reflec',
        label: 'Reflect on what the weights reveal about rain vs distance',
        type: 'reflection',
        reflectionId: 'ref_commute_weights',
      },
    ],
    reflections: [
      {
        id: 'ref_commute_weights',
        prompt: 'What did the rain weight reveal about how much rain matters relative to distance?',
        minChars: 40,
      },
    ],
    hints: [
      'Rain is binary (0 or 1). When rain=1, even a short 1 km distance should push the sum positive.',
      'Try weight on rain = 0.6 to 1.5, weight on distance = 1.0, and bias around -0.5.',
    ],
  },
  {
    id: 'hand-train-network-n',
    version: 1,
    title: 'Hand-Train Network N',
    tagline: 'Manually guide gradient descent to hit precision target 0.8.',
    story:
      'Train a single neuron to output exactly 0.8 using gradient descent. Inspect the loss curve, adjust the learning rate, and observe how step sizes affect convergence speed and stability.',
    difficulty: 2,
    estimatedMinutes: 10,
    recommendedAfter: 'lesson-08-gradient-descent',
    skills: ['Gradient Descent', 'Learning Rate Tuning', 'Loss Convergence'],
    reward: { badgeId: 'hand-trainer', title: 'Hand Trainer' },
    starterCanvas: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Network N Starter',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 80, y: 120, zoom: 1 },
      settings: { mode: 'student', snap: true, grid: true, minimap: false, precision: 3 },
      nodes: [
        {
          id: 'n_in',
          type: 'input',
          position: { x: 100, y: 180 },
          data: { label: 'Input x', inputValue: 1.0 },
        },
        {
          id: 'n_neuron',
          type: 'neuron',
          position: { x: 320, y: 180 },
          data: { label: 'Neuron N', bias: 0.1, activation: 'sigmoid' },
        },
        {
          id: 'n_out',
          type: 'output',
          position: { x: 520, y: 180 },
          data: { label: 'Target Output', target: 0.8 },
        },
      ],
      edges: [
        {
          id: 'e_in_n',
          source: 'n_in',
          target: 'n_neuron',
          data: { weight: 0.2 },
        },
        {
          id: 'e_n_out',
          source: 'n_neuron',
          target: 'n_out',
          data: { weight: 1.0 },
        },
      ],
    },
    requirements: [
      {
        id: 'n_loss_below',
        label: 'Reach MSE loss below 0.005 on the target',
        type: 'lossBelow',
        on: 'currentSample',
        value: 0.005,
      },
      {
        id: 'n_trained_within',
        label: 'Converge within 500 training steps',
        type: 'trainedWithin',
        maxSteps: 500,
        lossBelow: 0.005,
        selfReported: true,
      },
      {
        id: 'n_reflec',
        label: 'Reflect on learning rate overshoot',
        type: 'reflection',
        reflectionId: 'ref_lr_overshoot',
      },
    ],
    reflections: [
      {
        id: 'ref_lr_overshoot',
        prompt: 'What happens to the loss and weight updates when the learning rate is set too large?',
        minChars: 40,
      },
    ],
    hints: [
      'A moderate learning rate like 0.5 to 1.5 allows smooth convergence without oscillation.',
      'Check the Loss tab to monitor progress towards 0.005.',
    ],
  },
  {
    id: 'train-xor',
    version: 1,
    title: 'Train XOR from Scratch',
    tagline: 'Train a full 2-2-1 network to discover non-linear features autonomously.',
    story:
      'Gradient descent can discover the hidden representation required for XOR automatically. Initialize a 2-2-1 network with Glorot weights and train it until it achieves zero classification error.',
    difficulty: 3,
    estimatedMinutes: 20,
    recommendedAfter: 'lesson-09-backpropagation',
    skills: ['Backpropagation', 'Glorot Initialization', 'Feature Learning', 'Non-convex Optimization'],
    reward: { badgeId: 'xor-trainer', title: 'XOR Conqueror' },
    dataset: {
      name: 'XOR Dataset',
      inputs: ['x₁', 'x₂'],
      samples: [
        { x: [0, 0], t: 0, label: '0, 0 → 0' },
        { x: [0, 1], t: 1, label: '0, 1 → 1' },
        { x: [1, 0], t: 1, label: '1, 0 → 1' },
        { x: [1, 1], t: 0, label: '1, 1 → 0' },
      ],
    },
    starterCanvas: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Train XOR Starter',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 60, y: 100, zoom: 0.95 },
      settings: { mode: 'student', snap: true, grid: true, minimap: false, precision: 3 },
      nodes: [
        { id: 'tx_in1', type: 'input', position: { x: 80, y: 120 }, data: { label: 'x₁', inputValue: 0 } },
        { id: 'tx_in2', type: 'input', position: { x: 80, y: 260 }, data: { label: 'x₂', inputValue: 0 } },
        { id: 'tx_h1', type: 'neuron', position: { x: 280, y: 120 }, data: { label: 'Hidden 1', bias: 0.1, activation: 'sigmoid' } },
        { id: 'tx_h2', type: 'neuron', position: { x: 280, y: 260 }, data: { label: 'Hidden 2', bias: -0.1, activation: 'sigmoid' } },
        { id: 'tx_out', type: 'neuron', position: { x: 480, y: 190 }, data: { label: 'Output', bias: 0.0, activation: 'sigmoid' } },
        { id: 'tx_target', type: 'output', position: { x: 660, y: 190 }, data: { label: 'Loss Target', target: 0 } },
      ],
      edges: [
        { id: 'e_tx_in1_h1', source: 'tx_in1', target: 'tx_h1', data: { weight: 0.5 } },
        { id: 'e_tx_in1_h2', source: 'tx_in1', target: 'tx_h2', data: { weight: -0.4 } },
        { id: 'e_tx_in2_h1', source: 'tx_in2', target: 'tx_h1', data: { weight: -0.6 } },
        { id: 'e_tx_in2_h2', source: 'tx_in2', target: 'tx_h2', data: { weight: 0.7 } },
        { id: 'e_tx_h1_out', source: 'tx_h1', target: 'tx_out', data: { weight: 0.8 } },
        { id: 'e_tx_h2_out', source: 'tx_h2', target: 'tx_out', data: { weight: 0.9 } },
        { id: 'e_tx_out_tar', source: 'tx_out', target: 'tx_target', data: { weight: 1.0 } },
      ],
    },
    requirements: [
      {
        id: 'tx_acc',
        label: '100% Accuracy on XOR dataset',
        type: 'datasetAccuracy',
        threshold: 1.0,
      },
      {
        id: 'tx_loss_below',
        label: 'Dataset loss below MSE 0.01',
        type: 'lossBelow',
        on: 'dataset',
        value: 0.01,
      },
      {
        id: 'tx_no_dead',
        label: 'No dead neurons in network',
        type: 'noDeadNeurons',
      },
      {
        id: 'tx_trained_within',
        label: 'Converged within 3000 training steps',
        type: 'trainedWithin',
        maxSteps: 3000,
        lossBelow: 0.01,
        selfReported: true,
      },
      {
        id: 'tx_reflec',
        label: 'Analyze what internal features each hidden neuron learned',
        type: 'reflection',
        reflectionId: 'ref_hidden_roles',
      },
    ],
    reflections: [
      {
        id: 'ref_hidden_roles',
        prompt: 'Inspect the weights of the two hidden neurons. What specific sub-function did each neuron specialize into?',
        minChars: 60,
      },
    ],
    hints: [
      'If your training stalls on a plateau around loss 0.25, use the Re-init button to get a fresh seed.',
      'Learning rate 1.5 to 2.5 speeds up sigmoid XOR convergence.',
    ],
  },
  {
    id: 'activation-face-off',
    version: 1,
    title: 'Activation Face-Off',
    tagline: 'Benchmark Sigmoid vs Tanh vs ReLU on identical training challenges.',
    story:
      'Different activation functions propagate gradients differently. Put Sigmoid, Tanh, and ReLU head-to-head on the same dataset and compare their convergence speed and loss curves.',
    difficulty: 2,
    estimatedMinutes: 20,
    skills: ['Activation Functions', 'Empirical Benchmarking', 'Saturation', 'Convergence Rates'],
    reward: { badgeId: 'activation-scientist', title: 'Activation Scientist' },
    dataset: {
      name: 'Face-off Dataset',
      inputs: ['x₁', 'x₂'],
      samples: [
        { x: [0, 0], t: 0 },
        { x: [0, 1], t: 1 },
        { x: [1, 0], t: 1 },
        { x: [1, 1], t: 0 },
      ],
    },
    starterCanvas: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Face-Off Starter',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 80, y: 120, zoom: 1 },
      settings: { mode: 'student', snap: true, grid: true, minimap: false, precision: 3 },
      nodes: [
        { id: 'fo_in1', type: 'input', position: { x: 80, y: 120 }, data: { label: 'x₁', inputValue: 0 } },
        { id: 'fo_in2', type: 'input', position: { x: 80, y: 260 }, data: { label: 'x₂', inputValue: 0 } },
        { id: 'fo_h1', type: 'neuron', position: { x: 280, y: 100 }, data: { label: 'H1', bias: 0.1, activation: 'sigmoid' } },
        { id: 'fo_h2', type: 'neuron', position: { x: 280, y: 200 }, data: { label: 'H2', bias: -0.1, activation: 'sigmoid' } },
        { id: 'fo_h3', type: 'neuron', position: { x: 280, y: 300 }, data: { label: 'H3', bias: 0.0, activation: 'sigmoid' } },
        { id: 'fo_out', type: 'neuron', position: { x: 480, y: 200 }, data: { label: 'Output', bias: 0.0, activation: 'sigmoid' } },
        { id: 'fo_tar', type: 'output', position: { x: 640, y: 200 }, data: { label: 'Target', target: 0 } },
      ],
      edges: [
        { id: 'e_fo_1', source: 'fo_in1', target: 'fo_h1', data: { weight: 0.5 } },
        { id: 'e_fo_2', source: 'fo_in1', target: 'fo_h2', data: { weight: -0.5 } },
        { id: 'e_fo_3', source: 'fo_in1', target: 'fo_h3', data: { weight: 0.3 } },
        { id: 'e_fo_4', source: 'fo_in2', target: 'fo_h1', data: { weight: -0.4 } },
        { id: 'e_fo_5', source: 'fo_in2', target: 'fo_h2', data: { weight: 0.6 } },
        { id: 'e_fo_6', source: 'fo_in2', target: 'fo_h3', data: { weight: -0.2 } },
        { id: 'e_fo_7', source: 'fo_h1', target: 'fo_out', data: { weight: 0.7 } },
        { id: 'e_fo_8', source: 'fo_h2', target: 'fo_out', data: { weight: 0.8 } },
        { id: 'e_fo_9', source: 'fo_h3', target: 'fo_out', data: { weight: -0.6 } },
        { id: 'e_fo_10', source: 'fo_out', target: 'fo_tar', data: { weight: 1.0 } },
      ],
    },
    requirements: [
      {
        id: 'fo_runs',
        label: 'Record training runs for at least 3 distinct activations',
        type: 'runsRecorded',
        count: 3,
        distinctBy: 'activation',
        selfReported: true,
      },
      {
        id: 'fo_loss_below',
        label: 'Achieve loss below 0.05 on at least one run within 2000 steps',
        type: 'trainedWithin',
        maxSteps: 2000,
        lossBelow: 0.05,
        selfReported: true,
      },
      {
        id: 'fo_reflec',
        label: 'Synthesize your findings in a written reflection',
        type: 'reflection',
        reflectionId: 'ref_faceoff_compare',
      },
    ],
    reflections: [
      {
        id: 'ref_faceoff_compare',
        prompt: 'Which activation learned fastest in your experiment? Why did that activation have an advantage?',
        minChars: 60,
      },
    ],
    hints: [
      'Change the activation of the hidden neurons to Tanh or ReLU, re-run training, and record the run in the Runs tab.',
    ],
  },
  {
    id: 'code-it-from-scratch',
    version: 1,
    title: 'Code It From Scratch',
    tagline: 'Connect mathematical intuition directly with implementation.',
    story:
      'The best way to solidify neural network comprehension is to write the algorithms line by line. Review the core primitives: forward propagation, mean squared error, and gradient descent update.',
    difficulty: 3,
    estimatedMinutes: 25,
    recommendedAfter: 'lesson-09-backpropagation',
    skills: ['Code Implementation', 'Matrix Operations', 'Algorithmic Thinking'],
    reward: { badgeId: 'built-it-myself', title: 'Built It Myself' },
    starterCanvas: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Code From Scratch Starter',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 80, y: 120, zoom: 1 },
      settings: { mode: 'student', snap: true, grid: true, minimap: false, precision: 3 },
      nodes: [
        { id: 'c_in1', type: 'input', position: { x: 100, y: 140 }, data: { label: 'x₁', inputValue: 1 } },
        { id: 'c_in2', type: 'input', position: { x: 100, y: 260 }, data: { label: 'x₂', inputValue: 0.5 } },
        { id: 'c_neuron', type: 'neuron', position: { x: 340, y: 200 }, data: { label: 'Neuron', bias: 0.1, activation: 'sigmoid' } },
        { id: 'c_out', type: 'output', position: { x: 540, y: 200 }, data: { label: 'Output', target: 0.8 } },
      ],
      edges: [
        { id: 'e_c_1', source: 'c_in1', target: 'c_neuron', data: { weight: 0.6 } },
        { id: 'e_c_2', source: 'c_in2', target: 'c_neuron', data: { weight: -0.4 } },
        { id: 'e_c_3', source: 'c_neuron', target: 'c_out', data: { weight: 1.0 } },
      ],
    },
    requirements: [
      {
        id: 'c_reflec_hardest',
        label: 'Write an engineering reflection on the hardest aspect of coding backprop',
        type: 'reflection',
        reflectionId: 'ref_code_hardest',
      },
    ],
    reflections: [
      {
        id: 'ref_code_hardest',
        prompt: 'What was the most challenging mathematical or programmatic part of implementing the training step from scratch?',
        minChars: 40,
      },
    ],
    hints: [
      'Think about the chain rule: multiplying upstream error derivatives by the local activation derivative.',
    ],
  },
  {
    id: 'explain-it-to-a-friend',
    version: 1,
    title: 'Explain It To A Friend',
    tagline: 'Feynman technique: If you can explain it simply, you master it.',
    story:
      'Richard Feynman famously said that true mastery is the ability to teach a complex concept in plain, intuitive language. Synthesize the three pillars of neural networks: the neuron, layer hierarchies, and learning through error.',
    difficulty: 1,
    estimatedMinutes: 10,
    skills: ['Conceptual Synthesis', 'Teaching & Communication', 'Intuition Building'],
    reward: { badgeId: 'master-teacher', title: 'Master Teacher' },
    starterCanvas: {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: 'Explain To A Friend Starter',
      createdAt: '2026-10-11T10:00:00.000Z',
      updatedAt: '2026-10-11T10:00:00.000Z',
      viewport: { x: 80, y: 120, zoom: 1 },
      settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
      nodes: [
        { id: 'exp_in1', type: 'input', position: { x: 100, y: 140 }, data: { label: 'Input A', inputValue: 1 } },
        { id: 'exp_in2', type: 'input', position: { x: 100, y: 260 }, data: { label: 'Input B', inputValue: 1 } },
        { id: 'exp_n1', type: 'neuron', position: { x: 320, y: 200 }, data: { label: 'Thinking Neuron', bias: 0.2, activation: 'sigmoid' } },
        { id: 'exp_out', type: 'output', position: { x: 520, y: 200 }, data: { label: 'Decision', target: 1 } },
      ],
      edges: [
        { id: 'e_exp_1', source: 'exp_in1', target: 'exp_n1', data: { weight: 0.7 } },
        { id: 'e_exp_2', source: 'exp_in2', target: 'exp_n1', data: { weight: 0.8 } },
        { id: 'e_exp_3', source: 'exp_n1', target: 'exp_out', data: { weight: 1.0 } },
      ],
    },
    requirements: [
      {
        id: 'exp_ref1',
        label: 'Explain: What is an artificial neuron?',
        type: 'reflection',
        reflectionId: 'ref_what_neuron',
      },
      {
        id: 'exp_ref2',
        label: 'Explain: What are layers and why stack them?',
        type: 'reflection',
        reflectionId: 'ref_what_layers',
      },
      {
        id: 'exp_ref3',
        label: 'Explain: How does backpropagation actually learn?',
        type: 'reflection',
        reflectionId: 'ref_how_learn',
      },
    ],
    reflections: [
      {
        id: 'ref_what_neuron',
        prompt: 'In your own words: What does a single neuron do with its inputs, weights, and activation?',
        minChars: 60,
      },
      {
        id: 'ref_what_layers',
        prompt: 'Why do neural networks need multiple layers instead of just a big flat layer?',
        minChars: 60,
      },
      {
        id: 'ref_how_learn',
        prompt: 'How does an error at the output travel backward to improve early weights?',
        minChars: 60,
      },
    ],
    hints: [
      'Use relatable metaphors: a volume slider for weights, a decision threshold for bias, a chain of command for backpropagation.',
    ],
  },
];

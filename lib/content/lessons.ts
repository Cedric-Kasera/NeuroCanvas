import { SerializedCanvas } from '../persistence/schema';
import { QUIZ_BANK, QuizQuestion } from './quizBank';

export interface LessonStep {
  id: string; // e.g. '1.1'
  title: string;
  kind?: 'explain' | 'interact' | 'predict' | 'challenge' | 'quiz' | 'reveal' | 'recap';
  body: string;
  mathBody?: string;
  stepCanvas?: SerializedCanvas; // Progressive canvas state for this step
  highlight?: { nodeIds?: string[]; edgeIds?: string[]; layerIds?: string[] };
  focus?: { x: number; y: number; zoom: number };
  quiz?: QuizQuestion;
  hints?: string[];
  allowEdit?: { nodeIds?: string[]; edgeIds?: string[]; keys?: string[] };
}

export interface Lesson {
  id: string;
  order: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  badgeName: string;
  startCanvas: SerializedCanvas;
  steps: LessonStep[];
}

// -------------------------------------------------------------
// PROGRESSIVE CANVASES FOR LESSON 1
// -------------------------------------------------------------
const L1_CANVAS_INITIAL: SerializedCanvas = {
  app: 'neurocanvas',
  schemaVersion: 2,
  name: 'Lesson 1: The Single Neuron',
  createdAt: '2026-10-10T00:00:00.000Z',
  updatedAt: '2026-10-10T00:00:00.000Z',
  viewport: { x: 80, y: 80, zoom: 1 },
  settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
  nodes: [
    {
      id: 'n1',
      type: 'neuronNode',
      position: { x: 380, y: 160 },
      data: { label: 'Run-o-meter', bias: -1.0, activation: 'identity' },
    },
  ],
  edges: [],
  layers: [],
};

const L1_CANVAS_WITH_INPUTS: SerializedCanvas = {
  ...L1_CANVAS_INITIAL,
  nodes: [
    {
      id: 'x1',
      type: 'inputNode',
      position: { x: 100, y: 90 },
      data: { label: 'Free time (hrs)', value: 2.0 },
    },
    {
      id: 'x2',
      type: 'inputNode',
      position: { x: 100, y: 250 },
      data: { label: 'Weather (0–5)', value: 3.0 },
    },
    {
      id: 'n1',
      type: 'neuronNode',
      position: { x: 380, y: 160 },
      data: { label: 'Run-o-meter', bias: -1.0, activation: 'identity' },
    },
  ],
  edges: [],
};

const L1_CANVAS_WITH_WEIGHTS: SerializedCanvas = {
  ...L1_CANVAS_WITH_INPUTS,
  edges: [
    { id: 'e_x1_n1', source: 'x1', target: 'n1', data: { weight: 0.5 } },
    { id: 'e_x2_n1', source: 'x2', target: 'n1', data: { weight: 0.4 } },
  ],
};

const L1_CANVAS_COMPLETE: SerializedCanvas = {
  ...L1_CANVAS_WITH_WEIGHTS,
  nodes: [
    ...L1_CANVAS_WITH_INPUTS.nodes,
    {
      id: 'y',
      type: 'outputNode',
      position: { x: 660, y: 175 },
      data: { label: 'Enthusiasm', target: 2.2 },
    },
  ],
  edges: [
    ...L1_CANVAS_WITH_WEIGHTS.edges,
    { id: 'e_n1_y', source: 'n1', target: 'y', data: { weight: 1.0 } },
  ],
};

// -------------------------------------------------------------
// PROGRESSIVE CANVASES FOR LESSON 2
// -------------------------------------------------------------
const L2_CANVAS_INITIAL: SerializedCanvas = {
  app: 'neurocanvas',
  schemaVersion: 2,
  name: 'Lesson 2: Activation Functions',
  createdAt: '2026-10-10T00:00:00.000Z',
  updatedAt: '2026-10-10T00:00:00.000Z',
  viewport: { x: 60, y: 60, zoom: 0.95 },
  settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 3 },
  nodes: [
    { id: 'x1', type: 'inputNode', position: { x: 80, y: 150 }, data: { label: 'Input x', value: 1.2 } },
    { id: 'n1', type: 'neuronNode', position: { x: 340, y: 130 }, data: { label: 'Neuron', bias: 0.0, activation: 'identity' } },
  ],
  edges: [
    { id: 'e_x1_n1', source: 'x1', target: 'n1', data: { weight: 1.0 } },
  ],
  layers: [],
};

const L2_CANVAS_WITH_PLOT: SerializedCanvas = {
  ...L2_CANVAS_INITIAL,
  nodes: [
    ...L2_CANVAS_INITIAL.nodes,
    { id: 'act1', type: 'activationPlotCard', position: { x: 340, y: 380 }, data: { activeFn: 'sigmoid' } },
    { id: 'y', type: 'outputNode', position: { x: 620, y: 145 }, data: { label: 'Decision' } },
  ],
  edges: [
    ...L2_CANVAS_INITIAL.edges,
    { id: 'e_n1_y', source: 'n1', target: 'y', data: { weight: 1.0 } },
  ],
};

// -------------------------------------------------------------
// PROGRESSIVE CANVASES FOR LESSON 3 & 4 (Perceptron & XOR)
// -------------------------------------------------------------
const L3_CANVAS_INITIAL: SerializedCanvas = {
  app: 'neurocanvas',
  schemaVersion: 2,
  name: 'Lesson 3: The Perceptron',
  createdAt: '2026-10-10T00:00:00.000Z',
  updatedAt: '2026-10-10T00:00:00.000Z',
  viewport: { x: 60, y: 60, zoom: 0.9 },
  settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
  nodes: [
    { id: 'x1', type: 'inputNode', position: { x: 80, y: 100 }, data: { label: 'x₁', value: 1.0 } },
    { id: 'x2', type: 'inputNode', position: { x: 80, y: 240 }, data: { label: 'x₂', value: 1.0 } },
    { id: 'n1', type: 'neuronNode', position: { x: 320, y: 160 }, data: { label: 'Perceptron', bias: -1.5, activation: 'step' } },
    { id: 'db1', type: 'decisionBoundaryCard', position: { x: 580, y: 110 }, data: { preset: 'AND', w1: 1.0, w2: 1.0, bias: -1.5 } },
  ],
  edges: [
    { id: 'e_x1_n1', source: 'x1', target: 'n1', data: { weight: 1.0 } },
    { id: 'e_x2_n1', source: 'x2', target: 'n1', data: { weight: 1.0 } },
  ],
  layers: [],
};

const L4_CANVAS: SerializedCanvas = {
  ...L3_CANVAS_INITIAL,
  name: 'Lesson 4: The XOR Wall',
  nodes: [
    { id: 'x1', type: 'inputNode', position: { x: 80, y: 100 }, data: { label: 'x₁', value: 1.0 } },
    { id: 'x2', type: 'inputNode', position: { x: 80, y: 240 }, data: { label: 'x₂', value: 0.0 } },
    { id: 'n1', type: 'neuronNode', position: { x: 320, y: 160 }, data: { label: 'Perceptron', bias: -0.5, activation: 'step' } },
    { id: 'db1', type: 'decisionBoundaryCard', position: { x: 580, y: 110 }, data: { preset: 'XOR', w1: 1.0, w2: 1.0, bias: -0.5 } },
  ],
};

// -------------------------------------------------------------
// LESSON 5: XOR 2-2-1 WITH LAYER FRAMES
// -------------------------------------------------------------
const L5_CANVAS: SerializedCanvas = {
  app: 'neurocanvas',
  schemaVersion: 2,
  name: 'Lesson 5: Teams of Neurons (Layers)',
  createdAt: '2026-10-10T00:00:00.000Z',
  updatedAt: '2026-10-10T00:00:00.000Z',
  viewport: { x: 40, y: 40, zoom: 0.9 },
  settings: { mode: 'student', snap: true, grid: true, minimap: false, showLayerFrames: true, precision: 2 },
  layers: [
    { id: 'L_in', kind: 'input', label: 'Input layer', order: 0, nodeIds: ['x1', 'x2'] },
    { id: 'L_h1', kind: 'hidden', label: 'Hidden layer 1', order: 1, nodeIds: ['h1', 'h2'] },
    { id: 'L_out', kind: 'output', label: 'Output layer', order: 2, nodeIds: ['o1'] },
  ],
  nodes: [
    { id: 'x1', type: 'inputNode', position: { x: 60, y: 110 }, data: { label: 'x₁', value: 1.0 } },
    { id: 'x2', type: 'inputNode', position: { x: 60, y: 270 }, data: { label: 'x₂', value: 0.0 } },
    { id: 'h1', type: 'neuronNode', position: { x: 320, y: 80 }, data: { label: 'h₁ (OR)', bias: -0.5, activation: 'step' } },
    { id: 'h2', type: 'neuronNode', position: { x: 320, y: 280 }, data: { label: 'h₂ (NAND)', bias: 1.5, activation: 'step' } },
    { id: 'o1', type: 'neuronNode', position: { x: 600, y: 180 }, data: { label: 'o₁ (AND)', bias: -1.5, activation: 'step' } },
    { id: 'y', type: 'outputNode', position: { x: 840, y: 195 }, data: { label: 'x₁ XOR x₂', target: 1.0 } },
  ],
  edges: [
    { id: 'e_x1_h1', source: 'x1', target: 'h1', data: { weight: 1.0 } },
    { id: 'e_x2_h1', source: 'x2', target: 'h1', data: { weight: 1.0 } },
    { id: 'e_x1_h2', source: 'x1', target: 'h2', data: { weight: -1.0 } },
    { id: 'e_x2_h2', source: 'x2', target: 'h2', data: { weight: -1.0 } },
    { id: 'e_h1_o1', source: 'h1', target: 'o1', data: { weight: 1.0 } },
    { id: 'e_h2_o1', source: 'h2', target: 'o1', data: { weight: 1.0 } },
    { id: 'e_o1_y', source: 'o1', target: 'y', data: { weight: 1.0 } },
  ],
};

// -------------------------------------------------------------
// LESSON 6–9: NETWORK N (GOLDEN VALUES SPEC)
// -------------------------------------------------------------
const NETWORK_N_CANVAS: SerializedCanvas = {
  app: 'neurocanvas',
  schemaVersion: 2,
  name: 'Network N (Standard Reference)',
  createdAt: '2026-10-10T00:00:00.000Z',
  updatedAt: '2026-10-10T00:00:00.000Z',
  viewport: { x: 40, y: 40, zoom: 0.9 },
  settings: { mode: 'student', snap: true, grid: true, minimap: false, showLayerFrames: true, precision: 4 },
  layers: [
    { id: 'L_in', kind: 'input', label: 'Input layer', order: 0, nodeIds: ['x1', 'x2'] },
    { id: 'L_h1', kind: 'hidden', label: 'Hidden layer 1', order: 1, nodeIds: ['h1', 'h2'] },
    { id: 'L_out', kind: 'output', label: 'Output layer', order: 2, nodeIds: ['o1'] },
  ],
  nodes: [
    { id: 'x1', type: 'inputNode', position: { x: 60, y: 110 }, data: { label: 'x₁', value: 1.0 } },
    { id: 'x2', type: 'inputNode', position: { x: 60, y: 270 }, data: { label: 'x₂', value: 0.5 } },
    { id: 'h1', type: 'neuronNode', position: { x: 320, y: 80 }, data: { label: 'h₁', bias: 0.0, activation: 'sigmoid' } },
    { id: 'h2', type: 'neuronNode', position: { x: 320, y: 280 }, data: { label: 'h₂', bias: 0.1, activation: 'sigmoid' } },
    { id: 'o1', type: 'neuronNode', position: { x: 600, y: 180 }, data: { label: 'o₁', bias: 0.2, activation: 'sigmoid' } },
    { id: 'y', type: 'outputNode', position: { x: 840, y: 195 }, data: { label: 'Prediction ŷ', target: 0.8 } },
    { id: 'loss', type: 'lossNode', position: { x: 840, y: 360 }, data: { kind: 'mse' } },
  ],
  edges: [
    { id: 'e_x1_h1', source: 'x1', target: 'h1', data: { weight: 0.4 } },
    { id: 'e_x2_h1', source: 'x2', target: 'h1', data: { weight: 0.6 } },
    { id: 'e_x1_h2', source: 'x1', target: 'h2', data: { weight: -0.5 } },
    { id: 'e_x2_h2', source: 'x2', target: 'h2', data: { weight: 0.8 } },
    { id: 'e_h1_o1', source: 'h1', target: 'o1', data: { weight: 0.7 } },
    { id: 'e_h2_o1', source: 'h2', target: 'o1', data: { weight: -0.4 } },
    { id: 'e_o1_y', source: 'o1', target: 'y', data: { weight: 1.0 } },
    { id: 'e_y_loss', source: 'y', target: 'loss', data: { weight: 1.0 } },
  ],
};

// -------------------------------------------------------------
// COMPLETE 9 LESSON DEFINITIONS
// -------------------------------------------------------------
export const LESSONS: Lesson[] = [
  {
    id: 'neuron',
    order: 1,
    title: '1. A Single Neuron',
    summary: 'Meet the building block of every neural network: inputs, weights, bias, and sum.',
    estimatedMinutes: 8,
    badgeName: 'First Neuron',
    startCanvas: L1_CANVAS_INITIAL,
    steps: [
      {
        id: '1.1',
        title: 'Meet your first neuron',
        kind: 'explain',
        stepCanvas: L1_CANVAS_INITIAL,
        body: 'A neuron is a tiny calculator. It takes in numbers, decides how much each one matters, adds them up, and outputs a score.\n\nHere, a neuron called the **Run-o-meter** calculates how keen you are to go for a run today.',
        highlight: { nodeIds: ['n1'] },
      },
      {
        id: '1.2',
        title: 'Inputs: what the neuron sees',
        kind: 'interact',
        stepCanvas: L1_CANVAS_WITH_INPUTS,
        body: 'Here are the **inputs**.\nFree time is 2 hours and the weather score is 3 out of 5.\n\nDrag the free-time slider or click the circular input node to adjust it.',
        highlight: { nodeIds: ['x1', 'x2'] },
        quiz: QUIZ_BANK.find((q) => q.id === 'L1-04'),
      },
      {
        id: '1.3',
        title: 'Weights: how much each input matters',
        kind: 'explain',
        stepCanvas: L1_CANVAS_WITH_WEIGHTS,
        body: 'Each connection has a {{weight}}. Think of it as an importance knob. Free time counts 0.5 and weather counts 0.4.\n\nA negative weight would mean more of this input makes you less keen to run.',
        highlight: { edgeIds: ['e_x1_n1', 'e_x2_n1'] },
      },
      {
        id: '1.4',
        title: 'Multiply each input by its weight',
        kind: 'interact',
        stepCanvas: L1_CANVAS_WITH_WEIGHTS,
        body: 'The neuron first multiplies each input by its weight:\n2.0 × 0.5 = **1.0** and 3.0 × 0.4 = **1.2**.\n\nPress **Step Forward** in the bottom simulation bar to watch the numbers travel along the wires!',
        mathBody: 'z_{\\text{parts}} = w_1 \\cdot x_1 + w_2 \\cdot x_2',
        quiz: QUIZ_BANK.find((q) => q.id === 'L1-01'),
      },
      {
        id: '1.5',
        title: 'Add them up: the weighted sum',
        kind: 'explain',
        stepCanvas: L1_CANVAS_WITH_WEIGHTS,
        body: 'Next it adds the products:\n1.0 + 1.2 = **2.2**.\n\nThis is called the **weighted sum** (z).',
        mathBody: 'z = \\sum_{i=1}^{n} w_i \\cdot x_i = (0.5 \\times 2) + (0.4 \\times 3) = 2.2',
        highlight: { nodeIds: ['n1'] },
      },
      {
        id: '1.6',
        title: 'Bias: the neuron’s baseline mood',
        kind: 'explain',
        stepCanvas: L1_CANVAS_COMPLETE,
        body: 'Finally, the neuron adds a {{bias}}: a number that shifts the score regardless of inputs. Here bias is −1.0, so 2.2 − 1.0 = **1.2**.\n\nEnthusiasm score is 1.2!',
        mathBody: 'z = \\sum w_i x_i + b = 2.2 + (-1.0) = 1.2',
        highlight: { nodeIds: ['n1', 'y'] },
        quiz: QUIZ_BANK.find((q) => q.id === 'L1-02'),
      },
      {
        id: '1.7',
        title: 'Predict: increase free time',
        kind: 'predict',
        stepCanvas: L1_CANVAS_COMPLETE,
        body: 'If free time becomes **4 hours** (weather stays 3, weights stay 0.5 and 0.4, bias stays −1.0), what will the output enthusiasm be?\n\nCalculation: 4×0.5 = 2.0; plus 1.2 = 3.2; minus 1.0 = **2.2**.',
        mathBody: 'z = (4.0 \\times 0.5) + (3.0 \\times 0.4) - 1.0 = 2.2',
        quiz: QUIZ_BANK.find((q) => q.id === 'L1-03'),
      },
      {
        id: '1.8',
        title: 'Lesson 1 Recap',
        kind: 'recap',
        stepCanvas: L1_CANVAS_COMPLETE,
        body: 'Great work! You’ve learned:\n• Inputs feed data into neurons.\n• Weights scale the importance of signals.\n• Bias shifts the baseline result.\n• Output is the weighted sum z.',
      },
    ],
  },

  {
    id: 'activation',
    order: 2,
    title: '2. Activation Functions',
    summary: 'Turn raw arithmetic sums into smooth decisions using Sigmoid, ReLU, and Tanh.',
    estimatedMinutes: 8,
    badgeName: 'Squasher',
    startCanvas: L2_CANVAS_INITIAL,
    steps: [
      {
        id: '2.1',
        title: 'A score is not a decision',
        kind: 'explain',
        stepCanvas: L2_CANVAS_INITIAL,
        body: 'Last lesson gave an enthusiasm score of 1.2. But do you actually go for the run, yes or no? We need a mathematical function to squash scores into clear decisions.',
      },
      {
        id: '2.2',
        title: 'Sum first, then activate',
        kind: 'explain',
        stepCanvas: L2_CANVAS_WITH_PLOT,
        body: 'A real neuron computes in two stages:\n1. Stage 1: Weighted sum z = w·x + b\n2. Stage 2: **Activation function** a = f(z).\n\nThe curve below shows the activation function reshaping z into output a.',
        mathBody: 'a = f(z) = f(\\mathbf{w}^T \\mathbf{x} + b)',
      },
      {
        id: '2.3',
        title: 'Step: the hard on/off switch',
        kind: 'interact',
        stepCanvas: L2_CANVAS_WITH_PLOT,
        body: 'The **Binary Step** function outputs 0 if z is below zero, and 1 if z is zero or above.\n\nIt is simple, but its flat slope prevents gradient descent from learning.',
        quiz: QUIZ_BANK.find((q) => q.id === 'L2-05'),
      },
      {
        id: '2.4',
        title: 'Sigmoid: the smooth S-curve',
        kind: 'interact',
        stepCanvas: L2_CANVAS_WITH_PLOT,
        body: 'The **Sigmoid** function squashes any number into the smooth range between 0 and 1.\n• Large positive values approach 1.0\n• Large negative values approach 0.0\n• Right at z = 0, Sigmoid is exactly **0.5**.',
        mathBody: '\\sigma(z) = \\frac{1}{1 + e^{-z}}',
        quiz: QUIZ_BANK.find((q) => q.id === 'L2-04'),
      },
      {
        id: '2.5',
        title: 'ReLU: modern speed champion',
        kind: 'interact',
        stepCanvas: L2_CANVAS_WITH_PLOT,
        body: '**ReLU** (Rectified Linear Unit) outputs max(0, z). For positive numbers, it passes z unchanged; for negative numbers, it outputs 0. It is the most popular activation in deep learning.',
        mathBody: '\\text{ReLU}(z) = \\max(0, z)',
        quiz: QUIZ_BANK.find((q) => q.id === 'L2-02'),
      },
      {
        id: '2.6',
        title: 'Lesson 2 Recap',
        kind: 'recap',
        stepCanvas: L2_CANVAS_WITH_PLOT,
        body: 'You mastered activation functions!\n• Sigmoid squashes into (0, 1).\n• ReLU passes positives and silences negatives.\n• Non-linear curves give networks expressive power.',
      },
    ],
  },

  {
    id: 'perceptron',
    order: 3,
    title: '3. The Perceptron',
    summary: 'A step neuron draws a straight boundary line across 2D coordinate space.',
    estimatedMinutes: 10,
    badgeName: 'Line Drawer',
    startCanvas: L3_CANVAS_INITIAL,
    steps: [
      {
        id: '3.1',
        title: 'A neuron that classifies',
        kind: 'explain',
        stepCanvas: L3_CANVAS_INITIAL,
        body: 'A single neuron with a step activation divides a 2D map into two regions. It draws a **decision boundary line** where z = 0.',
        mathBody: 'w_1 x_1 + w_2 x_2 + b = 0',
      },
      {
        id: '3.2',
        title: 'Solving the AND gate',
        kind: 'interact',
        stepCanvas: L3_CANVAS_INITIAL,
        body: 'AND says 1 only when both x₁ and x₂ are 1. Look at the Decision Boundary card: with w₁=1, w₂=1, and b=−1.5, only (1,1) falls on the green side!',
        quiz: QUIZ_BANK.find((q) => q.id === 'L3-02'),
      },
      {
        id: '3.3',
        title: 'NAND and OR gates',
        kind: 'interact',
        stepCanvas: L3_CANVAS_INITIAL,
        body: 'Flipping the weight signs to w = (−1, −1) with bias 1.5 inverts the boundary, creating a NAND gate! Any linearly separable problem can be solved by one neuron.',
        quiz: QUIZ_BANK.find((q) => q.id === 'L3-03'),
      },
      {
        id: '3.4',
        title: 'Lesson 3 Recap',
        kind: 'recap',
        stepCanvas: L3_CANVAS_INITIAL,
        body: 'A perceptron draws a straight line. Weights tilt the line; bias shifts it. It easily solves AND, OR, and NAND.',
      },
    ],
  },

  {
    id: 'xor',
    order: 4,
    title: '4. The XOR Wall',
    summary: 'Discover why a single neuron can never solve the exclusive-OR problem.',
    estimatedMinutes: 8,
    badgeName: 'Wall Hitter',
    startCanvas: L4_CANVAS,
    steps: [
      {
        id: '4.1',
        title: 'The XOR puzzle',
        kind: 'explain',
        stepCanvas: L4_CANVAS,
        body: 'XOR outputs 1 if exactly one input is true: (1,0) and (0,1) are 1; (0,0) and (1,1) are 0.\n\nNotice the diagonal dots on the Decision Boundary card!',
        quiz: QUIZ_BANK.find((q) => q.id === 'L4-01'),
      },
      {
        id: '4.2',
        title: 'Try to separate the diagonal',
        kind: 'challenge',
        stepCanvas: L4_CANVAS,
        body: 'Try adjusting the weights and bias. Can you find any single straight line that leaves both green dots on one side and both red dots on the other?',
        hints: ['Try diagonal lines.', 'No single line can separate opposite corners of a square.'],
        quiz: QUIZ_BANK.find((q) => q.id === 'L4-02'),
      },
      {
        id: '4.3',
        title: 'Why one line fails',
        kind: 'reveal',
        stepCanvas: L4_CANVAS,
        body: 'It is mathematically impossible! XOR is **not linearly separable**.\n\nTo solve XOR, we need a team of neurons: **hidden layers**.',
        quiz: QUIZ_BANK.find((q) => q.id === 'L4-03'),
      },
      {
        id: '4.4',
        title: 'Lesson 4 Recap',
        kind: 'recap',
        stepCanvas: L4_CANVAS,
        body: 'You hit the historic XOR wall that stopped 1960s AI research. Next, we tear down the wall with layers!',
      },
    ],
  },

  {
    id: 'layers',
    order: 5,
    title: '5. Teams of Neurons: Layers',
    summary: 'Organize neurons into input, hidden, and output layers to solve XOR.',
    estimatedMinutes: 12,
    badgeName: 'Team Builder',
    startCanvas: L5_CANVAS,
    steps: [
      {
        id: '5.1',
        title: 'Meet layered architectures',
        kind: 'explain',
        stepCanvas: L5_CANVAS,
        body: 'Look at the canvas: neurons are now enclosed in **layer frames**!\n• Input layer holds the data.\n• Hidden layer 1 bends the space.\n• Output layer produces the final decision.',
        highlight: { layerIds: ['L_in', 'L_h1', 'L_out'] },
      },
      {
        id: '5.2',
        title: 'The 2-2-1 network',
        kind: 'explain',
        stepCanvas: L5_CANVAS,
        body: 'This network has 2 inputs, 2 hidden neurons, and 1 output: we call it a **2-2-1 architecture**.\n\nHidden neuron h₁ computes OR, and h₂ computes NAND!',
        quiz: QUIZ_BANK.find((q) => q.id === 'L5-01'),
      },
      {
        id: '5.3',
        title: 'Combining OR and NAND',
        kind: 'interact',
        stepCanvas: L5_CANVAS,
        body: 'The output neuron acts as an AND gate combining h₁ and h₂:\nOR AND NAND = XOR!\n\nStep the simulation forward to verify that XOR outputs 1 for (1,0) and (0,1).',
        quiz: QUIZ_BANK.find((q) => q.id === 'L5-02'),
      },
      {
        id: '5.4',
        title: 'Lesson 5 Recap',
        kind: 'recap',
        stepCanvas: L5_CANVAS,
        body: 'Hidden layers transform the input space so non-linear problems become separable. Layer frames and badges make architectures readable at a glance.',
      },
    ],
  },

  {
    id: 'forward-pass',
    order: 6,
    title: '6. The Forward Pass',
    summary: 'Propagate real numbers layer by layer through Network N.',
    estimatedMinutes: 10,
    badgeName: 'Forward Thinker',
    startCanvas: NETWORK_N_CANVAS,
    steps: [
      {
        id: '6.1',
        title: 'Meet Network N',
        kind: 'explain',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'This is **Network N**, a 2-2-1 sigmoid network used to demonstrate training. Total 9 parameters.\n\nInput x₁ = 1.0, x₂ = 0.5.',
        highlight: { nodeIds: ['x1', 'x2'] },
        quiz: QUIZ_BANK.find((q) => q.id === 'L6-01'),
      },
      {
        id: '6.2',
        title: 'Hidden layer calculations',
        kind: 'interact',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'Press Step in the bottom bar:\n• h₁ computes (1.0×0.4) + (0.5×0.6) + 0 = 0.70. Sigmoid(0.7) = **0.6682**.\n• h₂ computes (1.0×-0.5) + (0.5×0.8) + 0.1 = 0.0. Sigmoid(0) = **0.5000**.',
        mathBody: 'z_{h1} = 0.4(1.0) + 0.6(0.5) = 0.70 \\implies a_{h1} = \\sigma(0.70) = 0.6682',
      },
      {
        id: '6.3',
        title: 'Output prediction',
        kind: 'interact',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'Next, the output neuron o₁ receives 0.6682 and 0.5000:\nz = 0.7(0.6682) - 0.4(0.5) + 0.2 = 0.4677.\nSigmoid(0.4677) = **0.6149**.',
        mathBody: 'y = \\sigma(0.4677) = 0.6149',
        quiz: QUIZ_BANK.find((q) => q.id === 'L6-02'),
      },
      {
        id: '6.4',
        title: 'Lesson 6 Recap',
        kind: 'recap',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'The forward pass computes layer by layer from left to right. Output prediction is 0.6149.',
      },
    ],
  },

  {
    id: 'loss',
    order: 7,
    title: '7. Measuring Error (Loss)',
    summary: 'Calculate Mean Squared Error (MSE) comparing predictions to the target.',
    estimatedMinutes: 8,
    badgeName: 'Error Spotter',
    startCanvas: NETWORK_N_CANVAS,
    steps: [
      {
        id: '7.1',
        title: 'Prediction vs Target',
        kind: 'explain',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'The network guessed **ŷ = 0.6149**, but the desired target is **t = 0.80**.\n\nError = ŷ - t = 0.6149 - 0.8 = **-0.1851**.',
      },
      {
        id: '7.2',
        title: 'Mean Squared Error',
        kind: 'explain',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'Squaring the error gives:\nLoss = (-0.1851)² = **0.0343**.\n\nSquaring guarantees positive values and heavily penalizes large mistakes.',
        mathBody: 'L = (y - t)^2 = (0.6149 - 0.8)^2 = 0.0343',
        quiz: QUIZ_BANK.find((q) => q.id === 'L7-01'),
      },
      {
        id: '7.3',
        title: 'Lesson 7 Recap',
        kind: 'recap',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'Loss gives us a single number measuring how wrong the network is. Training aims to drive loss down to zero.',
      },
    ],
  },

  {
    id: 'gradient-descent',
    order: 8,
    title: '8. Gradient Descent',
    summary: 'Follow the slope downhill to reduce loss using the learning rate.',
    estimatedMinutes: 10,
    badgeName: 'Downhill Rolling',
    startCanvas: NETWORK_N_CANVAS,
    steps: [
      {
        id: '8.1',
        title: 'The slope points uphill',
        kind: 'explain',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'The **gradient** is the slope of the loss. By stepping in the opposite direction (-gradient), we roll downhill into the loss valley.',
        quiz: QUIZ_BANK.find((q) => q.id === 'L8-01'),
      },
      {
        id: '8.2',
        title: 'The update rule',
        kind: 'explain',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'New weight = old weight - (learning rate × slope).\n\nIf learning rate η is too small, learning is slow; if too large, it overshoots and diverges.',
        mathBody: 'w \\leftarrow w - \\eta \\cdot \\frac{\\partial L}{\\partial w}',
        quiz: QUIZ_BANK.find((q) => q.id === 'L8-02'),
      },
      {
        id: '8.3',
        title: 'Lesson 8 Recap',
        kind: 'recap',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'Gradient descent provides the formula for updating weights. Now, how do we find slopes for hidden weights? Backpropagation!',
      },
    ],
  },

  {
    id: 'backprop',
    order: 9,
    title: '9. Backpropagation in Action',
    summary: 'Propagate blame backward through the chain rule and train Network N live.',
    estimatedMinutes: 14,
    badgeName: 'Backprop Boss',
    startCanvas: NETWORK_N_CANVAS,
    steps: [
      {
        id: '9.1',
        title: 'Blame flows backward',
        kind: 'explain',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'Backpropagation starts at the output loss and works backward layer by layer using the calculus chain rule.',
        quiz: QUIZ_BANK.find((q) => q.id === 'L9-01'),
      },
      {
        id: '9.2',
        title: 'Output layer gradients',
        kind: 'interact',
        stepCanvas: NETWORK_N_CANVAS,
        body: '• Output delta: dL/da = 2(0.6149 - 0.8) = **-0.3703**\n• Sigmoid slope: σ\' = 0.2368\n• Local gradient: dz = -0.3703 × 0.2368 = **-0.0877**\n• Weight slope: dL/dw = -0.0877 × 0.6682 = **-0.0586**.',
        mathBody: '\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial y} \\cdot \\sigma\'(z) \\cdot a_{\\text{in}}',
        quiz: QUIZ_BANK.find((q) => q.id === 'L9-02'),
      },
      {
        id: '9.3',
        title: 'Train Network N live!',
        kind: 'interact',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'Click **Train ×20** in the simulation bar below.\n\nWatch the loss drop from 0.0343 down toward 0.001 as weights adjust automatically!',
        quiz: QUIZ_BANK.find((q) => q.id === 'L9-03'),
      },
      {
        id: '9.4',
        title: 'Graduation: You understand neural networks!',
        kind: 'recap',
        stepCanvas: NETWORK_N_CANVAS,
        body: 'Congratulations! You have learned neural networks from a single neuron up to multi-layer backpropagation and gradient descent.',
      },
    ],
  },
];

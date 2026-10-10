import { ActivationFn } from './types';

export interface ActivationInfo {
  name: string;
  formula: string;
  derivativeFormula: string;
  description: string;
  range: string;
  trainable: boolean;
  fn: (z: number, alpha?: number) => number;
  derivative: (z: number, a?: number, alpha?: number) => number;
}

// Numerically stable sigmoid
function stableSigmoid(z: number): number {
  if (z >= 0) {
    const clamped = Math.min(60, z);
    return 1 / (1 + Math.exp(-clamped));
  } else {
    const clamped = Math.max(-60, z);
    const expZ = Math.exp(clamped);
    return expZ / (1 + expZ);
  }
}

// Error function approximation (Abramowitz-Stegun formula 7.1.26, max error ~ 1.5e-7)
function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const absX = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absX);
  const y = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
  return sign * y;
}

// Standard normal CDF & PDF
function normalCDF(x: number): number {
  return 0.5 * (1.0 + erf(x / Math.SQRT2));
}

function normalPDF(x: number): number {
  return (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export const ACTIVATIONS: Record<ActivationFn, ActivationInfo> = {
  identity: {
    name: 'Linear (Identity)',
    formula: 'f(z) = z',
    derivativeFormula: "f'(z) = 1",
    description: 'Passes the input unchanged. Used for regression outputs.',
    range: '(-∞, ∞)',
    trainable: true,
    fn: (z) => z,
    derivative: () => 1,
  },
  step: {
    name: 'Binary Step',
    formula: 'f(z) = z ≥ 0 ? 1 : 0',
    derivativeFormula: "f'(z) = 0",
    description: 'Classic Frank Rosenblatt threshold. Slope is 0 everywhere, so gradient descent cannot learn.',
    range: '{0, 1}',
    trainable: false,
    fn: (z) => (z >= 0 ? 1 : 0),
    derivative: () => 0,
  },
  sigmoid: {
    name: 'Sigmoid',
    formula: 'f(z) = 1 / (1 + e^-z)',
    derivativeFormula: "f'(z) = f(z) · (1 - f(z))",
    description: 'Squashes values smoothly into (0, 1). Ideal for binary probabilities.',
    range: '(0, 1)',
    trainable: true,
    fn: (z) => stableSigmoid(z),
    derivative: (z, a) => {
      const act = a !== undefined ? a : stableSigmoid(z);
      return act * (1 - act);
    },
  },
  tanh: {
    name: 'Hyperbolic Tangent (Tanh)',
    formula: 'f(z) = tanh(z)',
    derivativeFormula: "f'(z) = 1 - tanh²(z)",
    description: 'Zero-centered S-curve outputting in (-1, 1).',
    range: '(-1, 1)',
    trainable: true,
    fn: (z) => {
      const clamped = Math.max(-20, Math.min(20, z));
      return Math.tanh(clamped);
    },
    derivative: (z, a) => {
      const act = a !== undefined ? a : Math.tanh(Math.max(-20, Math.min(20, z)));
      return 1 - act * act;
    },
  },
  relu: {
    name: 'ReLU',
    formula: 'f(z) = max(0, z)',
    derivativeFormula: "f'(z) = z > 0 ? 1 : 0",
    description: 'Default in modern hidden layers. Fast computation with no saturation on positives.',
    range: '[0, ∞)',
    trainable: true,
    fn: (z) => Math.max(0, z),
    derivative: (z) => (z > 0 ? 1 : 0),
  },
  leakyRelu: {
    name: 'Leaky ReLU',
    formula: 'f(z) = z > 0 ? z : α·z',
    derivativeFormula: "f'(z) = z > 0 ? 1 : α",
    description: 'Prevents dying neurons by keeping a small positive slope for negative inputs.',
    range: '(-∞, ∞)',
    trainable: true,
    fn: (z, alpha = 0.01) => (z > 0 ? z : alpha * z),
    derivative: (z, _, alpha = 0.01) => (z > 0 ? 1 : alpha),
  },
  elu: {
    name: 'ELU (Exponential Linear)',
    formula: 'f(z) = z > 0 ? z : α·(e^z - 1)',
    derivativeFormula: "f'(z) = z > 0 ? 1 : α·e^z",
    description: 'Smooth curve for negative inputs that brings mean activations closer to zero.',
    range: '(-α, ∞)',
    trainable: true,
    fn: (z, alpha = 1.0) => (z > 0 ? z : alpha * (Math.exp(Math.max(-60, z)) - 1)),
    derivative: (z, _, alpha = 1.0) => (z > 0 ? 1 : alpha * Math.exp(Math.max(-60, z))),
  },
  softplus: {
    name: 'Softplus',
    formula: 'f(z) = ln(1 + e^z)',
    derivativeFormula: "f'(z) = σ(z)",
    description: 'Smooth mathematical approximation of the rectifier (ReLU).',
    range: '(0, ∞)',
    trainable: true,
    fn: (z) => Math.max(z, 0) + Math.log(1 + Math.exp(-Math.abs(z))),
    derivative: (z) => stableSigmoid(z),
  },
  swish: {
    name: 'Swish / SiLU',
    formula: 'f(z) = z · σ(z)',
    derivativeFormula: "f'(z) = σ(z)·(1 + z·(1 - σ(z)))",
    description: 'Self-gated smooth activation used in modern state-of-the-art vision models.',
    range: '≈[-0.28, ∞)',
    trainable: true,
    fn: (z) => z * stableSigmoid(z),
    derivative: (z) => {
      const sig = stableSigmoid(z);
      return sig * (1 + z * (1 - sig));
    },
  },
  gelu: {
    name: 'GELU (Gaussian Error Linear)',
    formula: 'f(z) = z · Φ(z)',
    derivativeFormula: "f'(z) = Φ(z) + z · φ(z)",
    description: 'Used in modern Transformer models (BERT, GPT). Probabilistic gating of activations.',
    range: '≈[-0.17, ∞)',
    trainable: true,
    fn: (z) => z * normalCDF(z),
    derivative: (z) => normalCDF(z) + z * normalPDF(z),
  },
};

export function activate(fn: ActivationFn, z: number, alpha?: number): number {
  return (ACTIVATIONS[fn] || ACTIVATIONS.sigmoid).fn(z, alpha);
}

export function activateDerivative(fn: ActivationFn, z: number, a?: number, alpha?: number): number {
  return (ACTIVATIONS[fn] || ACTIVATIONS.sigmoid).derivative(z, a, alpha);
}

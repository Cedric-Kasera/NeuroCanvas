import { NetworkGraph } from './types';
import { forward } from './forward';
import { backward } from './backward';
import { topologicalOrder } from './graph';
import { activate, activateDerivative } from './activations';
import { trainStep } from './train';

export function runEngineSelfTests(): { passed: boolean; results: { name: string; success: boolean; detail?: string }[] } {
  const results: { name: string; success: boolean; detail?: string }[] = [];

  // Test 1: Activation functions & derivatives
  try {
    const sigAt0 = activate('sigmoid', 0);
    const dSigAt0 = activateDerivative('sigmoid', 0, 0.5);
    const pass = Math.abs(sigAt0 - 0.5) < 1e-6 && Math.abs(dSigAt0 - 0.25) < 1e-6;
    results.push({ name: 'Activation functions math', success: pass });
  } catch (e: any) {
    results.push({ name: 'Activation functions math', success: false, detail: e.message });
  }

  // Test 2: Single neuron hand calculation
  // Input: 1.0, 2.0. Weights: 0.5, -0.5. Bias: 0.2.
  // z = 1.0*0.5 + 2.0*(-0.5) + 0.2 = 0.5 - 1.0 + 0.2 = -0.3.
  // Sigmoid(-0.3) = 1 / (1 + e^0.3) = 1 / (1 + 1.3498588) = 0.425557
  try {
    const singleGraph: NetworkGraph = {
      nodes: [
        { id: 'in1', kind: 'input', inputValue: 1.0 },
        { id: 'in2', kind: 'input', inputValue: 2.0 },
        { id: 'n1', kind: 'neuron', bias: 0.2, activation: 'sigmoid' },
        { id: 'out1', kind: 'output', target: 1.0 },
      ],
      edges: [
        { id: 'e1', from: 'in1', to: 'n1', weight: 0.5 },
        { id: 'e2', from: 'in2', to: 'n1', weight: -0.5 },
        { id: 'e3', from: 'n1', to: 'out1', weight: 1.0 },
      ],
    };

    const state = forward(singleGraph);
    const z = state.nodeStates['n1']?.z ?? 0;
    const a = state.nodeStates['n1']?.a ?? 0;

    const pass = Math.abs(z - (-0.3)) < 1e-5 && Math.abs(a - 0.425557) < 1e-4;
    results.push({ name: 'Single neuron forward computation', success: pass, detail: `z=${z.toFixed(4)}, a=${a.toFixed(4)}` });
  } catch (e: any) {
    results.push({ name: 'Single neuron forward computation', success: false, detail: e.message });
  }

  // Test 3: Numerical gradient finite-difference verification
  try {
    const net: NetworkGraph = {
      nodes: [
        { id: 'i1', kind: 'input', inputValue: 0.8 },
        { id: 'n1', kind: 'neuron', bias: 0.1, activation: 'sigmoid' },
        { id: 'out', kind: 'output', target: 0.9 },
      ],
      edges: [
        { id: 'e1', from: 'i1', to: 'n1', weight: 0.6 },
        { id: 'e2', from: 'n1', to: 'out', weight: 1.0 },
      ],
    };

    const fwd = forward(net);
    const bwd = backward(net, fwd);
    const analyticalGrad = bwd.edgeGrads['e1'];

    // Finite differences: (L(w + eps) - L(w - eps)) / (2*eps)
    const eps = 1e-5;
    const netPlus: NetworkGraph = {
      ...net,
      edges: net.edges.map((e) => (e.id === 'e1' ? { ...e, weight: e.weight + eps } : e)),
    };
    const netMinus: NetworkGraph = {
      ...net,
      edges: net.edges.map((e) => (e.id === 'e1' ? { ...e, weight: e.weight - eps } : e)),
    };

    const lPlus = forward(netPlus).loss ?? 0;
    const lMinus = forward(netMinus).loss ?? 0;
    const numericalGrad = (lPlus - lMinus) / (2 * eps);

    const gradDiff = Math.abs(analyticalGrad - numericalGrad);
    const pass = gradDiff < 1e-4;
    results.push({
      name: 'Numerical finite-difference gradient check',
      success: pass,
      detail: `Analytical=${analyticalGrad?.toFixed(5)}, Numerical=${numericalGrad.toFixed(5)}, Diff=${gradDiff.toExponential(2)}`,
    });
  } catch (e: any) {
    results.push({ name: 'Numerical finite-difference gradient check', success: false, detail: e.message });
  }

  // Test 4: Cycle detection
  try {
    const cycleNet: NetworkGraph = {
      nodes: [
        { id: 'a', kind: 'input' },
        { id: 'b', kind: 'neuron' },
      ],
      edges: [
        { id: 'e1', from: 'a', to: 'b', weight: 1 },
        { id: 'e2', from: 'b', to: 'a', weight: 1 },
      ],
    };

    let caught = false;
    try {
      topologicalOrder(cycleNet);
    } catch {
      caught = true;
    }
    results.push({ name: 'Cycle detection throws error', success: caught });
  } catch (e: any) {
    results.push({ name: 'Cycle detection throws error', success: false, detail: e.message });
  }

  // Test 5: Training reduces loss
  try {
    const trainNet: NetworkGraph = {
      nodes: [
        { id: 'i1', kind: 'input', inputValue: 1.0 },
        { id: 'n1', kind: 'neuron', bias: 0.0, activation: 'sigmoid' },
        { id: 'out', kind: 'output', target: 0.9 },
      ],
      edges: [
        { id: 'e1', from: 'i1', to: 'n1', weight: 0.1 },
        { id: 'e2', from: 'n1', to: 'out', weight: 1.0 },
      ],
    };

    const initialLoss = forward(trainNet).loss ?? 0;
    const step1 = trainStep(trainNet, [{ inputs: [1.0], target: 0.9 }], 0.5);
    const newLoss = forward(step1.graph).loss ?? 0;

    const pass = newLoss < initialLoss;
    results.push({
      name: 'Gradient descent reduces loss',
      success: pass,
      detail: `Initial loss=${initialLoss.toFixed(4)}, Post-step loss=${newLoss.toFixed(4)}`,
    });
  } catch (e: any) {
    results.push({ name: 'Gradient descent reduces loss', success: false, detail: e.message });
  }

  const allPassed = results.every((r) => r.success);
  return { passed: allPassed, results };
}

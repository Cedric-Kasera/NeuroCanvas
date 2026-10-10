export interface GlossaryEntry {
  term: string;
  shortDef: string;
  fullDef: string;
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  weight: {
    term: 'Weight (w)',
    shortDef: 'The connection strength between two neurons.',
    fullDef: 'A multiplier applied to a signal travelling between neurons. Positive weights amplify signals (excitatory), while negative weights suppress them (inhibitory). Weights are what the network adjusts during training.',
  },
  bias: {
    term: 'Bias (b)',
    shortDef: 'An offset added to the weighted sum before activation.',
    fullDef: 'Allows the neuron to shift its activation threshold left or right, independent of the input signals. Similar to the y-intercept (b) in the line equation y = mx + b.',
  },
  activation: {
    term: 'Activation function (f)',
    shortDef: 'A non-linear mathematical curve that decides how much a neuron fires.',
    fullDef: 'Without non-linear activations (like Sigmoid or ReLU), stacking multiple layers would collapse mathematically into a single linear equation, making complex patterns like XOR impossible to learn.',
  },
  loss: {
    term: 'Loss / Error (L)',
    shortDef: 'A score showing how wrong the network’s prediction is compared to the true target.',
    fullDef: 'A mathematical objective function (e.g. Mean Squared Error). The goal of training is to adjust weights and biases until this loss number reaches near zero.',
  },
  gradient: {
    term: 'Gradient (∇ / dL/dw)',
    shortDef: 'The slope pointing in the direction of steepest increase in loss.',
    fullDef: 'The partial derivative of the loss with respect to a parameter. By moving in the opposite direction (-gradient), we descend down the error bowl towards optimal weights.',
  },
  'learning rate': {
    term: 'Learning Rate (η)',
    shortDef: 'The step size taken down the gradient slope during each update.',
    fullDef: 'If the learning rate is too small, learning takes forever. If it is too large, the network overshoots the minimum and may diverge (explode to infinity).',
  },
  epoch: {
    term: 'Epoch',
    shortDef: 'One complete pass through all training examples in the dataset.',
    fullDef: 'Networks usually train over multiple epochs, repeatedly calculating gradients and refining weights.',
  },
  backpropagation: {
    term: 'Backpropagation',
    shortDef: 'The algorithm that calculates how much each weight contributed to the final error.',
    fullDef: 'Using the calculus chain rule, errors are propagated backwards from the output layer to the hidden layers, calculating partial derivatives for every single parameter.',
  },
  perceptron: {
    term: 'Perceptron',
    shortDef: 'The earliest mathematical model of a biological neuron (invented in 1958).',
    fullDef: 'A single neuron with a step activation function. It can classify linearly separable datasets (like AND and OR), but cannot solve XOR on its own without hidden layers.',
  },
  'mean squared error': {
    term: 'Mean Squared Error (MSE)',
    shortDef: 'L = (1/N) Σ (prediction - target)²',
    fullDef: 'Measures the average squared difference between predictions and actual targets. Squaring penalizes large mistakes heavily and ensures errors are always positive.',
  },
  'hidden layer': {
    term: 'Hidden Layer',
    shortDef: 'Intermediate layers between the inputs and outputs.',
    fullDef: 'Hidden neurons transform the input space non-linearly, enabling the network to bend decision boundaries and represent complex functions.',
  },
};

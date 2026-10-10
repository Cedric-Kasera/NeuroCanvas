export type ActivationFn =
  | 'identity'
  | 'step'
  | 'sigmoid'
  | 'tanh'
  | 'relu'
  | 'leakyRelu'
  | 'elu'
  | 'softplus'
  | 'swish'
  | 'gelu';

export type LayerKind = 'input' | 'hidden' | 'output';

export interface Layer {
  id: string; // 'L_in' | 'L_h1' | 'L_out'
  kind: LayerKind;
  label?: string;
  order: number; // 0-based left->right
  nodeIds: string[];
  color?: string;
}

export type InitMethod =
  | 'glorotUniform'
  | 'glorotNormal'
  | 'heNormal'
  | 'heUniform'
  | 'lecunNormal'
  | 'smallNormal'
  | 'uniform1'
  | 'zeros';

export interface NetNode {
  id: string;
  kind: 'input' | 'neuron' | 'activation' | 'output' | 'loss';
  label?: string;
  bias?: number;
  activation?: ActivationFn;
  alpha?: number; // for leakyRelu, elu
  inputValue?: number; // for single input or primary input value
  inputValues?: number[]; // for multi-input nodes
  target?: number; // for output / loss target
}

export interface NetEdge {
  id: string;
  from: string;
  to: string;
  weight: number;
}

export interface NetworkGraph {
  nodes: NetNode[];
  edges: NetEdge[];
  layers?: Layer[];
}

export interface NodeState {
  z?: number; // weighted sum + bias
  a?: number; // activation output
  dz?: number; // dLoss/dz
  da?: number; // dLoss/da
}

export interface SimState {
  nodeStates: Record<string, NodeState>;
  edgeGrads: Record<string, number>; // dLoss/dweight
  biasGrads: Record<string, number>; // dLoss/dbias
  loss?: number;
}

export type SimPhase = 'forward' | 'loss' | 'backward' | 'update';

export interface SimStep {
  phase: SimPhase;
  nodeId?: string;
  edgeId?: string;
  layerId?: string;
  layerIndex?: number;
  description: string;
  detailMath?: string;
  state: SimState;
}

export interface TrainingSample {
  inputs: number[];
  target: number;
}

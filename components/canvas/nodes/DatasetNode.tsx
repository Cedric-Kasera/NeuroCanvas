import React, { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { TrainingSample } from '@/lib/engine/types';

const DATASETS: Record<string, { name: string; samples: TrainingSample[] }> = {
  AND: {
    name: 'AND Gate',
    samples: [
      { inputs: [0, 0], target: 0 },
      { inputs: [0, 1], target: 0 },
      { inputs: [1, 0], target: 0 },
      { inputs: [1, 1], target: 1 },
    ],
  },
  OR: {
    name: 'OR Gate',
    samples: [
      { inputs: [0, 0], target: 0 },
      { inputs: [0, 1], target: 1 },
      { inputs: [1, 0], target: 1 },
      { inputs: [1, 1], target: 1 },
    ],
  },
  XOR: {
    name: 'XOR Gate',
    samples: [
      { inputs: [0, 0], target: 0 },
      { inputs: [0, 1], target: 1 },
      { inputs: [1, 0], target: 1 },
      { inputs: [1, 1], target: 0 },
    ],
  },
  Line: {
    name: 'Linear 1D',
    samples: [
      { inputs: [-1], target: -0.8 },
      { inputs: [0], target: 0.1 },
      { inputs: [1], target: 0.9 },
    ],
  },
};

export const DatasetNode = memo(({ id, data, selected }: NodeProps) => {
  const [selectedDataset, setSelectedDataset] = useState('XOR');
  const [sampleIdx, setSampleIdx] = useState(0);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const nodes = useCanvasStore((s) => s.nodes);
  const trainN = useSimStore((s) => s.trainN);

  const currentDataset = DATASETS[selectedDataset] || DATASETS.XOR;
  const currentSample = currentDataset.samples[sampleIdx] || currentDataset.samples[0];

  const applySampleToNetwork = (s: TrainingSample) => {
    const inputNodes = nodes.filter((n) => n.type === 'inputNode');
    const outputNodes = nodes.filter((n) => n.type === 'outputNode');

    inputNodes.forEach((node, idx) => {
      const val = s.inputs[idx] ?? s.inputs[0] ?? 0;
      updateNodeData(node.id, { value: val });
    });

    if (outputNodes.length > 0) {
      updateNodeData(outputNodes[0].id, { target: s.target });
    }
  };

  const handleNextSample = () => {
    const nextIdx = (sampleIdx + 1) % currentDataset.samples.length;
    setSampleIdx(nextIdx);
    applySampleToNetwork(currentDataset.samples[nextIdx]);
  };

  const handleTrainBatch = () => {
    trainN(20, 0.2, currentDataset.samples);
  };

  return (
    <div
      className={`relative min-w-[210px] rounded-xl border bg-[#faf9f5] dark:bg-[#1f1e1b] p-3 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all ${
        selected ? 'ring-2 ring-[#cc785c] border-[#cc785c]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-1.5 mb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#5db8a6]">Dataset</span>
        <select
          value={selectedDataset}
          onChange={(e) => {
            setSelectedDataset(e.target.value);
            setSampleIdx(0);
            applySampleToNetwork(DATASETS[e.target.value].samples[0]);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className="nodrag nopan text-xs bg-[#efe9de] dark:bg-[#252320] border border-[#e6dfd8] dark:border-[#383531] rounded px-1.5 py-0.5 font-mono text-[#141413] dark:text-[#faf9f5] cursor-pointer"
        >
          {Object.keys(DATASETS).map((key) => (
            <option key={key} value={key}>
              {DATASETS[key].name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 text-xs">
        <div className="rounded bg-[#efe9de] dark:bg-[#252320] p-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[#6c6a64] dark:text-[#a09d96]">Sample {sampleIdx + 1} of {currentDataset.samples.length}</span>
            <span className="font-mono font-bold text-[#cc785c]">Target: {currentSample.target}</span>
          </div>
          <div className="text-[11px] font-mono text-[#141413] dark:text-[#faf9f5]">
            Inputs: [{currentSample.inputs.join(', ')}]
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1">
          <button
            onClick={handleNextSample}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag nopan flex-1 rounded-md bg-[#efe9de] hover:bg-[#e8e0d2] dark:bg-[#252320] dark:hover:bg-[#383531] py-1 text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
          >
            Next Sample
          </button>
          <button
            onClick={handleTrainBatch}
            onPointerDown={(e) => e.stopPropagation()}
            className="nodrag nopan flex-1 rounded-md bg-[#cc785c] hover:bg-[#a9583e] py-1 text-xs font-medium text-white transition-colors"
          >
            Train Batch (×20)
          </button>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[#5db8a6] !border-2 !border-white shadow-sm"
      />
    </div>
  );
});

DatasetNode.displayName = 'DatasetNode';

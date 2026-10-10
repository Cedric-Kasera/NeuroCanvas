'use client';

import React, { useState } from 'react';
import {
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Plus,
} from 'lucide-react';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useUIStore } from '@/lib/state/uiStore';
import { runEngineSelfTests } from '@/lib/engine/engine.test';
import { FormattedMath } from '@/components/ui/FormattedMath';

export function Inspector() {
  const [explainOpen, setExplainOpen] = useState(true);
  const [testResult, setTestResult] = useState<any>(null);

  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  const selectedEdgeId = useCanvasStore((s) => s.selectedEdgeId);
  const selectedLayerId = useCanvasStore((s) => s.selectedLayerId);
  const setSelectedLayerId = useCanvasStore((s) => s.setSelectedLayerId);
  const addNodeToLayer = useCanvasStore((s) => s.addNodeToLayer);
  const removeLayer = useCanvasStore((s) => s.removeLayer);
  const layers = useCanvasStore((s) => s.layers);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const updateEdgeData = useCanvasStore((s) => s.updateEdgeData);
  const removeNodes = useCanvasStore((s) => s.removeNodes);
  const removeEdges = useCanvasStore((s) => s.removeEdges);
  const settings = useCanvasStore((s) => s.settings);
  const updateSettings = useCanvasStore((s) => s.updateSettings);

  const mode = useUIStore((s) => s.mode);
  const setMode = useUIStore((s) => s.setMode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  const handleRunTests = () => {
    const res = runEngineSelfTests();
    setTestResult(res);
  };

  // Case 0: A Layer is Selected
  if (selectedLayer) {
    const memberNodes = nodes.filter((n) => selectedLayer.nodeIds.includes(n.id));
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#cc785c]">
              {selectedLayer.kind} Layer
            </span>
            <h3 className="font-serif text-sm font-bold text-[#141413] dark:text-[#faf9f5]">
              {selectedLayer.label || `${selectedLayer.kind} layer`}
            </h3>
          </div>
          <button
            onClick={() => setSelectedLayerId(null)}
            className="p-1 rounded text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5] text-xs font-medium"
            title="Deselect layer"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl bg-[#efe9de] dark:bg-[#252320] p-3 text-xs space-y-1">
            <span className="text-[#6c6a64] dark:text-[#a09d96]">Neurons in this layer:</span>
            <span className="font-mono font-bold text-sm text-[#cc785c] block">
              {memberNodes.length} {memberNodes.length === 1 ? 'neuron' : 'neurons'}
            </span>
          </div>

          {/* Batch activation function setter for hidden or output layers */}
          {selectedLayer.kind !== 'input' && (
            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-medium text-[#6c6a64] dark:text-[#a09d96] block">
                Set Layer Activation Function
              </label>
              <select
                onChange={(e) => {
                  const newAct = e.target.value;
                  for (const n of memberNodes) {
                    if (n.type === 'neuronNode') {
                      updateNodeData(n.id, { activation: newAct });
                    }
                  }
                }}
                defaultValue="sigmoid"
                className="w-full bg-[#efe9de] dark:bg-[#252320] border border-[#e6dfd8] dark:border-[#383531] rounded-lg px-2.5 py-1.5 font-mono text-xs text-[#141413] dark:text-[#faf9f5]"
              >
                <option value="sigmoid">Sigmoid (Logistic 0..1)</option>
                <option value="relu">ReLU (Rectified Linear)</option>
                <option value="tanh">Tanh (Hyperbolic Tangent -1..1)</option>
                <option value="step">Step (Threshold Heaviside)</option>
                <option value="identity">Linear (Identity)</option>
              </select>
            </div>
          )}

          {/* Batch bias offset */}
          {selectedLayer.kind !== 'input' && (
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-xs text-[#6c6a64] dark:text-[#a09d96]">
                <span>Set All Biases in Layer</span>
              </div>
              <div className="flex items-center gap-1.5">
                {[-1, 0, 0.5, 1].map((bVal) => (
                  <button
                    key={bVal}
                    onClick={() => {
                      for (const n of memberNodes) {
                        if (n.type === 'neuronNode') {
                          updateNodeData(n.id, { bias: bVal });
                        }
                      }
                    }}
                    className="flex-1 py-1 rounded bg-[#efe9de] dark:bg-[#252320] hover:bg-[#cc785c] hover:text-white text-xs font-mono transition-colors"
                  >
                    {bVal >= 0 ? `+${bVal}` : bVal}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons: Add Node inside Layer & Delete Layer */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => addNodeToLayer(selectedLayer.id)}
              className="w-full py-2 px-3 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-medium flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <Plus size={14} />
              <span>
                Add{' '}
                {selectedLayer.kind === 'input'
                  ? 'Input Node'
                  : selectedLayer.kind === 'output'
                  ? 'Output Node'
                  : 'Neuron Node'}{' '}
                to Layer
              </span>
            </button>

            <button
              onClick={() => removeLayer(selectedLayer.id)}
              className="w-full py-1.5 px-3 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#fee2e2] dark:hover:bg-[#451a1a] text-[#c64545] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 size={13} />
              <span>Ungroup / Delete Layer Frame</span>
            </button>
          </div>

          <div className="rounded-xl border border-[#e6dfd8] dark:border-[#383531] p-3 text-xs leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
            {selectedLayer.kind === 'input' && (
              <p>The <strong>Input layer</strong> holds external features that feed forward into downstream hidden layers.</p>
            )}
            {selectedLayer.kind === 'hidden' && (
              <p>The <strong>Hidden layer</strong> projects inputs into non-linear representations, allowing the network to learn complex classification boundaries.</p>
            )}
            {selectedLayer.kind === 'output' && (
              <p>The <strong>Output layer</strong> generates the network&apos;s final hypothesis or probabilities.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Case 1: An Edge is Selected
  if (selectedEdge) {
    const weight = Number(selectedEdge.data?.weight ?? 1.0);
    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#cc785c]">Connection</span>
            <h3 className="font-serif text-sm font-bold text-[#141413] dark:text-[#faf9f5]">Synaptic Weight</h3>
          </div>
          <button
            onClick={() => removeEdges([selectedEdge.id])}
            className="p-1 rounded text-[#8e8b82] hover:text-[#c64545]"
            title="Delete connection"
          >
            <Trash2 size={16} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-[#6c6a64] dark:text-[#a09d96]">Weight (w):</span>
              <span className="font-mono font-bold text-sm text-[#cc785c]">{weight.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={-3}
              max={3}
              step={0.05}
              value={weight}
              onChange={(e) => updateEdgeData(selectedEdge.id, { weight: parseFloat(e.target.value) })}
              className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
            />
          </div>

          <div className="rounded-xl bg-[#efe9de] dark:bg-[#252320] p-3 text-xs leading-relaxed space-y-1">
            <span className="font-bold text-[#141413] dark:text-[#faf9f5] block">What this weight does:</span>
            <p className="text-[#6c6a64] dark:text-[#a09d96]">
              Scales the signal flowing from node <strong>{selectedEdge.source}</strong> to{' '}
              <strong>{selectedEdge.target}</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: A Node is Selected
  if (selectedNode) {
    const label = (selectedNode.data?.label as string) || selectedNode.id;
    const kind = selectedNode.type || 'node';
    const memberLayer = layers.find((l) => l.nodeIds.includes(selectedNode.id));

    return (
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-2">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#cc785c]">{kind}</span>
              {memberLayer && (
                <button
                  onClick={() => setSelectedLayerId(memberLayer.id)}
                  className="px-1.5 py-0.2 rounded text-[10px] font-mono font-medium bg-[#efe9de] dark:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] hover:text-[#cc785c] hover:border-[#cc785c] border border-transparent transition-colors"
                  title="Click to view enclosing layer"
                >
                  in {memberLayer.label || memberLayer.kind}
                </button>
              )}
            </div>
            <h3 className="font-serif text-sm font-bold text-[#141413] dark:text-[#faf9f5]">{label}</h3>
          </div>
          <button
            onClick={() => removeNodes([selectedNode.id])}
            className="p-1 rounded text-[#8e8b82] hover:text-[#c64545]"
            title="Delete card"
          >
            <Trash2 size={16} />
          </button>
        </div>

        {/* Node-specific controls */}
        {selectedNode.type === 'inputNode' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#6c6a64] dark:text-[#a09d96]">Input Signal (x)</span>
                <span className="font-mono font-bold text-sm">{Number(selectedNode.data?.value ?? 0).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={Number(selectedNode.data?.value ?? 0)}
                onChange={(e) => updateNodeData(selectedNode.id, { value: parseFloat(e.target.value) })}
                className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'neuronNode' && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#6c6a64] dark:text-[#a09d96]">Bias (b)</span>
                <span className="font-mono font-bold text-sm">{Number(selectedNode.data?.bias ?? 0).toFixed(2)}</span>
              </div>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={Number(selectedNode.data?.bias ?? 0)}
                onChange={(e) => updateNodeData(selectedNode.id, { bias: parseFloat(e.target.value) })}
                className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-[#6c6a64] dark:text-[#a09d96]">Activation function</span>
              <select
                value={(selectedNode.data?.activation as string) || 'sigmoid'}
                onChange={(e) => updateNodeData(selectedNode.id, { activation: e.target.value })}
                className="bg-[#efe9de] dark:bg-[#252320] border border-[#e6dfd8] dark:border-[#383531] rounded-md px-2 py-1 font-mono text-xs"
              >
                <option value="sigmoid">Sigmoid</option>
                <option value="relu">ReLU</option>
                <option value="tanh">Tanh</option>
                <option value="step">Step</option>
                <option value="identity">Linear</option>
              </select>
            </div>
          </div>
        )}

        {/* Explain this collapsible */}
        <div className="rounded-xl border border-[#e6dfd8] dark:border-[#383531] overflow-hidden">
          <button
            onClick={() => setExplainOpen(!explainOpen)}
            className="w-full flex items-center justify-between p-2.5 bg-[#efe9de] dark:bg-[#252320] text-xs font-semibold text-[#141413] dark:text-[#faf9f5]"
          >
            <span>Explain this card</span>
            {explainOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {explainOpen && (
            <div className="p-3 text-xs leading-relaxed text-[#3d3d3a] dark:text-[#efe9de] space-y-2 bg-[#faf9f5] dark:bg-[#181715]">
              {selectedNode.type === 'neuronNode' && (
                <>
                  <p>
                    A <strong>neuron</strong> sums all incoming weighted signals, adds its bias offset, and applies a non-linear activation curve.
                  </p>
                  {mode === 'student' && (
                    <div className="space-y-1">
                      <FormattedMath math="z = \sum_{i=1}^{n} w_i \cdot a_i + b" displayMode={true} />
                      <FormattedMath math="a = f(z)" displayMode={true} />
                    </div>
                  )}
                </>
              )}
              {selectedNode.type === 'inputNode' && (
                <p>
                  An <strong>input node</strong> is the feature entry point. In computer vision, it would represent a pixel; in medical AI, a patient measurement.
                </p>
              )}
              {selectedNode.type === 'outputNode' && (
                <p>
                  An <strong>output node</strong> represents the final prediction of the network, compared against the true target value to calculate errors.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case 3: Canvas Settings (Nothing Selected)
  return (
    <div className="p-4 space-y-5">
      <div className="border-b border-[#e6dfd8] dark:border-[#383531] pb-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#cc785c]">Inspector</span>
        <h3 className="font-serif text-sm font-bold text-[#141413] dark:text-[#faf9f5]">Canvas Settings</h3>
      </div>

      <div className="space-y-3 text-xs">
        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[#6c6a64] dark:text-[#a09d96]">Explanation Mode</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="bg-[#efe9de] dark:bg-[#252320] border border-[#e6dfd8] dark:border-[#383531] rounded px-2 py-1 font-medium capitalize"
          >
            <option value="beginner">Beginner (Intuitive)</option>
            <option value="student">Student (Formulas)</option>
          </select>
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[#6c6a64] dark:text-[#a09d96]">Snap to grid (20px)</span>
          <input
            type="checkbox"
            checked={settings.snap}
            onChange={(e) => updateSettings({ snap: e.target.checked })}
            className="rounded accent-[#cc785c]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[#6c6a64] dark:text-[#a09d96]">Show dotted grid</span>
          <input
            type="checkbox"
            checked={settings.grid}
            onChange={(e) => updateSettings({ grid: e.target.checked })}
            className="rounded accent-[#cc785c]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span className="text-[#6c6a64] dark:text-[#a09d96]">Show minimap</span>
          <input
            type="checkbox"
            checked={settings.minimap}
            onChange={(e) => updateSettings({ minimap: e.target.checked })}
            className="rounded accent-[#cc785c]"
          />
        </label>
      </div>

      {/* Engine Self-Test Button */}
      <div className="pt-3 border-t border-[#e6dfd8] dark:border-[#383531]">
        <button
          onClick={handleRunTests}
          className="w-full py-2 rounded-xl bg-[#efe9de] hover:bg-[#e8e0d2] dark:bg-[#252320] dark:hover:bg-[#383531] text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
        >
          Verify Simulation Math Engine
        </button>

        {testResult && (
          <div className="mt-3 space-y-1.5 p-2.5 rounded-xl bg-[#efe9de] dark:bg-[#252320] text-xs">
            <div className="flex items-center gap-1.5 font-bold mb-1">
              {testResult.passed ? (
                <CheckCircle2 size={15} className="text-[#5db872]" />
              ) : (
                <XCircle size={15} className="text-[#c64545]" />
              )}
              <span>{testResult.passed ? 'All Math Tests Passed!' : 'Some Tests Failed'}</span>
            </div>
            {testResult.results.map((r: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <span className="truncate">{r.name}</span>
                <span className={r.success ? 'text-[#5db872]' : 'text-[#c64545]'}>
                  {r.success ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

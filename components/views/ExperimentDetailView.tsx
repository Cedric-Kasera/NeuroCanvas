'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  Flame,
  Award,
  AlertTriangle,
  Activity,
  Layers,
  HelpCircle,
  Lightbulb,
  Check,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { EXPERIMENTS, ExperimentDefinition } from '@/lib/content/experiments';
import { AppLogo } from '@/components/ui/AppLogo';
import { forward } from '@/lib/engine/forward';
import { backward } from '@/lib/engine/backward';
import { trainEpochs } from '@/lib/engine/train';
import { canvasToNetworkGraph } from '@/lib/engine/projectChecks';
import { gradientMagnitudes, deadNeurons, symmetricPairs } from '@/lib/engine/diagnostics';
import { ActivationFn } from '@/lib/engine/types';

export function ExperimentDetailView() {
  const activeExperimentId = useUIStore((s) => s.activeExperimentId);
  const experiment = EXPERIMENTS.find((e) => e.id === activeExperimentId) || EXPERIMENTS[0];

  return <ExperimentDetailContent key={experiment.id} experiment={experiment} />;
}

function ExperimentDetailContent({ experiment }: { experiment: ExperimentDefinition }) {
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const showToast = useUIStore((s) => s.showToast);

  const [currentStep, setCurrentStep] = useState<number>(1); // 1: Predict, 2: Run & Observe, 3: Diagnose, 4: Fix, 5: Takeaway
  const [activeCanvas, setActiveCanvas] = useState(() => JSON.parse(JSON.stringify(experiment.preset)));
  const [predictedChoice, setPredictedChoice] = useState<number | null>(null);
  const [diagnosedChoice, setDiagnosedChoice] = useState<number | null>(null);

  const [lossHistory, setLossHistory] = useState<number[]>([]);
  const [learningRate, setLearningRate] = useState<number>(experiment.run.train.lr);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [gatePassed, setGatePassed] = useState<boolean>(false);

  // Compute live engine diagnostics
  const graph = canvasToNetworkGraph(activeCanvas);
  const fwd = forward(graph);
  const bwd = backward(graph, fwd);
  const gradMap = gradientMagnitudes(graph, bwd);

  const deadNeuronIds = experiment.dataset
    ? deadNeurons(graph, experiment.dataset)
    : [];

  const symPairs = symmetricPairs(graph);

  // Run Training
  const handleTrain = (epochs: number) => {
    setIsTraining(true);
    try {
      const samples = experiment.dataset || [
        { inputs: [graph.nodes.find((n) => n.kind === 'input')?.inputValue ?? 1], target: 2 },
      ];

      const { graph: updatedGraph, lossHistory: newHistory } = trainEpochs(
        graph,
        samples,
        learningRate,
        epochs
      );

      const newNodes = activeCanvas.nodes.map((cn: any) => {
        const gn = updatedGraph.nodes.find((n) => n.id === cn.id);
        if (gn && gn.bias !== undefined) {
          return { ...cn, data: { ...cn.data, bias: gn.bias } };
        }
        return cn;
      });

      const newEdges = activeCanvas.edges.map((ce: any) => {
        const ge = updatedGraph.edges.find((e) => e.id === ce.id);
        if (ge) {
          return { ...ce, data: { ...ce.data, weight: ge.weight } };
        }
        return ce;
      });

      setActiveCanvas({ ...activeCanvas, nodes: newNodes, edges: newEdges });
      setLossHistory((prev) => [...prev, ...newHistory]);

      // Check gate condition
      const gate = experiment.fix.gate;
      const finalLoss = newHistory[newHistory.length - 1] ?? 0;
      const startLoss = newHistory[0] ?? finalLoss;

      if (gate.type === 'lossDropsBy') {
        if (startLoss > 0 && startLoss / Math.max(0.0001, finalLoss) >= gate.factor) {
          setGatePassed(true);
        }
      } else if (gate.type === 'lossBelowAfterTraining') {
        if (finalLoss <= gate.value) {
          setGatePassed(true);
        }
      } else if (gate.type === 'deadNeuronsEqual') {
        const deadAfter = experiment.dataset ? deadNeurons(updatedGraph, experiment.dataset) : [];
        if (deadAfter.length === gate.value) {
          setGatePassed(true);
        }
      } else if (gate.type === 'neuronsDiffer') {
        const pairsAfter = symmetricPairs(updatedGraph, gate.epsilon);
        if (pairsAfter.length === 0) {
          setGatePassed(true);
        }
      }
    } finally {
      setIsTraining(false);
    }
  };

  // Fix button helper
  const applyFixSolution = () => {
    if (experiment.id === 'x1-runaway-learning-rate') {
      setLearningRate(0.5);
      showToast('Learning rate set to 0.5', 'success');
    } else if (experiment.id === 'x2-vanishing-gradients') {
      const updated = {
        ...activeCanvas,
        nodes: activeCanvas.nodes.map((n: any) =>
          n.id !== 'v_in' && n.id !== 'v_out' && n.id !== 'v_n5'
            ? { ...n, data: { ...n.data, activation: 'relu' } }
            : n
        ),
      };
      setActiveCanvas(updated);
      setGatePassed(true);
      showToast('Switched hidden neurons to ReLU', 'success');
    } else if (experiment.id === 'x3-the-dead-relu') {
      const updated = {
        ...activeCanvas,
        nodes: activeCanvas.nodes.map((n: any) =>
          n.id === 'd_h1' ? { ...n, data: { ...n.data, bias: 0.0, activation: 'leakyRelu' } } : n
        ),
      };
      setActiveCanvas(updated);
      setGatePassed(true);
      showToast('Revived dead neuron h₁ with Leaky ReLU', 'success');
    } else if (experiment.id === 'x4-the-symmetry-trap') {
      const updated = {
        ...activeCanvas,
        edges: activeCanvas.edges.map((e: any, idx: number) => ({
          ...e,
          data: { ...e.data, weight: Number((((idx + 1) * 0.3) % 1.2 - 0.6).toFixed(2)) },
        })),
      };
      setActiveCanvas(updated);
      setGatePassed(true);
      showToast('Randomized weights to break symmetry', 'success');
    } else if (experiment.id === 'x5-the-step-that-cant-learn') {
      const updated = {
        ...activeCanvas,
        nodes: activeCanvas.nodes.map((n: any) =>
          n.id === 'st_n' ? { ...n, data: { ...n.data, activation: 'sigmoid' } } : n
        ),
      };
      setActiveCanvas(updated);
      showToast('Switched activation to Sigmoid', 'success');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/90 dark:bg-[#141413]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentRoute('lab')}
            className="p-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-serif font-bold text-sm sm:text-base">{experiment.title}</span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#cc785c]/10 text-[#cc785c] font-bold">
            Step {currentStep} of 5
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              useCanvasStore.getState().loadCanvas(activeCanvas);
              useSimStore.getState().buildFromCanvas();
              useUIStore.getState().setActiveCanvasMode('experiment', experiment.title);
              useUIStore.getState().setRightOpen(true);
              useUIStore.getState().setRightTab('activity');
              setCurrentRoute('play');
              showToast(`Opened ${experiment.title} in Studio Canvas!`, 'success');
            }}
            className="px-3 py-1.5 rounded-xl bg-[#5db8a6] hover:bg-[#4ea594] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            title="Inspect network failure mode directly on the visual Studio Canvas"
          >
            <Layers size={13} />
            <span>Inspect on Studio Canvas</span>
          </button>

          <button
            onClick={() => {
              setActiveCanvas(JSON.parse(JSON.stringify(experiment.preset)));
              setLossHistory([]);
              setGatePassed(false);
            }}
            className="p-1.5 rounded-lg border border-[#e6dfd8] dark:border-[#383531] text-xs text-[#8e8b82] hover:text-[#141413] flex items-center gap-1"
            title="Reset Canvas"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Guided Flow Column */}
        <div className="w-full lg:w-96 border-r border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5] dark:bg-[#181715] flex flex-col overflow-y-auto p-5 gap-6">
          {/* Step 1: Predict */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#cc785c] text-white text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <h4 className="font-serif text-sm font-bold">Predict the Bug</h4>
            </div>

            <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
              {experiment.predict.question}
            </p>

            <div className="flex flex-col gap-2">
              {experiment.predict.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => setPredictedChoice(oIdx)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    predictedChoice === oIdx
                      ? oIdx === experiment.predict.correct
                        ? 'bg-[#5db8a6]/10 border-[#5db8a6] text-[#141413] dark:text-[#faf9f5] font-semibold'
                        : 'bg-red-500/10 border-red-500 text-[#141413] dark:text-[#faf9f5]'
                      : 'bg-white dark:bg-[#1a1917] border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {predictedChoice !== null && (
              <div className="p-3 rounded-xl bg-[#efe9de]/60 dark:bg-[#252320]/60 text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                <span className="font-semibold block text-[#cc785c] mb-1">
                  {predictedChoice === experiment.predict.correct ? '✓ Exactly right!' : 'Take a closer look:'}
                </span>
                {experiment.predict.reveal}
              </div>
            )}
          </div>

          {/* Step 2: Observe */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[#e6dfd8] dark:border-[#2a2926]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#cc785c] text-white text-[10px] font-bold flex items-center justify-center">
                2
              </span>
              <h4 className="font-serif text-sm font-bold">What to Look For</h4>
            </div>

            <div className="flex flex-col gap-2 text-xs text-[#6c6a64] dark:text-[#a09d96]">
              {experiment.observe.map((obs, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#cc785c] font-bold">•</span>
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Diagnose */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[#e6dfd8] dark:border-[#2a2926]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#cc785c] text-white text-[10px] font-bold flex items-center justify-center">
                3
              </span>
              <h4 className="font-serif text-sm font-bold">Diagnose the Cause</h4>
            </div>

            <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
              {experiment.diagnose.question}
            </p>

            <div className="flex flex-col gap-2">
              {experiment.diagnose.options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  onClick={() => setDiagnosedChoice(oIdx)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition-all ${
                    diagnosedChoice === oIdx
                      ? oIdx === experiment.diagnose.correct
                        ? 'bg-[#5db8a6]/10 border-[#5db8a6] text-[#141413] dark:text-[#faf9f5] font-semibold'
                        : 'bg-red-500/10 border-red-500 text-[#141413] dark:text-[#faf9f5]'
                      : 'bg-white dark:bg-[#1a1917] border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>

            {diagnosedChoice !== null && (
              <div className="p-3 rounded-xl bg-[#efe9de]/60 dark:bg-[#252320]/60 text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                {experiment.diagnose.explain}
              </div>
            )}
          </div>

          {/* Step 4: Fix Gate */}
          <div className="flex flex-col gap-3 pt-4 border-t border-[#e6dfd8] dark:border-[#2a2926]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#cc785c] text-white text-[10px] font-bold flex items-center justify-center">
                4
              </span>
              <h4 className="font-serif text-sm font-bold">Apply the Fix</h4>
            </div>

            <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
              {experiment.fix.instruction}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={applyFixSolution}
                className="px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-white dark:hover:bg-[#252320] text-xs font-medium text-[#cc785c] transition-colors"
              >
                Show me the fix
              </button>
            </div>

            {gatePassed && (
              <div className="p-3 rounded-xl bg-[#5db8a6]/15 border border-[#5db8a6]/30 text-xs font-semibold text-[#5db8a6] flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>Fix verified! Network learned successfully.</span>
              </div>
            )}
          </div>

          {/* Step 5: Takeaway */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-[#e6dfd8] dark:border-[#2a2926]">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
              Key Engineering Takeaway
            </h4>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#cc785c]/10 to-[#5db8a6]/10 border border-[#e6dfd8] dark:border-[#2a2926] text-xs text-[#6c6a64] dark:text-[#a09d96] flex flex-col gap-2">
              {experiment.takeaway.map((line, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="text-[#5db8a6] font-bold">•</span>
                  <span>{line}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Live Diagnostics Workbench */}
        <div className="flex-1 flex flex-col bg-[#faf9f5] dark:bg-[#141413] overflow-y-auto p-6 gap-6">
          {/* Diagnostic Badges Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] shadow-xs">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-semibold text-[#8e8b82]">Live Diagnostics:</span>

              {deadNeuronIds.length > 0 ? (
                <span className="px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle size={13} />
                  <span>{deadNeuronIds.length} Dead ReLU Neuron</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-[#5db8a6]/10 text-[#5db8a6] font-semibold flex items-center gap-1">
                  <Check size={13} />
                  <span>No Dead Neurons</span>
                </span>
              )}

              {symPairs.length > 0 ? (
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1.5">
                  <Activity size={13} />
                  <span>Symmetry Trap Detected</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full bg-[#5db8a6]/10 text-[#5db8a6] font-semibold flex items-center gap-1">
                  <Check size={13} />
                  <span>Asymmetric</span>
                </span>
              )}
            </div>

            {/* Run Controls */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#8e8b82]">Rate η:</span>
                <input
                  type="number"
                  step="0.1"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.1)}
                  className="w-16 px-2 py-1 rounded-lg border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] text-xs font-mono"
                />
              </div>

              <button
                onClick={() => handleTrain(experiment.run.train.n)}
                disabled={isTraining}
                className="px-4 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Play size={12} />
                <span>Train ×{experiment.run.train.n}</span>
              </button>
            </div>
          </div>

          {/* Loss Curve Card */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-3 shadow-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Loss Curve History</span>
              <span className="font-mono text-[#cc785c]">
                Current Loss: {lossHistory[lossHistory.length - 1]?.toFixed(4) || fwd.loss?.toFixed(4) || '—'}
              </span>
            </div>

            <div className="h-28 flex items-end gap-1 border-b border-[#e6dfd8] dark:border-[#2a2926] pb-1">
              {lossHistory.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-xs text-[#8e8b82]">
                  Click &quot;Train&quot; above to record the loss trajectory.
                </div>
              ) : (
                lossHistory.slice(-40).map((l, idx) => {
                  const maxL = Math.max(...lossHistory.slice(-40), 1);
                  const h = Math.min(100, Math.max(4, (l / maxL) * 100));
                  return (
                    <div
                      key={idx}
                      style={{ height: `${h}%` }}
                      className="flex-1 bg-[#cc785c] hover:bg-[#5db8a6] rounded-t-xs transition-all"
                      title={`Step ${idx + 1}: ${l.toFixed(4)}`}
                    />
                  );
                })
              )}
            </div>
          </div>

          {/* Gradient Magnitude Bars (Backprop Blame Propagation) */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-3 shadow-xs">
            <h4 className="font-serif text-sm font-bold">
              Gradient Blame Magnitudes (|∂L/∂w|)
            </h4>
            <div className="flex flex-col gap-2">
              {Object.values(gradMap).map((g) => {
                const barWidth = Math.min(100, Math.max(3, g.absGrad * 150));
                return (
                  <div key={g.edgeId} className="flex flex-col gap-1 text-xs">
                    <div className="flex items-center justify-between text-[#8e8b82]">
                      <span>{g.edgeId} ({g.from} → {g.to})</span>
                      <span className="font-mono">{g.absGrad.toFixed(5)}</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#efe9de] dark:bg-[#252320] overflow-hidden">
                      <div
                        style={{ width: `${barWidth}%` }}
                        className="h-full bg-[#cc785c] rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

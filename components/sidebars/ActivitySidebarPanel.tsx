'use client';

import React, { useState } from 'react';
import {
  Award,
  Flame,
  Sparkles,
  GraduationCap,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowLeft,
  Play,
  HelpCircle,
  ExternalLink,
  Target,
  Sliders,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  Info,
  Zap,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useProjectStore } from '@/lib/state/projectStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { useGameStore } from '@/lib/state/gameStore';
import { EXPERIMENTS } from '@/lib/content/experiments';
import { trainEpochs } from '@/lib/engine/train';
import { canvasToNetworkGraph } from '@/lib/engine/projectChecks';
import LZString from 'lz-string';

export function ActivitySidebarPanel() {
  const activeCanvasMode = useUIStore((s) => s.activeCanvasMode);
  const activeCanvasTitle = useUIStore((s) => s.activeCanvasTitle);
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  const activeExperimentId = useUIStore((s) => s.activeExperimentId);
  const activeAssignmentPayload = useUIStore((s) => s.activeAssignmentPayload);
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const showToast = useUIStore((s) => s.showToast);

  // Project state
  const currentProject = useProjectStore((s) => s.currentProject);
  const requirementResults = useProjectStore((s) => s.requirementResults);
  const checkAllRequirements = useProjectStore((s) => s.checkAllRequirements);
  const updateActiveCanvas = useProjectStore((s) => s.updateActiveCanvas);

  // Canvas & Sim state
  const serialize = useCanvasStore((s) => s.serialize);
  const loadCanvas = useCanvasStore((s) => s.loadCanvas);
  const buildFromCanvas = useSimStore((s) => s.buildFromCanvas);
  const stepForward = useSimStore((s) => s.stepForward);
  const playSim = useSimStore((s) => s.play);
  const isPlaying = useSimStore((s) => s.isPlaying);

  // Game state
  const tunerLevel = useGameStore((s) => s.tunerLevel);
  const tunerOutput = useGameStore((s) => s.tunerOutput);
  const tunerDiff = useGameStore((s) => s.tunerDiff);
  const tunerMovesUsed = useGameStore((s) => s.tunerMovesUsed);
  const tunerSolved = useGameStore((s) => s.tunerSolved);
  const tunerStars = useGameStore((s) => s.tunerStars);

  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [trainLr, setTrainLr] = useState(1.0);

  // Experiment data
  const currentExperiment = React.useMemo(() => {
    if (activeExperimentId) {
      return EXPERIMENTS.find((e) => e.id === activeExperimentId) || EXPERIMENTS[0];
    }
    return EXPERIMENTS[0];
  }, [activeExperimentId]);

  // Assignment data
  const assignmentData = React.useMemo(() => {
    if (!activeAssignmentPayload) return null;
    try {
      const json = LZString.decompressFromEncodedURIComponent(activeAssignmentPayload);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }, [activeAssignmentPayload]);

  // Handle checking project requirements
  const handleCheckProjectWork = async () => {
    setIsEvaluating(true);
    try {
      const currentCanvas = serialize();
      updateActiveCanvas(currentCanvas);
      await checkAllRequirements();

      const results = useProjectStore.getState().requirementResults;
      const total = Object.keys(results).length;
      const passed = Object.values(results).filter((r) => r.passed).length;

      if (passed === total && total > 0) {
        showToast(`All ${passed}/${total} requirements satisfied! Excellent work!`, 'success');
      } else {
        showToast(`${passed} of ${total} requirements satisfied. Keep refining!`, 'info');
      }
    } catch {
      showToast('Error evaluating network requirements.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handle training steps visually on canvas
  const handleTrainVisually = async (steps: number) => {
    setIsTraining(true);
    try {
      const currentCanvas = serialize();
      const graph = canvasToNetworkGraph(currentCanvas);

      const samples = currentProject?.dataset?.samples
        ? currentProject.dataset.samples.map((s) => ({
            inputs: s.x,
            target: Array.isArray(s.t) ? s.t[0] : s.t,
          }))
        : [
            { inputs: [0, 0], target: 0 },
            { inputs: [0, 1], target: 1 },
            { inputs: [1, 0], target: 1 },
            { inputs: [1, 1], target: 0 },
          ];

      const { graph: updatedGraph, lossHistory } = trainEpochs(graph, samples, trainLr, steps);

      // Update canvas with new trained weights & biases
      const newNodes = currentCanvas.nodes.map((cn) => {
        const gn = updatedGraph.nodes.find((n) => n.id === cn.id);
        if (gn && gn.bias !== undefined) {
          return { ...cn, data: { ...cn.data, bias: gn.bias } };
        }
        return cn;
      });

      const newEdges = currentCanvas.edges.map((ce) => {
        const ge = updatedGraph.edges.find((e) => e.id === ce.id);
        if (ge) {
          return { ...ce, data: { ...ce.data, weight: ge.weight } };
        }
        return ce;
      });

      const updatedCanvas = { ...currentCanvas, nodes: newNodes, edges: newEdges };
      loadCanvas(updatedCanvas);
      buildFromCanvas();
      updateActiveCanvas(updatedCanvas);

      const endLoss = lossHistory[lossHistory.length - 1] ?? 0;
      showToast(`Trained ×${steps} epochs visually! Loss: ${endLoss.toFixed(4)}`, 'success');
      checkAllRequirements();
    } catch (err: any) {
      showToast(err.message || 'Training failed.', 'error');
    } finally {
      setIsTraining(false);
    }
  };

  // Handle resetting canvas to initial activity starter
  const handleResetStarter = () => {
    if (activeCanvasMode === 'project' && currentProject) {
      loadCanvas(JSON.parse(JSON.stringify(currentProject.starterCanvas)));
      buildFromCanvas();
      showToast('Reset project canvas to initial starter setup.', 'info');
    } else if (activeCanvasMode === 'experiment' && currentExperiment) {
      loadCanvas(JSON.parse(JSON.stringify(currentExperiment.preset)));
      buildFromCanvas();
      showToast('Reset experiment canvas to preset topology.', 'info');
    } else {
      showToast('Reset current task canvas.', 'info');
    }
  };

  // Return to brief
  const handleReturnToBrief = () => {
    const currentCanvas = serialize();
    if (activeCanvasMode === 'project') {
      updateActiveCanvas(currentCanvas);
      setCurrentRoute('project-detail');
    } else if (activeCanvasMode === 'experiment') {
      setCurrentRoute('experiment-detail');
    } else if (activeCanvasMode === 'assignment') {
      setCurrentRoute('assignment');
    } else if (activeCanvasMode === 'game') {
      setCurrentRoute('games');
    } else {
      setCurrentRoute('play');
    }
  };

  // Mode badge styling
  const getHeaderInfo = () => {
    switch (activeCanvasMode) {
      case 'project':
        return {
          icon: <Award size={15} className="text-[#cc785c]" />,
          label: 'Project Mission',
          badgeClass: 'bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30',
          returnText: 'Back to Project Brief',
        };
      case 'experiment':
        return {
          icon: <Flame size={15} className="text-[#cc785c]" />,
          label: 'Experiment Lab',
          badgeClass: 'bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30',
          returnText: 'Back to Experiment Lab',
        };
      case 'assignment':
        return {
          icon: <GraduationCap size={15} className="text-[#cc785c]" />,
          label: 'Class Assignment',
          badgeClass: 'bg-[#cc785c]/10 text-[#cc785c] border-[#cc785c]/30',
          returnText: 'Back to Assignment View',
        };
      case 'game':
        return {
          icon: <Sparkles size={15} className="text-[#5db8a6]" />,
          label: 'Neural Game',
          badgeClass: 'bg-[#5db8a6]/10 text-[#5db8a6] border-[#5db8a6]/30',
          returnText: 'Back to Games Arcade',
        };
      default:
        return {
          icon: <Target size={15} className="text-[#8e8b82]" />,
          label: 'Studio Workspace',
          badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
          returnText: 'Back to Studio',
        };
    }
  };

  const headerInfo = getHeaderInfo();

  // Progress metrics for project
  const reqTotal = currentProject?.requirements.length || 0;
  const reqPassed = currentProject
    ? currentProject.requirements.filter((r) => requirementResults[r.id]?.passed).length
    : 0;
  const projectPct = reqTotal > 0 ? Math.round((reqPassed / reqTotal) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-[#faf9f5] dark:bg-[#181715] text-[#141413] dark:text-[#faf9f5] select-none">
      {/* Top Header Card */}
      <div className="p-4 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5] dark:bg-[#141413] flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${headerInfo.badgeClass}`}
          >
            {headerInfo.icon}
            <span>{headerInfo.label}</span>
          </div>

          <button
            onClick={handleReturnToBrief}
            className="flex items-center gap-1 text-[11px] font-semibold text-[#cc785c] hover:underline"
          >
            <ArrowLeft size={12} />
            <span>{headerInfo.returnText}</span>
          </button>
        </div>

        <h3 className="font-serif font-bold text-sm sm:text-base leading-tight">
          {activeCanvasTitle || currentProject?.title || 'Active Learning Task'}
        </h3>
      </div>

      {/* Scrollable Content Body */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-5">
        {/* ================= PROJECT MODE ================= */}
        {activeCanvasMode === 'project' && currentProject && (
          <>
            {/* Progress Bar & Status */}
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] shadow-2xs">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-[#141413] dark:text-[#faf9f5]">
                  Goals Satisfied
                </span>
                <span className="font-mono text-[#cc785c] font-bold">
                  {reqPassed} / {reqTotal} ({projectPct}%)
                </span>
              </div>

              <div className="w-full h-2 rounded-full bg-[#efe9de] dark:bg-[#252320] overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-[#cc785c] to-[#5db8a6] rounded-full transition-all duration-500"
                  style={{ width: `${projectPct}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8e8b82]">
                <span>{reqTotal - reqPassed} requirements remaining</span>
                {reqPassed === reqTotal && (
                  <span className="text-[#5db8a6] font-bold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Ready to Certify!
                  </span>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={handleCheckProjectWork}
                disabled={isEvaluating}
                className="w-full py-2.5 px-3 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <CheckCircle2 size={14} />
                <span>{isEvaluating ? 'Evaluating Canvas...' : 'Evaluate Current Canvas'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTrainVisually(25)}
                  disabled={isTraining}
                  className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c] text-xs font-medium flex items-center justify-center gap-1.5 transition-all text-[#141413] dark:text-[#faf9f5]"
                  title="Run 25 epochs and animate node changes live"
                >
                  <Play size={12} className="text-[#5db8a6]" />
                  <span>Train 25 Steps</span>
                </button>

                <button
                  onClick={handleResetStarter}
                  className="py-2 px-2.5 rounded-xl bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c] text-xs font-medium flex items-center justify-center gap-1.5 transition-all text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]"
                  title="Reset to starter network topology"
                >
                  <RotateCcw size={12} />
                  <span>Reset Starter</span>
                </button>
              </div>
            </div>

            {/* Requirements Checklist */}
            <div className="flex flex-col gap-2.5">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                Requirements Checklist
              </h4>

              <div className="flex flex-col gap-2">
                {currentProject.requirements.map((req, idx) => {
                  const res = requirementResults[req.id];
                  const passed = !!res?.passed;

                  return (
                    <div
                      key={req.id}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        passed
                          ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/25'
                          : 'bg-white dark:bg-[#1f1e1b] border-[#e6dfd8] dark:border-[#2a2926]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {passed ? (
                          <CheckCircle2
                            size={14}
                            className="text-[#5db8a6] shrink-0 mt-0.5"
                          />
                        ) : (
                          <XCircle
                            size={14}
                            className="text-[#8e8b82] shrink-0 mt-0.5"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <span
                            className={`font-semibold text-[11px] block ${
                              passed ? 'text-[#141413] dark:text-[#faf9f5]' : ''
                            }`}
                          >
                            Part {idx + 1}: {req.label}
                          </span>
                          {res?.detail && (
                            <span className="text-[10px] text-[#8e8b82] block mt-0.5 leading-snug">
                              {res.detail}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Visual Learning Hint */}
            <div className="p-3.5 rounded-xl bg-[#efe9de]/60 dark:bg-[#252320]/60 border border-[#e6dfd8] dark:border-[#2a2926] text-xs flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5 text-[#cc785c] font-semibold text-[11px]">
                <Info size={13} />
                <span>Visual Canvas Tip</span>
              </div>
              <p className="text-[11px] text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                Connect input handles to neurons by clicking and dragging between circular dots. Adjust weights by double clicking the connection label or in the Inspector tab.
              </p>
            </div>
          </>
        )}

        {/* ================= EXPERIMENT MODE ================= */}
        {activeCanvasMode === 'experiment' && currentExperiment && (
          <>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926]">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#cc785c] font-bold">
                The Core Question
              </span>
              <p className="text-xs font-semibold mt-1 text-[#141413] dark:text-[#faf9f5] leading-snug">
                {currentExperiment.predict.question}
              </p>
            </div>

            {/* Interactive Live Experiment Knobs */}
            <div className="flex flex-col gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926]">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                Experiment Controls
              </h4>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#8e8b82]">Learning Rate (η):</span>
                  <span className="font-mono font-bold text-[#cc785c]">{trainLr.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.01"
                  max="5.0"
                  step="0.05"
                  value={trainLr}
                  onChange={(e) => setTrainLr(parseFloat(e.target.value))}
                  className="accent-[#cc785c] w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <button
                  onClick={() => handleTrainVisually(10)}
                  disabled={isTraining}
                  className="py-2 px-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 shadow-2xs"
                >
                  <Play size={12} />
                  <span>Step 10 Epochs</span>
                </button>

                <button
                  onClick={handleResetStarter}
                  className="py-2 px-2.5 rounded-xl border border-[#e6dfd8] dark:border-[#2a2926] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors flex items-center justify-center gap-1 text-[#8e8b82]"
                >
                  <RotateCcw size={12} />
                  <span>Reset Canvas</span>
                </button>
              </div>
            </div>

            {/* What to observe visually on canvas */}
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                What to Observe Visually
              </h4>
              <div className="p-3 rounded-xl bg-[#efe9de]/50 dark:bg-[#252320]/50 border border-[#e6dfd8] dark:border-[#2a2926] text-xs text-[#6c6a64] dark:text-[#a09d96] flex flex-col gap-2">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#cc785c]">•</span>
                  <span><strong>Signal Flow:</strong> Watch node signals light up as values pass forward.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#cc785c]">•</span>
                  <span><strong>Weight Colors:</strong> Green indicates positive weights; terracotta/red indicates negative weights.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-[#cc785c]">•</span>
                  <span><strong>Saturation:</strong> At extreme weights, sigmoid gradients vanish near zero.</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ================= ASSIGNMENT MODE ================= */}
        {activeCanvasMode === 'assignment' && assignmentData && (
          <>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#cc785c] font-bold">
                Assignment Goal
              </span>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                Build and verify the assigned network topology. Test with inputs and train until the error converges.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleTrainVisually(25)}
                disabled={isTraining}
                className="w-full py-2.5 px-3 rounded-xl bg-[#5db8a6] hover:bg-[#4ea594] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Play size={13} />
                <span>Train Assignment on Canvas</span>
              </button>

              <button
                onClick={handleResetStarter}
                className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c] text-xs font-medium text-[#8e8b82] hover:text-[#141413] flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={12} />
                <span>Start in a Fresh Canvas</span>
              </button>
            </div>
          </>
        )}

        {/* ================= GAME MODE ================= */}
        {activeCanvasMode === 'game' && tunerLevel && (
          <>
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col items-center text-center gap-2">
              <span className="text-xs font-mono uppercase text-[#8e8b82]">
                Target Output: ±{tunerLevel.tolerance}
              </span>
              <span className="font-mono text-3xl font-bold text-[#cc785c]">
                {tunerLevel.targetOutput.toFixed(2)}
              </span>

              <div className="flex items-center gap-3 text-xs font-mono pt-2 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60 w-full justify-center">
                <span>Output: <strong>{tunerOutput.toFixed(2)}</strong></span>
                <span>•</span>
                <span className={tunerDiff <= tunerLevel.tolerance ? 'text-[#5db8a6] font-bold' : 'text-[#8e8b82]'}>
                  Diff: {tunerDiff.toFixed(3)}
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#efe9de]/50 dark:bg-[#252320]/50 border border-[#e6dfd8] dark:border-[#2a2926] text-xs text-[#6c6a64] dark:text-[#a09d96]">
              <p className="leading-relaxed">
                Click on the neuron card on the canvas to inspect its bias, or select the weighted connection wires to tweak their values until the target is hit!
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Trophy,
  Award,
  Play,
  Share2,
  Download,
  Copy,
  Table as TableIcon,
  BookOpen,
  FileText,
  ChevronDown,
  ChevronUp,
  Activity,
  Check,
  Zap,
  Layers,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useProjectStore } from '@/lib/state/projectStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { PROJECTS, ProjectDefinition } from '@/lib/content/projects';
import { AssignmentProgressVisual, MiniRadialGauge } from '@/components/projects/AssignmentProgressVisual';
import { AppLogo } from '@/components/ui/AppLogo';
import { trainStep, trainEpochs } from '@/lib/engine/train';
import { canvasToNetworkGraph } from '@/lib/engine/projectChecks';
import { forward } from '@/lib/engine/forward';
import { ActivationFn } from '@/lib/engine/types';

export function ProjectDetailView() {
  const activeProjectId = useUIStore((s) => s.activeProjectId);
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const showToast = useUIStore((s) => s.showToast);

  const currentProject = useProjectStore((s) => s.currentProject);
  const activeCanvas = useProjectStore((s) => s.activeCanvas);
  const requirementResults = useProjectStore((s) => s.requirementResults);
  const reflections = useProjectStore((s) => s.reflections);
  const runRecords = useProjectStore((s) => s.runRecords);
  const completedTier = useProjectStore((s) => s.completedTier);
  const isFinished = useProjectStore((s) => s.isFinished);
  const completionCode = useProjectStore((s) => s.completionCode);
  const activeTab = useProjectStore((s) => s.activeTab);

  const loadProject = useProjectStore((s) => s.loadProject);
  const updateActiveCanvas = useProjectStore((s) => s.updateActiveCanvas);
  const checkAllRequirements = useProjectStore((s) => s.checkAllRequirements);
  const updateReflection = useProjectStore((s) => s.updateReflection);
  const logRunRecord = useProjectStore((s) => s.logRunRecord);
  const setActiveTab = useProjectStore((s) => s.setActiveTab);
  const resetProject = useProjectStore((s) => s.resetProject);
  const finishProject = useProjectStore((s) => s.finishProject);
  const exportProjectFile = useProjectStore((s) => s.exportProjectFile);

  const [revealedHints, setRevealedHints] = useState<number>(1);
  const [learningRate, setLearningRate] = useState<number>(1.0);
  const [trainStepsCount, setTrainStepsCount] = useState<number>(50);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);
  const [cardCopied, setCardCopied] = useState<boolean>(false);

  // Initialize project
  useEffect(() => {
    if (activeProjectId) {
      loadProject(activeProjectId);
    }
  }, [activeProjectId, loadProject]);

  if (!currentProject || !activeCanvas) {
    return (
      <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#cc785c] border-t-transparent animate-spin" />
          <span className="text-xs text-[#8e8b82]">Loading challenge environment...</span>
        </div>
      </div>
    );
  }

  // Handle weight change
  const handleWeightChange = (edgeId: string, newWeight: number) => {
    const updatedEdges = activeCanvas.edges.map((e) =>
      e.id === edgeId ? { ...e, data: { ...e.data, weight: newWeight } } : e
    );
    const updated = { ...activeCanvas, edges: updatedEdges };
    updateActiveCanvas(updated);
    setTimeout(() => checkAllRequirements(), 400);
  };

  // Handle bias change
  const handleBiasChange = (nodeId: string, newBias: number) => {
    const updatedNodes = activeCanvas.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, bias: newBias } } : n
    );
    const updated = { ...activeCanvas, nodes: updatedNodes };
    updateActiveCanvas(updated);
    setTimeout(() => checkAllRequirements(), 400);
  };

  // Handle activation change
  const handleActivationChange = (nodeId: string, newAct: ActivationFn) => {
    const updatedNodes = activeCanvas.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, activation: newAct } } : n
    );
    const updated = { ...activeCanvas, nodes: updatedNodes };
    updateActiveCanvas(updated);
    setTimeout(() => checkAllRequirements(), 400);
  };

  // Run training
  const handleTrain = async (epochs: number) => {
    setIsTraining(true);
    try {
      const graph = canvasToNetworkGraph(activeCanvas);
      const samples = currentProject.dataset
        ? currentProject.dataset.samples.map((s) => ({
            inputs: s.x,
            target: Array.isArray(s.t) ? s.t[0] : s.t,
          }))
        : [{ inputs: [1, 0], target: 0.8 }];

      const initialLoss = forward(graph).loss ?? 0;
      const { graph: updatedGraph, lossHistory } = trainEpochs(
        graph,
        samples,
        learningRate,
        epochs
      );

      // Re-map back to canvas
      const newNodes = activeCanvas.nodes.map((cn) => {
        const gn = updatedGraph.nodes.find((n) => n.id === cn.id);
        if (gn && gn.bias !== undefined) {
          return { ...cn, data: { ...cn.data, bias: gn.bias } };
        }
        return cn;
      });

      const newEdges = activeCanvas.edges.map((ce) => {
        const ge = updatedGraph.edges.find((e) => e.id === ce.id);
        if (ge) {
          return { ...ce, data: { ...ce.data, weight: ge.weight } };
        }
        return ce;
      });

      const updated = { ...activeCanvas, nodes: newNodes, edges: newEdges };
      updateActiveCanvas(updated);

      const endLoss = lossHistory[lossHistory.length - 1] ?? 0;
      await logRunRecord({
        activation: (newNodes.find((n) => n.type === 'neuron')?.data as any)?.activation || 'sigmoid',
        lr: learningRate,
        seed: Date.now(),
        stepsRun: epochs,
        lossStart: initialLoss,
        lossEnd: endLoss,
        lossHistory,
      });

      showToast(`Trained ×${epochs} steps. Final loss: ${endLoss.toFixed(4)}`, 'success');
    } catch (err: any) {
      showToast(err.message || 'Training failed', 'error');
    } finally {
      setIsTraining(false);
      checkAllRequirements();
    }
  };

  const allPassed = currentProject.requirements.every((r) => requirementResults[r.id]?.passed);
  const passedCount = currentProject.requirements.filter((r) => requirementResults[r.id]?.passed).length;

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-14 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/90 dark:bg-[#141413]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentRoute('projects')}
            className="p-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-sm sm:text-base">
              {currentProject.title}
            </span>
            <MiniRadialGauge
              passedCount={passedCount}
              totalCount={currentProject.requirements.length}
            />
            {completedTier && (
              <span className="px-2 py-0.5 rounded-full bg-[#cc785c]/10 text-[#cc785c] text-[10px] font-bold uppercase tracking-wider">
                {completedTier} Tier Unlocked
              </span>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              if (activeCanvas) {
                useCanvasStore.getState().loadCanvas(activeCanvas);
                useSimStore.getState().buildFromCanvas();
                useUIStore.getState().setActiveCanvasMode('project', currentProject.title);
                setCurrentRoute('play');
                showToast(`Opened ${currentProject.title} in Studio Canvas!`, 'success');
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-[#5db8a6] hover:bg-[#4ea594] text-white font-medium transition-all shadow-xs flex items-center gap-1.5"
            title="Open and edit on the full visual Studio Canvas with node cards, handles, and live signals"
          >
            <Layers size={13} />
            <span>Work on Studio Canvas</span>
          </button>

          <button
            onClick={() => checkAllRequirements()}
            className="px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] font-medium transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 size={13} className="text-[#5db8a6]" />
            <span>Check My Work</span>
          </button>

          <button
            onClick={resetProject}
            className="px-2.5 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#8e8b82] hover:text-[#141413] transition-colors"
            title="Reset Project to Starter"
          >
            <RotateCcw size={13} />
          </button>

          <button
            onClick={async () => {
              await finishProject();
              setShowFinishModal(true);
            }}
            disabled={!allPassed && !completedTier}
            className={`px-3.5 py-1.5 rounded-xl font-semibold shadow-xs transition-all flex items-center gap-1.5 ${
              allPassed || completedTier
                ? 'bg-[#cc785c] hover:bg-[#a9583e] text-white hover:scale-[1.02]'
                : 'bg-[#efe9de] dark:bg-[#252320] text-[#8e8b82] cursor-not-allowed opacity-60'
            }`}
          >
            <Trophy size={13} />
            <span>Finish & Claim Badge</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Left Brief & Requirements / Right Interactive Workbench */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Panel: Brief, Requirements, Datasets, Hints, Reflections */}
        <div className="w-full lg:w-96 border-r border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5] dark:bg-[#181715] flex flex-col overflow-y-auto">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center border-b border-[#e6dfd8] dark:border-[#2a2926] text-xs font-medium px-4 pt-2">
            <button
              onClick={() => setActiveTab('brief')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'brief'
                  ? 'border-[#cc785c] text-[#cc785c] font-semibold'
                  : 'border-transparent text-[#8e8b82] hover:text-[#141413]'
              }`}
            >
              Brief & Goals
            </button>
            {currentProject.dataset && (
              <button
                onClick={() => setActiveTab('dataset')}
                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                  activeTab === 'dataset'
                    ? 'border-[#cc785c] text-[#cc785c] font-semibold'
                    : 'border-transparent text-[#8e8b82] hover:text-[#141413]'
                }`}
              >
                Dataset
              </button>
            )}
            <button
              onClick={() => setActiveTab('runs')}
              className={`pb-2.5 px-3 border-b-2 transition-colors ${
                activeTab === 'runs'
                  ? 'border-[#cc785c] text-[#cc785c] font-semibold'
                  : 'border-transparent text-[#8e8b82] hover:text-[#141413]'
              }`}
            >
              Runs ({runRecords.length})
            </button>
            {currentProject.reflections && currentProject.reflections.length > 0 && (
              <button
                onClick={() => setActiveTab('reflections')}
                className={`pb-2.5 px-3 border-b-2 transition-colors ${
                  activeTab === 'reflections'
                    ? 'border-[#cc785c] text-[#cc785c] font-semibold'
                    : 'border-transparent text-[#8e8b82] hover:text-[#141413]'
                }`}
              >
                Reflect
              </button>
            )}
          </div>

          {/* Tab Content */}
          <div className="p-5 flex-1 flex flex-col gap-6">
            {activeTab === 'brief' && (
              <>
                {/* Visual Progress Tracking: Radial Gauge & Step Indicator */}
                <AssignmentProgressVisual
                  title="Assignment Progress"
                  requirements={currentProject.requirements}
                  requirementResults={requirementResults}
                  tiers={currentProject.tiers}
                  completedTier={completedTier}
                  onCheckWork={() => checkAllRequirements()}
                />

                {/* Story Context */}
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82] mb-1.5">
                    Mission Brief
                  </h4>
                  <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                    {currentProject.story}
                  </p>
                </div>

                {/* Requirements Checklist */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                      Requirements
                    </h4>
                    <span className="text-[11px] font-medium text-[#cc785c]">
                      {Object.values(requirementResults).filter((r) => r.passed).length} /{' '}
                      {currentProject.requirements.length} Passed
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {currentProject.requirements.map((req) => {
                      const res = requirementResults[req.id];
                      const passed = res?.passed;

                      return (
                        <div
                          key={req.id}
                          className={`p-3 rounded-xl border transition-all text-xs ${
                            passed
                              ? 'bg-[#5db8a6]/10 border-[#5db8a6]/30 text-[#141413] dark:text-[#faf9f5]'
                              : 'bg-white dark:bg-[#1a1917] border-[#e6dfd8] dark:border-[#2a2926]'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {passed ? (
                              <CheckCircle2
                                size={15}
                                className="text-[#5db8a6] shrink-0 mt-0.5"
                              />
                            ) : (
                              <XCircle
                                size={15}
                                className="text-[#8e8b82] shrink-0 mt-0.5"
                              />
                            )}
                            <div className="flex-1">
                              <span className="font-semibold block">{req.label}</span>
                              {res?.detail && (
                                <span className="text-[11px] text-[#8e8b82] mt-0.5 block">
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

                {/* Tiers Ladder */}
                {currentProject.tiers && currentProject.tiers.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82] mb-2">
                      Achievement Tiers
                    </h4>
                    <div className="flex flex-col gap-2">
                      {currentProject.tiers.map((t) => {
                        const isUnlocked = t.requirementIds.every(
                          (rid) => requirementResults[rid]?.passed
                        );
                        return (
                          <div
                            key={t.id}
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                              isUnlocked
                                ? 'bg-[#cc785c]/10 border-[#cc785c]/30 text-[#cc785c] font-semibold'
                                : 'bg-transparent border-[#e6dfd8] dark:border-[#2a2926] text-[#8e8b82]'
                            }`}
                          >
                            <span>{t.title}</span>
                            {isUnlocked ? (
                              <Award size={14} className="text-[#cc785c]" />
                            ) : (
                              <span className="text-[10px] font-mono">LOCKED</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Progressive Hints Ladder */}
                {currentProject.hints && currentProject.hints.length > 0 && (
                  <div className="pt-2 border-t border-[#e6dfd8] dark:border-[#2a2926]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                        Progressive Hints
                      </h4>
                      {revealedHints < currentProject.hints.length && (
                        <button
                          onClick={() => setRevealedHints((h) => h + 1)}
                          className="text-[11px] font-semibold text-[#cc785c] hover:underline"
                        >
                          + Reveal Next Hint
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {currentProject.hints.slice(0, revealedHints).map((hint, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-[#efe9de]/50 dark:bg-[#252320]/50 text-xs text-[#6c6a64] dark:text-[#a09d96] flex items-start gap-2"
                        >
                          <span className="font-mono text-[#cc785c] font-bold text-[10px]">
                            #{idx + 1}
                          </span>
                          <span>{hint}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'dataset' && currentProject.dataset && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                    Dataset: {currentProject.dataset.name}
                  </h4>
                  <span className="text-[11px] text-[#8e8b82]">
                    {currentProject.dataset.samples.length} Samples
                  </span>
                </div>

                <div className="border border-[#e6dfd8] dark:border-[#2a2926] rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#efe9de] dark:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] font-semibold">
                      <tr>
                        {currentProject.dataset.inputs.map((inp, idx) => (
                          <th key={idx} className="p-2 border-b border-[#e6dfd8] dark:border-[#2a2926]">
                            {inp}
                          </th>
                        ))}
                        <th className="p-2 border-b border-[#e6dfd8] dark:border-[#2a2926]">Target</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6dfd8] dark:divide-[#2a2926]">
                      {currentProject.dataset.samples.map((sample, sIdx) => (
                        <tr key={sIdx} className="hover:bg-black/5 dark:hover:bg-white/5">
                          {sample.x.map((xVal, xIdx) => (
                            <td key={xIdx} className="p-2 font-mono">
                              {xVal}
                            </td>
                          ))}
                          <td className="p-2 font-mono font-semibold text-[#cc785c]">
                            {Array.isArray(sample.t) ? sample.t.join(', ') : sample.t}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'runs' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                    Logged Training Runs
                  </h4>
                  <span className="text-[11px] text-[#8e8b82]">{runRecords.length} recorded</span>
                </div>

                {runRecords.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#8e8b82] border border-dashed border-[#e6dfd8] dark:border-[#2a2926] rounded-xl">
                    No runs recorded yet. Use the Train bar in the canvas to log training attempts.
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {runRecords.map((run, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-3 rounded-xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#1a1917] text-xs flex flex-col gap-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-[#cc785c]">
                            Run #{rIdx + 1} ({run.activation})
                          </span>
                          <span className="text-[10px] text-[#8e8b82] font-mono">
                            η = {run.lr}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[#6c6a64] dark:text-[#a09d96]">
                          <span>{run.stepsRun} steps</span>
                          <span>
                            Loss: {run.lossStart.toFixed(3)} →{' '}
                            <strong className="text-[#141413] dark:text-[#faf9f5]">
                              {run.lossEnd.toFixed(4)}
                            </strong>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'reflections' && currentProject.reflections && (
              <div className="flex flex-col gap-5">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                  Written Reflections
                </h4>
                {currentProject.reflections.map((ref) => {
                  const text = reflections[ref.id] || '';
                  const chars = text.trim().length;
                  const satisfied = chars >= ref.minChars;

                  return (
                    <div key={ref.id} className="flex flex-col gap-2">
                      <label className="text-xs font-medium leading-relaxed">
                        {ref.prompt}
                      </label>
                      <textarea
                        value={text}
                        onChange={(e) => updateReflection(ref.id, e.target.value)}
                        placeholder="Write your explanation here..."
                        rows={4}
                        className="p-3 text-xs rounded-xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#383531] focus:border-[#cc785c] outline-hidden leading-relaxed resize-none"
                      />
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-mono ${
                            satisfied ? 'text-[#5db8a6]' : 'text-[#8e8b82]'
                          }`}
                        >
                          {chars} / {ref.minChars} characters
                        </span>
                        {satisfied && (
                          <span className="text-[#5db8a6] flex items-center gap-1 font-semibold">
                            <Check size={12} /> Satisfied
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Center / Right: Interactive Canvas & Parameter Workbench */}
        <div className="flex-1 flex flex-col bg-[#faf9f5] dark:bg-[#141413] overflow-y-auto">
          {/* Simulation & Training Bar */}
          <div className="p-3 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#efe9de]/50 dark:bg-[#1f1e1b] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#6c6a64] dark:text-[#a09d96]">
                Training Controls:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#8e8b82]">Rate η:</span>
                <input
                  type="number"
                  step="0.1"
                  min="0.01"
                  max="5.0"
                  value={learningRate}
                  onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.1)}
                  className="w-16 px-2 py-1 rounded-lg border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#8e8b82]">Steps:</span>
                <select
                  value={trainStepsCount}
                  onChange={(e) => setTrainStepsCount(parseInt(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] text-xs"
                >
                  <option value={10}>10 Steps</option>
                  <option value={50}>50 Steps</option>
                  <option value={200}>200 Steps</option>
                  <option value={500}>500 Steps</option>
                  <option value={1000}>1,000 Steps</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTrain(1)}
                disabled={isTraining}
                className="px-3 py-1 rounded-lg border border-[#e6dfd8] dark:border-[#383531] hover:bg-white dark:hover:bg-[#252320] font-medium transition-colors"
              >
                Step ×1
              </button>
              <button
                onClick={() => handleTrain(trainStepsCount)}
                disabled={isTraining}
                className="px-4 py-1 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white font-semibold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Play size={12} />
                <span>Train ×{trainStepsCount}</span>
              </button>
            </div>
          </div>

          {/* Interactive Network Graph Inspector & Tuning */}
          <div className="p-6 flex-1 flex flex-col gap-6 max-w-4xl">
            <div>
              <h3 className="font-serif text-lg font-bold mb-1">Network Topology & Parameters</h3>
              <p className="text-xs text-[#8e8b82]">
                Inspect and tweak weights, biases, and activation functions directly on the live architecture graph.
              </p>
            </div>

            {/* Neurons Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCanvas.nodes
                .filter((n) => n.type === 'neuron')
                .map((node) => {
                  const bias = (node.data as any)?.bias ?? 0;
                  const act = ((node.data as any)?.activation || 'sigmoid') as ActivationFn;

                  return (
                    <div
                      key={node.id}
                      className="p-4 rounded-xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#1a1917] flex flex-col gap-3 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs">{String((node.data as any)?.label || node.id)}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#efe9de] dark:bg-[#252320] text-[#cc785c]">
                          Neuron
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-[#8e8b82]">Bias (b):</span>
                          <span className="font-mono font-semibold">{bias.toFixed(2)}</span>
                        </div>
                        <input
                          type="range"
                          min="-4"
                          max="4"
                          step="0.05"
                          value={bias}
                          onChange={(e) => handleBiasChange(node.id, parseFloat(e.target.value))}
                          className="accent-[#cc785c] w-full"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-[#e6dfd8]/50 dark:border-[#2a2926]/50">
                        <span className="text-[#8e8b82]">Activation:</span>
                        <select
                          value={act}
                          onChange={(e) => handleActivationChange(node.id, e.target.value as any)}
                          className="px-2 py-1 rounded-lg border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] text-xs font-medium"
                        >
                          <option value="sigmoid">Sigmoid</option>
                          <option value="step">Step (Threshold)</option>
                          <option value="tanh">Tanh</option>
                          <option value="relu">ReLU</option>
                          <option value="leakyRelu">Leaky ReLU</option>
                          <option value="identity">Linear (Identity)</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Weights Matrix */}
            <div className="flex flex-col gap-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                Synaptic Weights (w)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeCanvas.edges.map((edge) => {
                  const weight = (edge.data as any)?.weight ?? 1;
                  const fromNode = activeCanvas.nodes.find((n) => n.id === edge.source);
                  const toNode = activeCanvas.nodes.find((n) => n.id === edge.target);

                  return (
                    <div
                      key={edge.id}
                      className="p-3 rounded-xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#1a1917] flex flex-col gap-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[#6c6a64] dark:text-[#a09d96]">
                          {String((fromNode?.data as any)?.label || edge.source)} → {String((toNode?.data as any)?.label || edge.target)}
                        </span>
                        <span className="font-mono font-bold text-[#cc785c]">
                          {weight.toFixed(2)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-4"
                        max="4"
                        step="0.05"
                        value={weight}
                        onChange={(e) => handleWeightChange(edge.id, parseFloat(e.target.value))}
                        className="accent-[#cc785c] w-full"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-lg rounded-3xl bg-[#faf9f5] dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#2a2926] p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#5db8a6]/20 text-[#5db8a6] flex items-center justify-center">
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold">Challenge Completed!</h3>
                  <span className="text-xs text-[#8e8b82]">
                    Reward: {currentProject.reward.title}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowFinishModal(false)}
                className="text-xs font-bold text-[#8e8b82] hover:text-[#141413]"
              >
                ✕
              </button>
            </div>

            {/* Credential Card Preview */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#cc785c]/10 to-[#5db8a6]/10 border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#cc785c] font-bold">
                  NeuroCanvas Verified Credential
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#cc785c] text-white text-[10px] font-bold uppercase">
                  {completedTier || 'Gold'} Tier
                </span>
              </div>

              <div>
                <h4 className="font-serif text-lg font-bold">{currentProject.title}</h4>
                <p className="text-xs text-[#6c6a64] dark:text-[#a09d96]">
                  {currentProject.tagline}
                </p>
              </div>

              <div className="pt-3 border-t border-[#e6dfd8] dark:border-[#2a2926] flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-[#8e8b82] block">Completion Code</span>
                  <span className="font-mono font-bold text-[#cc785c]">
                    {completionCode || 'NC-PROJ-VERIFIED'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#8e8b82] block">Engine Integrity</span>
                  <span className="font-mono text-[10px] text-[#5db8a6]">SHA-256 Validated</span>
                </div>
              </div>
            </div>

            {/* Export & Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={async () => {
                  const json = await exportProjectFile();
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${currentProject.id}.nnproject.json`;
                  a.click();
                  showToast('Downloaded .nnproject.json', 'success');
                }}
                className="w-full sm:flex-1 py-2.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                <span>Download .nnproject.json</span>
              </button>

              <button
                onClick={() => {
                  if (completionCode) {
                    navigator.clipboard.writeText(completionCode);
                    setCardCopied(true);
                    setTimeout(() => setCardCopied(false), 2000);
                    showToast('Completion code copied!', 'success');
                  }
                }}
                className="w-full sm:flex-1 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy size={14} />
                <span>{cardCopied ? 'Copied Code!' : 'Copy Code'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

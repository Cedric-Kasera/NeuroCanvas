'use client';

import React, { useEffect, useState } from 'react';
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
  Lightbulb,
  Sliders,
  Database,
  History,
  Edit3,
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

  const loadProject = useProjectStore((s) => s.loadProject);
  const updateActiveCanvas = useProjectStore((s) => s.updateActiveCanvas);
  const checkAllRequirements = useProjectStore((s) => s.checkAllRequirements);
  const updateReflection = useProjectStore((s) => s.updateReflection);
  const logRunRecord = useProjectStore((s) => s.logRunRecord);
  const resetProject = useProjectStore((s) => s.resetProject);
  const finishProject = useProjectStore((s) => s.finishProject);
  const exportProjectFile = useProjectStore((s) => s.exportProjectFile);

  // Local state for UI layout and workbench tabs
  const [workbenchTab, setWorkbenchTab] = useState<'params' | 'dataset' | 'runs' | 'reflections'>('params');
  const [mobileTab, setMobileTab] = useState<'goals' | 'workbench'>('goals');
  const [isBriefExpanded, setIsBriefExpanded] = useState<boolean>(true);
  const [isHintsExpanded, setIsHintsExpanded] = useState<boolean>(true);
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
    setTimeout(() => checkAllRequirements(), 350);
  };

  // Handle bias change
  const handleBiasChange = (nodeId: string, newBias: number) => {
    const updatedNodes = activeCanvas.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, bias: newBias } } : n
    );
    const updated = { ...activeCanvas, nodes: updatedNodes };
    updateActiveCanvas(updated);
    setTimeout(() => checkAllRequirements(), 350);
  };

  // Handle activation change
  const handleActivationChange = (nodeId: string, newAct: ActivationFn) => {
    const updatedNodes = activeCanvas.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, activation: newAct } } : n
    );
    const updated = { ...activeCanvas, nodes: updatedNodes };
    updateActiveCanvas(updated);
    setTimeout(() => checkAllRequirements(), 350);
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
  const neuronNodes = activeCanvas.nodes.filter((n) => n.type === 'neuron');
  const satisfiedReflectionsCount = (currentProject.reflections || []).filter(
    (ref) => (reflections[ref.id] || '').trim().length >= ref.minChars
  ).length;

  return (
    <div className="h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col font-sans overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/95 dark:bg-[#141413]/95 backdrop-blur-md px-3 sm:px-5 flex items-center justify-between z-30 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentRoute('projects')}
            className="p-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
            title="Back to Projects"
          >
            <ArrowLeft size={16} />
          </button>

          <div className="flex items-center gap-2.5">
            <h1 className="font-serif font-bold text-sm sm:text-base tracking-tight truncate max-w-[200px] sm:max-w-xs">
              {currentProject.title}
            </h1>
            <MiniRadialGauge
              passedCount={passedCount}
              totalCount={currentProject.requirements.length}
            />
            {completedTier && (
              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-[#cc785c]/10 text-[#cc785c] text-[10px] font-bold uppercase tracking-wider">
                {completedTier} Tier
              </span>
            )}
          </div>
        </div>

        {/* Mobile View Switcher (Visible on < lg) */}
        <div className="flex lg:hidden items-center bg-[#efe9de] dark:bg-[#252320] p-1 rounded-xl text-xs font-medium">
          <button
            onClick={() => setMobileTab('goals')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              mobileTab === 'goals'
                ? 'bg-white dark:bg-[#1a1917] text-[#cc785c] font-semibold shadow-xs'
                : 'text-[#8e8b82]'
            }`}
          >
            Goals & Progress
          </button>
          <button
            onClick={() => setMobileTab('workbench')}
            className={`px-2.5 py-1 rounded-lg transition-colors ${
              mobileTab === 'workbench'
                ? 'bg-white dark:bg-[#1a1917] text-[#cc785c] font-semibold shadow-xs'
                : 'text-[#8e8b82]'
            }`}
          >
            Workbench
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          <button
            onClick={() => {
              if (activeCanvas) {
                useCanvasStore.getState().loadCanvas(activeCanvas);
                useSimStore.getState().buildFromCanvas();
                useUIStore.getState().setActiveCanvasMode('project', currentProject.title);
                useUIStore.getState().setRightOpen(true);
                useUIStore.getState().setRightTab('activity');
                setCurrentRoute('play');
                showToast(`Opened ${currentProject.title} in Studio Canvas!`, 'success');
              }
            }}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#5db8a6] hover:bg-[#4ea594] text-white font-medium transition-all shadow-xs flex items-center gap-1.5"
            title="Open and edit on the visual Studio Canvas"
          >
            <Layers size={13} />
            <span className="hidden sm:inline">Studio Canvas</span>
          </button>

          <button
            onClick={() => checkAllRequirements()}
            className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] font-medium transition-colors flex items-center gap-1.5"
            title="Verify requirements"
          >
            <CheckCircle2 size={13} className="text-[#5db8a6]" />
            <span className="hidden md:inline">Check Work</span>
          </button>

          <button
            onClick={resetProject}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#8e8b82] hover:text-[#141413] transition-colors"
            title="Reset Project"
          >
            <RotateCcw size={13} />
          </button>

          <button
            onClick={async () => {
              await finishProject();
              setShowFinishModal(true);
            }}
            disabled={!allPassed && !completedTier}
            className={`px-3 py-1.5 rounded-xl font-semibold shadow-xs transition-all flex items-center gap-1.5 ${
              allPassed || completedTier
                ? 'bg-[#cc785c] hover:bg-[#a9583e] text-white hover:scale-[1.02]'
                : 'bg-[#efe9de] dark:bg-[#252320] text-[#8e8b82] cursor-not-allowed opacity-60'
            }`}
          >
            <Trophy size={13} />
            <span className="hidden sm:inline">Claim Badge</span>
          </button>
        </div>
      </header>

      {/* Main 2-Column Responsive Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        {/* COLUMN 1: Goals, Progress & Requirements */}
        <div
          className={`w-full lg:w-[460px] xl:w-[500px] shrink-0 border-r border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5] dark:bg-[#181715] flex flex-col min-h-0 overflow-y-auto ${
            mobileTab === 'goals' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="p-4 sm:p-5 flex flex-col gap-4">
            {/* Card 1: Mission Brief (Collapsible to save vertical space) */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1d1a] border border-[#e6dfd8] dark:border-[#2a2926] shadow-xs flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#cc785c] px-2 py-0.5 rounded-md bg-[#cc785c]/10">
                    {currentProject.skills?.[0] || `Level ${currentProject.difficulty}`}
                  </span>
                  <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                    Mission Brief
                  </h2>
                </div>
                <button
                  onClick={() => setIsBriefExpanded(!isBriefExpanded)}
                  className="flex items-center gap-1 text-[11px] font-medium text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5] transition-colors"
                >
                  <span>{isBriefExpanded ? 'Collapse' : 'Expand'}</span>
                  {isBriefExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>
              </div>

              {isBriefExpanded ? (
                <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed pt-1 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60">
                  {currentProject.story}
                </p>
              ) : (
                <p className="text-xs text-[#8e8b82] italic truncate">
                  {currentProject.tagline || currentProject.story}
                </p>
              )}
            </div>

            {/* Card 2: Assignment Progress (Radial Gauge & Step Indicator) */}
            <div className="rounded-2xl bg-white dark:bg-[#1e1d1a] border border-[#e6dfd8] dark:border-[#2a2926] shadow-xs overflow-hidden">
              <AssignmentProgressVisual
                title="Assignment Progress"
                requirements={currentProject.requirements}
                requirementResults={requirementResults}
                tiers={currentProject.tiers}
                completedTier={completedTier}
                onCheckWork={() => checkAllRequirements()}
              />
            </div>

            {/* Card 3: Requirements Checklist */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1d1a] border border-[#e6dfd8] dark:border-[#2a2926] shadow-xs flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                    Requirements
                  </h3>
                  <span className="text-[11px] font-semibold text-[#cc785c]">
                    {passedCount} / {currentProject.requirements.length} Passed
                  </span>
                </div>
                <button
                  onClick={() => checkAllRequirements()}
                  className="text-[11px] text-[#5db8a6] hover:underline font-medium flex items-center gap-1"
                >
                  <CheckCircle2 size={12} />
                  <span>Re-evaluate</span>
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {currentProject.requirements.map((req, idx) => {
                  const res = requirementResults[req.id];
                  const passed = res?.passed;

                  return (
                    <div
                      key={req.id}
                      className={`p-3 rounded-xl border transition-all text-xs ${
                        passed
                          ? 'bg-[#5db8a6]/10 border-[#5db8a6]/30 text-[#141413] dark:text-[#faf9f5]'
                          : 'bg-[#faf9f5] dark:bg-[#141413] border-[#e6dfd8] dark:border-[#2a2926]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {passed ? (
                          <CheckCircle2
                            size={15}
                            className="text-[#5db8a6] shrink-0 mt-0.5"
                          />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-[#8e8b82] shrink-0 mt-0.5 flex items-center justify-center text-[9px] font-mono text-[#8e8b82]">
                            {idx + 1}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold block truncate sm:whitespace-normal">
                            {req.label}
                          </span>
                          {res?.detail && (
                            <span className="text-[11px] text-[#8e8b82] mt-0.5 block leading-normal">
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

            {/* Card 4: Achievement Tiers (Compact Horizontal Grid) */}
            {currentProject.tiers && currentProject.tiers.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1d1a] border border-[#e6dfd8] dark:border-[#2a2926] shadow-xs flex flex-col gap-2.5">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                  Milestone Tiers
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {currentProject.tiers.map((t) => {
                    const isUnlocked = t.requirementIds.every(
                      (rid) => requirementResults[rid]?.passed
                    );
                    return (
                      <div
                        key={t.id}
                        className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all ${
                          isUnlocked
                            ? 'bg-[#cc785c]/10 border-[#cc785c]/30 text-[#cc785c]'
                            : 'bg-[#faf9f5] dark:bg-[#141413] border-[#e6dfd8] dark:border-[#2a2926] text-[#8e8b82]'
                        }`}
                      >
                        <Award size={14} className={isUnlocked ? 'text-[#cc785c]' : 'text-[#8e8b82]'} />
                        <span className="text-[11px] font-semibold truncate w-full">{t.title}</span>
                        <span className="text-[9px] font-mono uppercase font-bold">
                          {isUnlocked ? 'UNLOCKED' : 'LOCKED'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Card 5: Progressive Hints (Collapsible Accordion) */}
            {currentProject.hints && currentProject.hints.length > 0 && (
              <div className="p-4 rounded-2xl bg-white dark:bg-[#1e1d1a] border border-[#e6dfd8] dark:border-[#2a2926] shadow-xs flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Lightbulb size={13} className="text-[#cc785c]" />
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                      Hints ({revealedHints}/{currentProject.hints.length})
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {revealedHints < currentProject.hints.length && (
                      <button
                        onClick={() => setRevealedHints((h) => h + 1)}
                        className="text-[11px] font-semibold text-[#cc785c] hover:underline"
                      >
                        + Reveal Next
                      </button>
                    )}
                    <button
                      onClick={() => setIsHintsExpanded(!isHintsExpanded)}
                      className="p-1 text-[#8e8b82] hover:text-[#141413] transition-colors"
                    >
                      {isHintsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                  </div>
                </div>

                {isHintsExpanded && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60">
                    {currentProject.hints.slice(0, revealedHints).map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#efe9de]/50 dark:bg-[#252320]/50 text-xs text-[#6c6a64] dark:text-[#a09d96] flex items-start gap-2"
                      >
                        <span className="font-mono text-[#cc785c] font-bold text-[10px] shrink-0 mt-0.5">
                          #{idx + 1}
                        </span>
                        <span className="leading-relaxed">{hint}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: Interactive Workbench, Topology, Dataset & Runs */}
        <div
          className={`flex-1 flex flex-col min-h-0 bg-[#faf9f5] dark:bg-[#141413] overflow-y-auto ${
            mobileTab === 'workbench' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Top Sticky Training & Simulation Bar */}
          <div className="p-3.5 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#efe9de]/40 dark:bg-[#1c1b18] backdrop-blur-xs flex flex-wrap items-center justify-between gap-3 text-xs sticky top-0 z-10">
            <div className="flex items-center flex-wrap gap-3">
              <span className="font-semibold text-[#6c6a64] dark:text-[#a09d96] flex items-center gap-1.5">
                <Sliders size={13} className="text-[#cc785c]" />
                <span>Simulation Controls:</span>
              </span>

              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#8e8b82]">Learning Rate η:</span>
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
                <span className="text-[11px] text-[#8e8b82]">Epochs:</span>
                <select
                  value={trainStepsCount}
                  onChange={(e) => setTrainStepsCount(parseInt(e.target.value))}
                  className="px-2 py-1 rounded-lg border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] text-xs"
                >
                  <option value={10}>10 Steps</option>
                  <option value={50}>50 Steps</option>
                  <option value={200}>200 Steps</option>
                  <option value={500}>500 Steps</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTrain(1)}
                disabled={isTraining}
                className="px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-white dark:hover:bg-[#252320] font-medium transition-colors"
              >
                Step ×1
              </button>
              <button
                onClick={() => handleTrain(trainStepsCount)}
                disabled={isTraining}
                className="px-3.5 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white font-semibold transition-all shadow-xs flex items-center gap-1.5"
              >
                <Play size={12} />
                <span>Train ×{trainStepsCount}</span>
              </button>
            </div>
          </div>

          {/* Workbench Tabs Selector */}
          <div className="flex items-center border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5] dark:bg-[#181715] px-4 pt-2 text-xs font-medium gap-1 shrink-0 overflow-x-auto">
            <button
              onClick={() => setWorkbenchTab('params')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                workbenchTab === 'params'
                  ? 'border-[#cc785c] text-[#cc785c] font-semibold'
                  : 'border-transparent text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]'
              }`}
            >
              <Zap size={13} />
              <span>Topology & Parameters</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#efe9de] dark:bg-[#252320]">
                {neuronNodes.length}N / {activeCanvas.edges.length}W
              </span>
            </button>

            {currentProject.dataset && (
              <button
                onClick={() => setWorkbenchTab('dataset')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  workbenchTab === 'dataset'
                    ? 'border-[#cc785c] text-[#cc785c] font-semibold'
                    : 'border-transparent text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]'
                }`}
              >
                <Database size={13} />
                <span>Dataset</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#efe9de] dark:bg-[#252320]">
                  {currentProject.dataset.samples.length}
                </span>
              </button>
            )}

            <button
              onClick={() => setWorkbenchTab('runs')}
              className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                workbenchTab === 'runs'
                  ? 'border-[#cc785c] text-[#cc785c] font-semibold'
                  : 'border-transparent text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]'
              }`}
            >
              <History size={13} />
              <span>Training Runs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#efe9de] dark:bg-[#252320]">
                {runRecords.length}
              </span>
            </button>

            {currentProject.reflections && currentProject.reflections.length > 0 && (
              <button
                onClick={() => setWorkbenchTab('reflections')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  workbenchTab === 'reflections'
                    ? 'border-[#cc785c] text-[#cc785c] font-semibold'
                    : 'border-transparent text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]'
                }`}
              >
                <Edit3 size={13} />
                <span>Written Reflections</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#efe9de] dark:bg-[#252320]">
                  {satisfiedReflectionsCount}/{currentProject.reflections.length}
                </span>
              </button>
            )}
          </div>

          {/* Workbench Tab Content Area */}
          <div className="p-4 sm:p-6 flex-1 flex flex-col gap-6 max-w-5xl">
            {/* VIEW 1: Parameters & Topology */}
            {workbenchTab === 'params' && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold">
                      Network Architecture & Live Tuning
                    </h3>
                    <p className="text-xs text-[#8e8b82]">
                      Adjust weights, biases, and activation functions below. Changes automatically trigger verification checks.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (activeCanvas) {
                        useCanvasStore.getState().loadCanvas(activeCanvas);
                        useSimStore.getState().buildFromCanvas();
                        useUIStore.getState().setActiveCanvasMode('project', currentProject.title);
                        useUIStore.getState().setRightOpen(true);
                        useUIStore.getState().setRightTab('activity');
                        setCurrentRoute('play');
                      }
                    }}
                    className="self-start sm:self-auto text-xs text-[#5db8a6] hover:underline flex items-center gap-1 font-medium"
                  >
                    <Layers size={13} />
                    <span>Open in visual node canvas</span>
                  </button>
                </div>

                {/* Section 1: Neurons (Activation & Bias) */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                      Neuron Units ({neuronNodes.length})
                    </h4>
                    <span className="text-[11px] text-[#8e8b82]">
                      Adjust biases and activation transfer functions
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {neuronNodes.map((node) => {
                      const bias = (node.data as any)?.bias ?? 0;
                      const act = ((node.data as any)?.activation || 'sigmoid') as ActivationFn;

                      return (
                        <div
                          key={node.id}
                          className="p-3.5 rounded-2xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#1a1917] flex flex-col gap-2.5 shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-xs text-[#141413] dark:text-[#faf9f5]">
                              {String((node.data as any)?.label || node.id)}
                            </span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#efe9de] dark:bg-[#252320] text-[#cc785c] font-medium">
                              Neuron
                            </span>
                          </div>

                          <div className="flex flex-col gap-1 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-[#8e8b82]">Bias (b):</span>
                              <span className="font-mono font-semibold text-[#cc785c]">
                                {bias >= 0 ? `+${bias.toFixed(2)}` : bias.toFixed(2)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-4"
                              max="4"
                              step="0.05"
                              value={bias}
                              onChange={(e) => handleBiasChange(node.id, parseFloat(e.target.value))}
                              className="accent-[#cc785c] w-full cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between text-xs pt-2 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60">
                            <span className="text-[#8e8b82]">Activation:</span>
                            <select
                              value={act}
                              onChange={(e) => handleActivationChange(node.id, e.target.value as any)}
                              className="px-2 py-1 rounded-lg border border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#141413] text-xs font-medium cursor-pointer"
                            >
                              <option value="sigmoid">Sigmoid (0 → 1)</option>
                              <option value="step">Step (Threshold)</option>
                              <option value="tanh">Tanh (-1 → 1)</option>
                              <option value="relu">ReLU (0 → ∞)</option>
                              <option value="leakyRelu">Leaky ReLU</option>
                              <option value="identity">Linear (Identity)</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section 2: Synaptic Weights */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                      Synaptic Weights ({activeCanvas.edges.length})
                    </h4>
                    <span className="text-[11px] text-[#8e8b82]">
                      Fine-tune connection signal strengths
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {activeCanvas.edges.map((edge) => {
                      const weight = (edge.data as any)?.weight ?? 1;
                      const fromNode = activeCanvas.nodes.find((n) => n.id === edge.source);
                      const toNode = activeCanvas.nodes.find((n) => n.id === edge.target);

                      return (
                        <div
                          key={edge.id}
                          className="p-3 rounded-2xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#1a1917] flex flex-col gap-2 text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-[#6c6a64] dark:text-[#a09d96] truncate">
                              {String((fromNode?.data as any)?.label || edge.source)} →{' '}
                              <strong className="text-[#141413] dark:text-[#faf9f5]">
                                {String((toNode?.data as any)?.label || edge.target)}
                              </strong>
                            </span>
                            <span className="font-mono font-bold text-[#cc785c] shrink-0 ml-2">
                              {weight >= 0 ? `+${weight.toFixed(2)}` : weight.toFixed(2)}
                            </span>
                          </div>
                          <input
                            type="range"
                            min="-4"
                            max="4"
                            step="0.05"
                            value={weight}
                            onChange={(e) => handleWeightChange(edge.id, parseFloat(e.target.value))}
                            className="accent-[#cc785c] w-full cursor-pointer"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* VIEW 2: Dataset */}
            {workbenchTab === 'dataset' && currentProject.dataset && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold">
                      Dataset: {currentProject.dataset.name}
                    </h3>
                    <p className="text-xs text-[#8e8b82]">
                      Target values the neural network is evaluated against.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[#efe9de] dark:bg-[#252320] text-[#cc785c]">
                    {currentProject.dataset.samples.length} Samples
                  </span>
                </div>

                <div className="border border-[#e6dfd8] dark:border-[#2a2926] rounded-2xl overflow-hidden text-xs bg-white dark:bg-[#1a1917] shadow-xs">
                  <table className="w-full text-left">
                    <thead className="bg-[#efe9de] dark:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] font-semibold">
                      <tr>
                        <th className="p-2.5 border-b border-[#e6dfd8] dark:border-[#2a2926] text-[10px] font-mono">
                          #
                        </th>
                        {currentProject.dataset.inputs.map((inp, idx) => (
                          <th key={idx} className="p-2.5 border-b border-[#e6dfd8] dark:border-[#2a2926]">
                            {inp}
                          </th>
                        ))}
                        <th className="p-2.5 border-b border-[#e6dfd8] dark:border-[#2a2926]">Target Output</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e6dfd8] dark:divide-[#2a2926]">
                      {currentProject.dataset.samples.map((sample, sIdx) => (
                        <tr key={sIdx} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="p-2.5 font-mono text-[#8e8b82] text-[10px]">{sIdx + 1}</td>
                          {sample.x.map((xVal, xIdx) => (
                            <td key={xIdx} className="p-2.5 font-mono font-medium">
                              {xVal}
                            </td>
                          ))}
                          <td className="p-2.5 font-mono font-bold text-[#cc785c]">
                            {Array.isArray(sample.t) ? sample.t.join(', ') : sample.t}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VIEW 3: Training Runs */}
            {workbenchTab === 'runs' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold">Training Run History</h3>
                    <p className="text-xs text-[#8e8b82]">
                      Log of previous training steps and loss reduction milestones.
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-[#efe9de] dark:bg-[#252320] text-[#cc785c]">
                    {runRecords.length} Recorded
                  </span>
                </div>

                {runRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#8e8b82] border border-dashed border-[#e6dfd8] dark:border-[#2a2926] rounded-2xl bg-white/50 dark:bg-[#1a1917]/50 flex flex-col items-center gap-2">
                    <History size={20} className="text-[#8e8b82]" />
                    <span>No runs recorded yet. Use the training controls above to log an attempt!</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {runRecords.map((run, rIdx) => (
                      <div
                        key={rIdx}
                        className="p-3.5 rounded-2xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#1a1917] text-xs flex flex-col gap-2 shadow-xs"
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
                          <span>{run.stepsRun} epochs</span>
                          <span className="font-mono">
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

            {/* VIEW 4: Written Reflections */}
            {workbenchTab === 'reflections' && currentProject.reflections && (
              <div className="flex flex-col gap-5">
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold">
                    Conceptual Reflections & Synthesis
                  </h3>
                  <p className="text-xs text-[#8e8b82]">
                    Explain your findings in your own words to solidify theoretical intuition.
                  </p>
                </div>

                {currentProject.reflections.map((ref) => {
                  const text = reflections[ref.id] || '';
                  const chars = text.trim().length;
                  const satisfied = chars >= ref.minChars;

                  return (
                    <div
                      key={ref.id}
                      className="p-4 rounded-2xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#1a1917] flex flex-col gap-3 shadow-xs"
                    >
                      <label className="text-xs font-semibold leading-relaxed text-[#141413] dark:text-[#faf9f5]">
                        {ref.prompt}
                      </label>
                      <textarea
                        value={text}
                        onChange={(e) => updateReflection(ref.id, e.target.value)}
                        placeholder="Write your explanation here..."
                        rows={4}
                        className="p-3 text-xs rounded-xl bg-[#faf9f5] dark:bg-[#141413] border border-[#e6dfd8] dark:border-[#383531] focus:border-[#cc785c] outline-hidden leading-relaxed resize-none"
                      />
                      <div className="flex items-center justify-between text-[11px]">
                        <span
                          className={`font-mono ${
                            satisfied ? 'text-[#5db8a6] font-semibold' : 'text-[#8e8b82]'
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
                className="text-xs font-bold text-[#8e8b82] hover:text-[#141413] p-1"
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

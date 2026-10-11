'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  Play,
  RotateCcw,
  Copy,
  Download,
  Layers,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { useSimStore } from '@/lib/state/simStore';
import { AppLogo } from '@/components/ui/AppLogo';
import LZString from 'lz-string';
import { checkRequirement, computeIntegrityHash, generateCompletionCode } from '@/lib/engine/projectChecks';
import { trainEpochs } from '@/lib/engine/train';
import { canvasToNetworkGraph } from '@/lib/engine/projectChecks';

export function AssignmentView() {
  const activeAssignmentPayload = useUIStore((s) => s.activeAssignmentPayload);
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const showToast = useUIStore((s) => s.showToast);

  const assignmentData = React.useMemo(() => {
    if (!activeAssignmentPayload) return null;
    try {
      const json = LZString.decompressFromEncodedURIComponent(activeAssignmentPayload);
      return json ? JSON.parse(json) : null;
    } catch {
      return null;
    }
  }, [activeAssignmentPayload]);

  const defaultStarter = React.useMemo(() => {
    if (!assignmentData) return null;
    return {
      app: 'neurocanvas',
      schemaVersion: 2,
      name: assignmentData.title,
      nodes: [
        { id: 'in_1', type: 'input', data: { label: 'x₁', inputValue: 0 } },
        { id: 'in_2', type: 'input', data: { label: 'x₂', inputValue: 0 } },
        { id: 'n_out', type: 'neuron', data: { label: 'Neuron', bias: 0.0, activation: 'sigmoid' } },
        { id: 'target', type: 'output', data: { label: 'Output', target: 0 } },
      ],
      edges: [
        { id: 'e1', source: 'in_1', target: 'n_out', data: { weight: 0.5 } },
        { id: 'e2', source: 'in_2', target: 'n_out', data: { weight: 0.5 } },
        { id: 'e3', source: 'n_out', target: 'target', data: { weight: 1.0 } },
      ],
    };
  }, [assignmentData]);

  const [customCanvas, setCustomCanvas] = useState<any>(null);
  const activeCanvas = customCanvas || defaultStarter;

  const [reflectionText, setReflectionText] = useState<string>('');
  const [learningRate, setLearningRate] = useState<number>(1.0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [completionCode, setCompletionCode] = useState<string | null>(null);

  if (!assignmentData || !activeCanvas) {
    return (
      <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] flex items-center justify-center text-xs text-[#8e8b82]">
        Loading assignment payload...
      </div>
    );
  }

  // Handle train
  const handleTrain = (steps: number) => {
    const graph = canvasToNetworkGraph(activeCanvas);
    const samples = [
      { inputs: [0, 0], target: 0 },
      { inputs: [0, 1], target: 1 },
      { inputs: [1, 0], target: 1 },
      { inputs: [1, 1], target: 0 },
    ];
    const { graph: updatedGraph, lossHistory } = trainEpochs(graph, samples, learningRate, steps);

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

    setCustomCanvas({ ...activeCanvas, nodes: newNodes, edges: newEdges });
    showToast(`Trained ×${steps} steps`, 'success');
  };

  const handleFinish = async () => {
    const rawExport = {
      app: 'neurocanvas',
      kind: 'project-result',
      schemaVersion: 1,
      project: { id: 'assignment-custom', version: 1, title: assignmentData.title },
      tier: 'gold',
      canvas: activeCanvas,
      reflections: { r_custom: reflectionText },
      createdAt: new Date().toISOString(),
    };

    const hash = await computeIntegrityHash(rawExport);
    const code = generateCompletionCode('ASSIGN', 'GOLD', hash);
    setCompletionCode(code);
    setIsFinished(true);
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col font-sans">
      {/* Top Banner Notice */}
      <div className="bg-[#cc785c] text-white px-4 py-1.5 text-xs font-semibold flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap size={14} />
          <span>Class Assignment (Distributed by teacher via share link)</span>
        </div>
        <span className="text-[10px] font-mono opacity-80">Offline Verified Mode</span>
      </div>

      {/* Top Header */}
      <header className="h-14 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/90 dark:bg-[#141413]/90 backdrop-blur-md px-4 flex items-center justify-between z-30 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentRoute('projects')}
            className="p-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96]"
          >
            <ArrowLeft size={16} />
          </button>
          <span className="font-serif font-bold text-sm sm:text-base">{assignmentData.title}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const freshCanvas = {
                app: 'neurocanvas',
                schemaVersion: 2,
                name: `${assignmentData.title} - Fresh Workspace`,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                viewport: { x: 80, y: 100, zoom: 1 },
                settings: { mode: 'beginner', snap: true, grid: true, minimap: false, precision: 2 },
                nodes: [
                  { id: 'in_1', type: 'inputNode', position: { x: 100, y: 120 }, data: { label: 'Input x₁', value: 0, inputValue: 0 } },
                  { id: 'in_2', type: 'inputNode', position: { x: 100, y: 260 }, data: { label: 'Input x₂', value: 0, inputValue: 0 } },
                  { id: 'n_out', type: 'neuronNode', position: { x: 360, y: 190 }, data: { label: 'Neuron', bias: 0.0, activation: 'sigmoid' } },
                  { id: 'target', type: 'outputNode', position: { x: 600, y: 190 }, data: { label: 'Output', target: 0 } },
                ],
                edges: [
                  { id: 'e1', source: 'in_1', target: 'n_out', data: { weight: 0.5 }, type: 'weightedEdge' },
                  { id: 'e2', source: 'in_2', target: 'n_out', data: { weight: 0.5 }, type: 'weightedEdge' },
                  { id: 'e3', source: 'n_out', target: 'target', data: { weight: 1.0 }, type: 'weightedEdge' },
                ],
                layers: [],
              };
              setCustomCanvas(freshCanvas);
              useCanvasStore.getState().loadCanvas(freshCanvas as any);
              useSimStore.getState().buildFromCanvas();
              useUIStore.getState().setActiveCanvasMode('assignment', assignmentData.title);
              useUIStore.getState().setRightOpen(true);
              useUIStore.getState().setRightTab('activity');
              setCurrentRoute('play');
              showToast('Started fresh canvas for assignment!', 'success');
            }}
            className="px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Start in a fresh new canvas for this assignment"
          >
            <RotateCcw size={13} />
            <span className="hidden sm:inline">Start Fresh Canvas</span>
            <span className="sm:hidden">New</span>
          </button>

          <button
            onClick={() => {
              if (activeCanvas) {
                useCanvasStore.getState().loadCanvas(activeCanvas);
                useSimStore.getState().buildFromCanvas();
                useUIStore.getState().setActiveCanvasMode('assignment', assignmentData.title);
                useUIStore.getState().setRightOpen(true);
                useUIStore.getState().setRightTab('activity');
                setCurrentRoute('play');
                showToast(`Opened ${assignmentData.title} in Studio Canvas!`, 'success');
              }
            }}
            className="px-3 py-1.5 rounded-xl bg-[#5db8a6] hover:bg-[#4ea594] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            title="Open in Studio Canvas with draggable cards and connection wires"
          >
            <Layers size={13} />
            <span>Work on Studio Canvas</span>
          </button>

          <button
            onClick={handleFinish}
            className="px-4 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Trophy size={13} />
            <span>Finish & Generate Code</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-6">
        {/* Instructions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-2">
          <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
            Teacher Instructions
          </h4>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] whitespace-pre-line leading-relaxed">
            {assignmentData.instructions}
          </p>
        </div>

        {/* Training Workbench */}
        <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
              Interactive Architecture
            </h4>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTrain(50)}
                className="px-3 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5"
              >
                <Play size={12} />
                <span>Train ×50</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {activeCanvas.nodes
              .filter((n: any) => n.type === 'neuron')
              .map((node: any) => (
                <div
                  key={node.id}
                  className="p-3 rounded-xl border border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5] dark:bg-[#141413] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{node.data?.label || node.id}</span>
                    <span className="font-mono text-[#cc785c]">
                      Bias: {(node.data?.bias ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-3"
                    max="3"
                    step="0.1"
                    value={node.data?.bias ?? 0}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCustomCanvas({
                        ...activeCanvas,
                        nodes: activeCanvas.nodes.map((n: any) =>
                          n.id === node.id ? { ...n, data: { ...n.data, bias: val } } : n
                        ),
                      });
                    }}
                    className="accent-[#cc785c] w-full"
                  />
                </div>
              ))}
          </div>
        </div>

        {/* Reflection */}
        {assignmentData.reflections?.[0] && (
          <div className="p-5 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-2">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
              Required Reflection
            </h4>
            <label className="text-xs font-medium">
              {assignmentData.reflections[0].prompt}
            </label>
            <textarea
              rows={3}
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Write your reflection response..."
              className="p-3 text-xs rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] focus:border-[#cc785c] outline-hidden resize-none"
            />
          </div>
        )}

        {/* Finished Result Code */}
        {isFinished && completionCode && (
          <div className="p-5 rounded-2xl bg-[#5db8a6]/15 border border-[#5db8a6]/30 flex flex-col gap-3">
            <span className="text-xs font-mono uppercase tracking-wider text-[#5db8a6] font-bold">
              ✓ Assignment Finished Authentically
            </span>
            <div className="flex items-center justify-between bg-white dark:bg-[#141413] p-3 rounded-xl border border-[#5db8a6]/40">
              <span className="font-mono text-sm font-bold text-[#cc785c]">{completionCode}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(completionCode);
                  showToast('Completion code copied!', 'success');
                }}
                className="px-3 py-1 rounded-lg bg-[#5db8a6] text-white text-xs font-semibold"
              >
                Copy Code
              </button>
            </div>
            <span className="text-[11px] text-[#8e8b82]">
              Send this completion code or export your file to your instructor.
            </span>
          </div>
        )}
      </main>
    </div>
  );
}

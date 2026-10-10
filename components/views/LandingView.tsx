'use client';

import React, { useState } from 'react';
import {
  Play,
  BookOpen,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Layers,
  Activity,
  GitBranch,
  TrendingDown,
  Sliders,
  Grid,
  Zap,
  Box,
  Compass,
  Award,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { useLessonStore } from '@/lib/state/lessonStore';
import { LESSONS } from '@/lib/content/lessons';
import { TEMPLATES } from '@/lib/content/templates';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { AppLogo } from '@/components/ui/AppLogo';

export function LandingView() {
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const startLesson = useLessonStore((s) => s.startLesson);
  const completedLessons = useLessonStore((s) => s.completedLessons);
  const loadCanvas = useCanvasStore((s) => s.loadCanvas);

  const completedCount = Object.keys(completedLessons).filter((k) => completedLessons[k]).length;

  // Interactive Hero Mini-Network Simulator (Rune Icons interactive layout style)
  const [heroX1, setHeroX1] = useState<number>(1.0);
  const [heroX2, setHeroX2] = useState<number>(0.5);
  const [heroW1, setHeroW1] = useState<number>(0.8);
  const [heroW2, setHeroW2] = useState<number>(-0.6);
  const [heroBias, setHeroBias] = useState<number>(0.2);
  const [heroActivation, setHeroActivation] = useState<'sigmoid' | 'relu' | 'tanh'>('sigmoid');
  const [heroActiveTab, setHeroActiveTab] = useState<'simulator' | 'topology' | 'calculus'>('simulator');

  // Compute live math
  const zSum = heroX1 * heroW1 + heroX2 * heroW2 + heroBias;
  let activeVal = 0;
  if (heroActivation === 'sigmoid') {
    activeVal = 1 / (1 + Math.exp(-zSum));
  } else if (heroActivation === 'relu') {
    activeVal = Math.max(0, zSum);
  } else {
    activeVal = Math.tanh(zSum);
  }

  return (
    <div className="min-h-screen w-full bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col select-none relative overflow-x-hidden overflow-y-auto font-sans">
      {/* Geometric Rune Grid Lines Background Pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] dark:opacity-[0.07] bg-[radial-gradient(#141413_1px,transparent_1px)] dark:bg-[radial-gradient(#faf9f5_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* Top Architectural Navigation Bar */}
      <header className="h-16 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/90 dark:bg-[#141413]/90 backdrop-blur-md px-6 max-w-7xl mx-auto w-full flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <AppLogo className="h-7 w-auto" />
          <div>
            <span className="font-serif text-lg font-bold tracking-tight">NeuroCanvas</span>
            <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#efe9de] dark:bg-[#252320] text-[#8e8b82]">
              v2.4 Core
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-medium">
          <button
            onClick={() => setCurrentRoute('learn')}
            className="px-3 py-1.5 rounded-lg text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413] dark:hover:text-[#faf9f5] hover:bg-[#efe9de]/50 dark:hover:bg-[#252320]/50 transition-colors flex items-center gap-1.5"
          >
            <BookOpen size={13} />
            <span>Curriculum</span>
          </button>
          <button
            onClick={() => setCurrentRoute('play')}
            className="px-3 py-1.5 rounded-lg text-[#6c6a64] dark:text-[#a09d96] hover:text-[#141413] dark:hover:text-[#faf9f5] hover:bg-[#efe9de]/50 dark:hover:bg-[#252320]/50 transition-colors flex items-center gap-1.5"
          >
            <Sparkles size={13} className="text-[#5db8a6]" />
            <span>Studio Canvas</span>
          </button>
          <button
            onClick={() => {
              startLesson('lesson-01-neuron');
              setCurrentRoute('play');
            }}
            className="px-4 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold transition-all shadow-xs flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Start Lesson 1</span>
            <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* Hero Section with Geometric Structure (Rune Icons Layout) */}
      <section className="relative pt-16 md:pt-24 pb-16 px-6 max-w-7xl mx-auto w-full">
        {/* Geometric Crosshairs on Container Edges */}
        <div className="text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#383531] text-xs font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#cc785c] animate-pulse" />
            <span className="font-mono text-[11px] text-[#6c6a64] dark:text-[#a09d96]">
              FIRST PRINCIPLES ARCHITECTURE · ZERO MAGIC BLACK BOXES
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#141413] dark:text-[#faf9f5] leading-[1.06] text-balance">
            Watch neural networks compute. Real numbers, pure calculus.
          </h1>

          <p className="max-w-2xl mx-auto text-[#6c6a64] dark:text-[#a09d96] text-base md:text-lg leading-relaxed">
            Construct deep networks on an infinite reactive canvas. Inspect every forward tensor product, trace chain-rule backpropagation, and organize layers with breathable visual frames.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
            <button
              onClick={() => {
                startLesson('lesson-01-neuron');
                setCurrentRoute('play');
              }}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white font-semibold text-sm shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <BookOpen size={16} />
              <span>Begin Guided Curriculum</span>
              <ArrowRight size={15} />
            </button>

            <button
              onClick={() => setCurrentRoute('play')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#383531] hover:border-[#cc785c] text-[#141413] dark:text-[#faf9f5] font-semibold text-sm transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <Grid size={15} className="text-[#5db8a6]" />
              <span>Open Free Canvas</span>
            </button>
          </div>

          {completedCount > 0 && (
            <div className="pt-2 text-xs text-[#5db872] flex items-center justify-center gap-1.5 font-medium">
              <CheckCircle2 size={14} />
              <span>You have completed {completedCount} of 9 lessons. Progress is saved locally in IndexedDB!</span>
            </div>
          )}
        </div>

        {/* HERO INTERACTIVE SHOWCASE MATRIX (Rune Icons style layout) */}
        <div className="mt-14 max-w-5xl mx-auto relative">
          {/* Architectural Intersection Crosses */}
          <span className="absolute -top-3 -left-3 font-mono text-xs text-[#cc785c] select-none font-bold">+</span>
          <span className="absolute -top-3 -right-3 font-mono text-xs text-[#cc785c] select-none font-bold">+</span>
          <span className="absolute -bottom-3 -left-3 font-mono text-xs text-[#cc785c] select-none font-bold">+</span>
          <span className="absolute -bottom-3 -right-3 font-mono text-xs text-[#cc785c] select-none font-bold">+</span>

          <div className="rounded-2xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#181715] shadow-xl overflow-hidden">
            {/* Header Toolbar */}
            <div className="border-b border-[#e6dfd8] dark:border-[#2a2926] px-5 py-3 flex items-center justify-between bg-[#faf9f5]/50 dark:bg-[#1f1e1b]/50">
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-[#cc785c] font-bold">● LIVE INTERACTIVE PROBE</span>
                <span className="text-[#8e8b82]">|</span>
                <span className="text-[#6c6a64] dark:text-[#a09d96]">Single Perceptron Forward Propagation</span>
              </div>

              {/* Layout Switcher Tabs */}
              <div className="flex items-center gap-1 bg-[#efe9de] dark:bg-[#252320] p-1 rounded-lg text-[11px] font-medium">
                {[
                  { id: 'simulator', label: 'Live Parameters' },
                  { id: 'topology', label: 'Topology Wireframe' },
                  { id: 'calculus', label: 'Calculus Breakdown' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setHeroActiveTab(tab.id as any)}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      heroActiveTab === tab.id
                        ? 'bg-white dark:bg-[#181715] text-[#141413] dark:text-[#faf9f5] shadow-xs font-semibold'
                        : 'text-[#6c6a64] dark:text-[#a09d96]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Simulator Body */}
            {heroActiveTab === 'simulator' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Left: Input & Weight Sliders */}
                <div className="md:col-span-5 space-y-4 text-xs bg-[#faf9f5] dark:bg-[#1f1e1b] p-4 rounded-xl border border-[#e6dfd8] dark:border-[#2a2926]">
                  <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#2a2926] pb-2">
                    <span className="font-semibold uppercase tracking-wider text-[10px] text-[#8e8b82]">
                      Live Synapse Controls
                    </span>
                    <span className="font-mono text-[#cc785c] font-bold text-[11px]">Real-time Reactivity</span>
                  </div>

                  {/* Input x1 and Weight w1 */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span>Input x₁: <b className="text-[#cc785c]">{heroX1.toFixed(2)}</b></span>
                      <span>Weight w₁: <b className="text-[#8b5cf6]">{heroW1.toFixed(2)}</b></span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="range"
                        min={-2}
                        max={2}
                        step={0.1}
                        value={heroX1}
                        onChange={(e) => setHeroX1(parseFloat(e.target.value))}
                        className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
                      />
                      <input
                        type="range"
                        min={-2}
                        max={2}
                        step={0.1}
                        value={heroW1}
                        onChange={(e) => setHeroW1(parseFloat(e.target.value))}
                        className="w-full h-1.5 accent-[#8b5cf6] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Input x2 and Weight w2 */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span>Input x₂: <b className="text-[#cc785c]">{heroX2.toFixed(2)}</b></span>
                      <span>Weight w₂: <b className="text-[#8b5cf6]">{heroW2.toFixed(2)}</b></span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="range"
                        min={-2}
                        max={2}
                        step={0.1}
                        value={heroX2}
                        onChange={(e) => setHeroX2(parseFloat(e.target.value))}
                        className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
                      />
                      <input
                        type="range"
                        min={-2}
                        max={2}
                        step={0.1}
                        value={heroW2}
                        onChange={(e) => setHeroW2(parseFloat(e.target.value))}
                        className="w-full h-1.5 accent-[#8b5cf6] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Bias */}
                  <div className="space-y-1">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span>Neuron Bias (b):</span>
                      <span className="font-bold text-[#cc785c]">{heroBias >= 0 ? `+${heroBias.toFixed(2)}` : heroBias.toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min={-2}
                      max={2}
                      step={0.1}
                      value={heroBias}
                      onChange={(e) => setHeroBias(parseFloat(e.target.value))}
                      className="w-full h-1.5 accent-[#cc785c] bg-[#e6dfd8] dark:bg-[#383531] rounded-lg cursor-pointer"
                    />
                  </div>

                  {/* Activation function */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-[#8e8b82]">Activation f(z):</span>
                    <div className="flex gap-1">
                      {(['sigmoid', 'relu', 'tanh'] as const).map((fn) => (
                        <button
                          key={fn}
                          onClick={() => setHeroActivation(fn)}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                            heroActivation === fn
                              ? 'bg-[#cc785c] text-white font-bold'
                              : 'bg-[#efe9de] dark:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96]'
                          }`}
                        >
                          {fn}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Live Geometric Visual Graph */}
                <div className="md:col-span-7 flex flex-col items-center justify-center p-4">
                  <div className="w-full max-w-md bg-[#faf9f5] dark:bg-[#1f1e1b] p-5 rounded-2xl border border-[#e6dfd8] dark:border-[#2a2926] shadow-sm relative">
                    <svg viewBox="0 0 380 180" className="w-full h-auto overflow-visible select-none font-mono">
                      {/* Connection wires */}
                      <path
                        d="M 60 45 L 200 90"
                        stroke={heroW1 >= 0 ? '#5db872' : '#c64545'}
                        strokeWidth={Math.max(1.5, Math.abs(heroW1) * 3)}
                        strokeOpacity="0.8"
                      />
                      <path
                        d="M 60 135 L 200 90"
                        stroke={heroW2 >= 0 ? '#5db872' : '#c64545'}
                        strokeWidth={Math.max(1.5, Math.abs(heroW2) * 3)}
                        strokeOpacity="0.8"
                      />
                      <path
                        d="M 200 90 L 320 90"
                        stroke="#cc785c"
                        strokeWidth="3"
                        strokeOpacity="0.9"
                      />

                      {/* Weight labels on wires */}
                      <text x="120" y="55" fontSize="10" fill="#8e8b82" textAnchor="middle">
                        w₁={heroW1.toFixed(1)}
                      </text>
                      <text x="120" y="130" fontSize="10" fill="#8e8b82" textAnchor="middle">
                        w₂={heroW2.toFixed(1)}
                      </text>

                      {/* Input node 1 */}
                      <circle cx="60" cy="45" r="22" fill="#faf9f5" stroke="#cc785c" strokeWidth="2" />
                      <text x="60" y="42" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#cc785c">x₁</text>
                      <text x="60" y="55" fontSize="9" textAnchor="middle" fill="#6c6a64">{heroX1.toFixed(1)}</text>

                      {/* Input node 2 */}
                      <circle cx="60" cy="135" r="22" fill="#faf9f5" stroke="#cc785c" strokeWidth="2" />
                      <text x="60" y="132" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#cc785c">x₂</text>
                      <text x="60" y="145" fontSize="9" textAnchor="middle" fill="#6c6a64">{heroX2.toFixed(1)}</text>

                      {/* Hidden Neuron node */}
                      <circle cx="200" cy="90" r="26" fill="#faf9f5" stroke="#8b5cf6" strokeWidth="2.5" />
                      <text x="200" y="86" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#8b5cf6">∑ z</text>
                      <text x="200" y="100" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#141413">{zSum.toFixed(2)}</text>

                      {/* Output node */}
                      <circle cx="320" cy="90" r="24" fill="#faf9f5" stroke="#5db8a6" strokeWidth="2" />
                      <text x="320" y="86" fontSize="10" fontWeight="bold" textAnchor="middle" fill="#5db8a6">ŷ</text>
                      <text x="320" y="100" fontSize="9" fontWeight="bold" textAnchor="middle" fill="#141413">{activeVal.toFixed(3)}</text>
                    </svg>

                    {/* Result equation footer */}
                    <div className="mt-3 pt-3 border-t border-[#e6dfd8] dark:border-[#2a2926] flex items-center justify-between text-xs font-mono">
                      <span className="text-[#8e8b82]">Linear Sum: z = {zSum.toFixed(3)}</span>
                      <span className="font-bold text-[#5db8a6]">Output ŷ = {activeVal.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Topology Wireframe Tab */}
            {heroActiveTab === 'topology' && (
              <div className="p-8 text-center space-y-4">
                <div className="inline-block p-6 rounded-2xl bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] font-mono text-xs max-w-xl mx-auto space-y-3">
                  <div className="flex justify-around items-center text-xs">
                    <span className="px-3 py-1 rounded-full bg-[#3b82f6]/10 text-[#3b82f6] font-bold">Input Layer (2)</span>
                    <span className="text-[#8e8b82]">⟶</span>
                    <span className="px-3 py-1 rounded-full bg-[#8b5cf6]/10 text-[#8b5cf6] font-bold">Hidden Layer (1)</span>
                    <span className="text-[#8e8b82]">⟶</span>
                    <span className="px-3 py-1 rounded-full bg-[#10b981]/10 text-[#10b981] font-bold">Output Layer (1)</span>
                  </div>
                  <p className="text-[#6c6a64] dark:text-[#a09d96] text-[11px] leading-relaxed pt-2">
                    Every network in NeuroCanvas organizes neurons into draggable, isolated layer frames with independent biases, activation thresholds, and topological order markers.
                  </p>
                </div>
              </div>
            )}

            {/* Calculus Breakdown Tab */}
            {heroActiveTab === 'calculus' && (
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                <div className="p-4 rounded-xl bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#cc785c]">1. Linear Combination</span>
                  <div className="text-[11px] text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                    z = x₁·w₁ + x₂·w₂ + b<br />
                    z = ({heroX1}·{heroW1}) + ({heroX2}·{heroW2}) + {heroBias}<br />
                    <b className="text-[#141413] dark:text-[#faf9f5]">z = {zSum.toFixed(3)}</b>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#8b5cf6]">2. Non-linear Activation</span>
                  <div className="text-[11px] text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                    a = σ(z) = 1 / (1 + e^-z)<br />
                    a = 1 / (1 + e^-({zSum.toFixed(2)}))<br />
                    <b className="text-[#141413] dark:text-[#faf9f5]">a = {activeVal.toFixed(3)}</b>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#faf9f5] dark:bg-[#1f1e1b] border border-[#e6dfd8] dark:border-[#2a2926] space-y-2">
                  <span className="text-[10px] font-bold uppercase text-[#5db8a6]">3. Local Derivative</span>
                  <div className="text-[11px] text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                    ∂a/∂z = a · (1 - a)<br />
                    ∂a/∂z = {activeVal.toFixed(2)} · {(1 - activeVal).toFixed(2)}<br />
                    <b className="text-[#141413] dark:text-[#faf9f5]">∂a/∂z = {(activeVal * (1 - activeVal)).toFixed(3)}</b>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* RUNE ICONS GEOMETRIC FEATURES MATRIX (6-Card Bento Grid) */}
      <section className="py-20 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#efe9de] dark:bg-[#252320] text-[10px] font-mono text-[#8e8b82]">
            <span>ENGINE PILLARS</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-normal text-[#141413] dark:text-[#faf9f5]">
            Built with architectural precision.
          </h2>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
            Every feature is engineered to provide complete transparency into artificial neural networks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              code: '01 // TENSORS',
              title: 'Real Floating-Point Values',
              desc: 'No vague glowing animations. Every connection wire carries real numeric weights (w), biases (b), and live weighted sums (z).',
              icon: Cpu,
              color: '#cc785c',
            },
            {
              code: '02 // CALCULUS',
              title: 'Step-by-Step Backpropagation',
              desc: 'Inspect exact chain-rule derivations ∂L/∂w = ∂L/∂a · ∂a/∂z · ∂z/∂w. Step backward node by node through the graph.',
              icon: TrendingDown,
              color: '#8b5cf6',
            },
            {
              code: '03 // LAYERS',
              title: 'Draggable Layer Frames',
              desc: 'Visual bounding frames with breathable padding, draggable headers, and interactive node containment whether framed or free.',
              icon: Layers,
              color: '#3b82f6',
            },
            {
              code: '04 // CONCEPTS',
              title: '12+ Interactive Concept Cards',
              desc: 'Spawn 2D decision boundaries, gradient descent bowls, vanishing gradient flow charts, and confusion matrix evaluators directly onto canvas.',
              icon: Box,
              color: '#5db8a6',
            },
            {
              code: '05 // PRESETS',
              title: 'Architectures by Difficulty',
              desc: 'Load pre-built networks with calibrated weights: Linear Regression, XOR, Tiny 3-4-2, Autoencoder Bottleneck, and ResNets.',
              icon: GitBranch,
              color: '#e8a55a',
            },
            {
              code: '06 // PRIVACY',
              title: '100% Client-Side Engine',
              desc: 'No tracking, no external server dependency, zero API quotas. Works completely offline on mobile and desktop.',
              icon: Activity,
              color: '#10b981',
            },
          ].map((card, i) => {
            const Icon = card.icon;
            return (
              <div
                key={i}
                className="relative rounded-2xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#181715] p-6 hover:border-[#cc785c] transition-all group shadow-xs hover:shadow-md"
              >
                {/* Corner crosshairs */}
                <span className="absolute top-2 left-2 text-[9px] font-mono text-[#8e8b82] group-hover:text-[#cc785c] transition-colors">+</span>
                <span className="absolute top-2 right-2 text-[9px] font-mono text-[#8e8b82] group-hover:text-[#cc785c] transition-colors">+</span>

                <div className="flex items-center justify-between mb-4 mt-1">
                  <div
                    style={{ backgroundColor: `${card.color}15`, color: card.color }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                  >
                    <Icon size={20} />
                  </div>
                  <span className="font-mono text-[10px] text-[#8e8b82] tracking-wider">{card.code}</span>
                </div>

                <h3 className="font-serif text-base font-bold text-[#141413] dark:text-[#faf9f5] mb-2 group-hover:text-[#cc785c] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                  {card.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CURRICULUM ROADMAP MATRIX (Rune style preview) */}
      <section className="py-16 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#cc785c] block mb-1">
              Structured Roadmap
            </span>
            <h2 className="font-serif text-3xl font-normal text-[#141413] dark:text-[#faf9f5]">
              9 Progressive Visual Stages
            </h2>
          </div>
          <button
            onClick={() => setCurrentRoute('learn')}
            className="self-start sm:self-auto text-xs font-semibold text-[#cc785c] hover:underline flex items-center gap-1"
          >
            <span>View Full Curriculum Roadmap</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {LESSONS.map((l) => (
            <div
              key={l.id}
              onClick={() => {
                startLesson(l.id);
                setCurrentRoute('play');
              }}
              className="p-5 rounded-2xl border border-[#e6dfd8] dark:border-[#2a2926] bg-white dark:bg-[#181715] hover:border-[#cc785c] transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="font-mono text-[11px] font-bold text-[#cc785c]">
                    Stage 0{l.order}
                  </span>
                  <span className="text-[10px] text-[#8e8b82] font-mono">
                    ~{l.estimatedMinutes} mins
                  </span>
                </div>
                <h4 className="font-serif text-sm font-bold text-[#141413] dark:text-[#faf9f5] group-hover:text-[#cc785c] transition-colors mb-2">
                  {l.title.replace(/^\d+\.\s*/, '')}
                </h4>
                <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
                  {l.summary}
                </p>
              </div>

              <div className="pt-4 mt-3 border-t border-[#f4efe8] dark:border-[#2a2926] flex items-center justify-between text-xs font-semibold text-[#cc785c]">
                <span>Launch Stage</span>
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION BANNER (Dark Architectural Box) */}
      <section className="px-6 max-w-7xl mx-auto w-full pb-20">
        <div className="relative rounded-3xl bg-[#181715] p-10 md:p-14 text-center text-[#faf9f5] overflow-hidden border border-[#2a2926] shadow-2xl">
          <span className="absolute top-3 left-3 font-mono text-xs text-[#cc785c]">+</span>
          <span className="absolute top-3 right-3 font-mono text-xs text-[#cc785c]">+</span>
          <span className="absolute bottom-3 left-3 font-mono text-xs text-[#cc785c]">+</span>
          <span className="absolute bottom-3 right-3 font-mono text-xs text-[#cc785c]">+</span>

          <div className="max-w-2xl mx-auto space-y-5">
            <h2 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight">
              Ready to construct your first neural network?
            </h2>
            <p className="text-sm text-[#a09d96] leading-relaxed">
              No prerequisites required. Zero server costs, zero accounts, completely free and open.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
              <button
                onClick={() => {
                  startLesson('lesson-01-neuron');
                  setCurrentRoute('play');
                }}
                className="px-6 py-3 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white font-semibold text-sm shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Begin Lesson 1: The Biological & Artificial Neuron
              </button>
              <button
                onClick={() => setCurrentRoute('play')}
                className="px-6 py-3 rounded-xl bg-[#252320] hover:bg-[#383531] text-[#faf9f5] font-semibold text-sm border border-[#383531] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Open Free Canvas Sandbox
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5] dark:bg-[#141413] text-[#8e8b82] py-8 px-6 text-xs font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-[#141413] dark:text-[#faf9f5]">
            <AppLogo className="h-5 w-auto" />
            <span className="font-serif font-bold text-sm">NeuroCanvas</span>
            <span className="text-[#8e8b82]">· Visual Deep Learning Studio</span>
          </div>
          <p className="text-[11px] text-center sm:text-right">
            Client-Side Mathematical Engine. Built with React Flow & Next.js.
          </p>
        </div>
      </footer>
    </div>
  );
}

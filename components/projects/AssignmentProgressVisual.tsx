'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Play,
  Gauge,
  ListOrdered,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Requirement } from '@/lib/engine/projectChecks';
import { ProjectTier } from '@/lib/content/projects';

interface AssignmentProgressVisualProps {
  title?: string;
  requirements: Requirement[];
  requirementResults: Record<string, { passed: boolean; detail?: string }>;
  tiers?: ProjectTier[];
  completedTier?: 'bronze' | 'silver' | 'gold' | null;
  onCheckWork?: () => void;
  onSelectRequirement?: (reqId: string) => void;
  compact?: boolean;
}

export function AssignmentProgressVisual({
  title = 'Assignment Progress',
  requirements,
  requirementResults,
  tiers,
  completedTier,
  onCheckWork,
  onSelectRequirement,
  compact = false,
}: AssignmentProgressVisualProps) {
  const [viewMode, setViewMode] = useState<'both' | 'gauge' | 'steps'>('both');

  const totalReqs = requirements.length;
  const passedCount = requirements.filter(
    (r) => requirementResults[r.id]?.passed
  ).length;
  const percentage = totalReqs > 0 ? Math.round((passedCount / totalReqs) * 100) : 0;
  const isAllComplete = passedCount === totalReqs && totalReqs > 0;

  // Radial Gauge Calculations
  const radius = 42;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Determine current active step index (first incomplete step)
  const currentStepIndex = requirements.findIndex(
    (r) => !requirementResults[r.id]?.passed
  );
  const activeIndex = currentStepIndex === -1 ? totalReqs - 1 : currentStepIndex;

  return (
    <div className="w-full rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] shadow-xs overflow-hidden transition-all">
      {/* Top Bar with Mode Switcher */}
      <div className="px-4 py-3 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/70 dark:bg-[#151412]/70 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold transition-colors ${
              isAllComplete
                ? 'bg-[#5db8a6] text-white shadow-xs'
                : 'bg-[#cc785c]/10 text-[#cc785c]'
            }`}
          >
            {isAllComplete ? <Sparkles size={13} /> : <Gauge size={13} />}
          </div>
          <span className="font-mono font-bold uppercase tracking-wider text-[11px] text-[#141413] dark:text-[#faf9f5]">
            {title}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#efe9de] dark:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] font-mono font-medium">
            Part {Math.min(passedCount + 1, totalReqs)} of {totalReqs}
          </span>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center gap-1 bg-[#efe9de]/70 dark:bg-[#252320]/70 p-0.5 rounded-lg text-[10px] font-semibold">
          <button
            onClick={() => setViewMode('both')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'both'
                ? 'bg-white dark:bg-[#1a1917] text-[#141413] dark:text-[#faf9f5] shadow-2xs'
                : 'text-[#8e8b82] hover:text-[#141413]'
            }`}
            title="Split Radial Gauge and Steps"
          >
            Dual View
          </button>
          <button
            onClick={() => setViewMode('gauge')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'gauge'
                ? 'bg-white dark:bg-[#1a1917] text-[#141413] dark:text-[#faf9f5] shadow-2xs'
                : 'text-[#8e8b82] hover:text-[#141413]'
            }`}
            title="Radial Gauge Only"
          >
            Gauge
          </button>
          <button
            onClick={() => setViewMode('steps')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              viewMode === 'steps'
                ? 'bg-white dark:bg-[#1a1917] text-[#141413] dark:text-[#faf9f5] shadow-2xs'
                : 'text-[#8e8b82] hover:text-[#141413]'
            }`}
            title="Step Indicator Only"
          >
            Steps
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-4 flex flex-col gap-4">
        <div
          className={`flex flex-col sm:flex-row items-center justify-around gap-6 ${
            viewMode === 'steps' ? 'hidden sm:hidden' : ''
          }`}
        >
          {/* Radial Gauge SVG */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg
              width="110"
              height="110"
              viewBox="0 0 110 110"
              className="transform -rotate-90 drop-shadow-xs"
            >
              {/* Gradient Definition */}
              <defs>
                <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#cc785c" />
                  <stop offset="100%" stopColor="#5db8a6" />
                </linearGradient>
              </defs>

              {/* Background Track */}
              <circle
                cx="55"
                cy="55"
                r={radius}
                fill="transparent"
                stroke="currentColor"
                strokeWidth={strokeWidth}
                className="text-[#efe9de] dark:text-[#252320]"
              />

              {/* Animated Progress Arc */}
              <motion.circle
                cx="55"
                cy="55"
                r={radius}
                fill="transparent"
                stroke="url(#gaugeGradient)"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>

            {/* Inner Gauge Text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-serif font-bold text-xl leading-none text-[#141413] dark:text-[#faf9f5]">
                {percentage}%
              </span>
              <span className="text-[10px] font-mono text-[#8e8b82] mt-0.5">
                {passedCount}/{totalReqs} Done
              </span>
            </div>
          </div>

          {/* Quick Summary & Tier Milestones */}
          <div className="flex-1 flex flex-col justify-center text-xs">
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  isAllComplete
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}
              >
                {isAllComplete ? 'Assignment Solved' : `${totalReqs - passedCount} Steps Remaining`}
              </span>

              {completedTier && (
                <span className="px-2 py-0.5 rounded-full bg-[#cc785c]/10 text-[#cc785c] text-[10px] font-bold uppercase flex items-center gap-1">
                  <Award size={11} /> {completedTier} Tier
                </span>
              )}
            </div>

            <p className="text-[#6c6a64] dark:text-[#a09d96] text-[11px] leading-relaxed mb-2.5">
              {isAllComplete
                ? 'All architectural and numerical requirements have been satisfied! You can claim your badge.'
                : `Complete each requirement sequentially. Your network topology and loss are evaluated in real time.`}
            </p>

            {onCheckWork && (
              <button
                onClick={onCheckWork}
                className="self-start px-3 py-1 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-[11px] font-semibold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <CheckCircle2 size={12} />
                <span>Evaluate Canvas</span>
              </button>
            )}
          </div>
        </div>

        {/* Step Indicator / Multi-Part Stepper */}
        {(viewMode === 'both' || viewMode === 'steps') && (
          <div className="pt-3 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60">
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#8e8b82] font-bold mb-2.5 flex items-center justify-between">
              <span>Step-by-Step Path</span>
              <span>{Math.round((passedCount / totalReqs) * 100)}% Complete</span>
            </div>

            {/* Stepper Timeline */}
            <div className="flex flex-col gap-2">
              {requirements.map((req, idx) => {
                const res = requirementResults[req.id];
                const isPassed = !!res?.passed;
                const isCurrent = idx === activeIndex && !isPassed;

                return (
                  <div
                    key={req.id}
                    onClick={() => onSelectRequirement?.(req.id)}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all cursor-pointer group ${
                      isPassed
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/25 text-[#141413] dark:text-[#faf9f5]'
                        : isCurrent
                        ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-500/40 text-[#141413] dark:text-[#faf9f5] ring-1 ring-amber-500/20'
                        : 'bg-transparent border-[#e6dfd8] dark:border-[#2a2926] text-[#8e8b82] opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Step Circle */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold transition-all ${
                          isPassed
                            ? 'bg-emerald-500 text-white shadow-2xs'
                            : isCurrent
                            ? 'bg-amber-500 text-white animate-pulse'
                            : 'bg-[#efe9de] dark:bg-[#252320] text-[#8e8b82]'
                        }`}
                      >
                        {isPassed ? <CheckCircle2 size={13} /> : idx + 1}
                      </div>

                      <div className="min-w-0">
                        <span
                          className={`font-semibold text-[11px] block truncate ${
                            isPassed ? 'text-[#141413] dark:text-[#faf9f5]' : ''
                          }`}
                        >
                          Part {idx + 1}: {req.label}
                        </span>
                        {res?.detail && (
                          <span className="text-[10px] text-[#8e8b82] block truncate">
                            {res.detail}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step State Badge */}
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 ${
                        isPassed
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                          : isCurrent
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold'
                          : 'text-[#8e8b82]'
                      }`}
                    >
                      {isPassed ? 'Passed' : isCurrent ? 'Next Goal' : 'Pending'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact mini radial gauge suitable for the header bar
 */
export function MiniRadialGauge({
  passedCount,
  totalCount,
}: {
  passedCount: number;
  totalCount: number;
}) {
  const percentage = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const radius = 10;
  const strokeWidth = 2.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#faf9f5] dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] shadow-2xs"
      title={`Assignment Progress: ${passedCount}/${totalCount} Parts Passed (${percentage}%)`}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" className="transform -rotate-90">
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-[#efe9de] dark:text-[#252320]"
        />
        <circle
          cx="12"
          cy="12"
          r={radius}
          fill="transparent"
          stroke={percentage === 100 ? '#5db8a6' : '#cc785c'}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <span className="text-[11px] font-mono font-bold text-[#141413] dark:text-[#faf9f5]">
        {percentage}%
      </span>
      <span className="text-[10px] text-[#8e8b82] font-mono hidden sm:inline">
        ({passedCount}/{totalCount})
      </span>
    </div>
  );
}

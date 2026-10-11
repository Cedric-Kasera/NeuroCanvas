'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  BookOpen,
  Award,
  Clock,
  ArrowRight,
  CheckCircle2,
  Lock,
  PlusCircle,
  ShieldCheck,
  Search,
  Filter,
  GraduationCap,
  Layers,
  FileCheck,
} from 'lucide-react';
import { PROJECTS, ProjectDefinition } from '@/lib/content/projects';
import { useUIStore } from '@/lib/state/uiStore';
import { useProjectStore } from '@/lib/state/projectStore';
import { AppLogo } from '@/components/ui/AppLogo';

export function ProjectsView() {
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const openProject = useUIStore((s) => s.openProject);
  const [filterDifficulty, setFilterDifficulty] = useState<number | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = PROJECTS.filter((p) => {
    if (filterDifficulty !== 'all' && p.difficulty !== filterDifficulty) return false;
    if (
      searchQuery &&
      !p.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.tagline.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !p.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/90 dark:bg-[#141413]/90 backdrop-blur-md px-6 max-w-7xl mx-auto w-full flex items-center justify-between sticky top-0 z-30">
        <div
          onClick={() => setCurrentRoute('landing')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <AppLogo className="h-7 w-auto" />
          <span className="font-serif text-lg font-bold tracking-tight">NeuroCanvas</span>
          <span className="text-[#8e8b82] text-xs font-mono">/ Projects & Assignments</span>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setCurrentRoute('teach')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors"
          >
            <GraduationCap size={14} className="text-[#cc785c]" />
            <span>Teacher Builder</span>
          </button>
          <button
            onClick={() => setCurrentRoute('verify')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors"
          >
            <ShieldCheck size={14} className="text-[#5db8a6]" />
            <span>Verify Project File</span>
          </button>
          <button
            onClick={() => setCurrentRoute('play')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-medium shadow-xs transition-colors"
          >
            <Sparkles size={13} />
            <span>Studio Canvas</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#e6dfd8] dark:border-[#2a2926]">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cc785c]/10 text-[#cc785c] text-xs font-semibold mb-3">
              <Award size={13} />
              <span>Hands-on Engineering Challenges</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight mb-2">
              Mini-Projects & Assignments
            </h1>
            <p className="text-sm text-[#6c6a64] dark:text-[#a09d96] leading-relaxed">
              Move beyond watching animations into active creation. Solve real mathematical constraints, discover compact neural architectures, and generate verifiable project credentials with cryptographic proof.
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8b82]"
              />
              <input
                type="text"
                placeholder="Search challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs rounded-xl bg-[#efe9de]/60 dark:bg-[#252320]/60 border border-[#e6dfd8] dark:border-[#383531] focus:outline-hidden focus:border-[#cc785c] w-48 sm:w-60"
              />
            </div>
            <div className="flex items-center gap-1 bg-[#efe9de]/60 dark:bg-[#252320]/60 p-1 rounded-xl border border-[#e6dfd8] dark:border-[#383531] text-xs">
              <button
                onClick={() => setFilterDifficulty('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterDifficulty === 'all'
                    ? 'bg-white dark:bg-[#1a1917] shadow-xs text-[#141413] dark:text-[#faf9f5]'
                    : 'text-[#8e8b82] hover:text-[#141413]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterDifficulty(1)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterDifficulty === 1
                    ? 'bg-white dark:bg-[#1a1917] shadow-xs text-[#141413] dark:text-[#faf9f5]'
                    : 'text-[#8e8b82] hover:text-[#141413]'
                }`}
              >
                Level 1
              </button>
              <button
                onClick={() => setFilterDifficulty(2)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterDifficulty === 2
                    ? 'bg-white dark:bg-[#1a1917] shadow-xs text-[#141413] dark:text-[#faf9f5]'
                    : 'text-[#8e8b82] hover:text-[#141413]'
                }`}
              >
                Level 2
              </button>
              <button
                onClick={() => setFilterDifficulty(3)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  filterDifficulty === 3
                    ? 'bg-white dark:bg-[#1a1917] shadow-xs text-[#141413] dark:text-[#faf9f5]'
                    : 'text-[#8e8b82] hover:text-[#141413]'
                }`}
              >
                Level 3
              </button>
            </div>
          </div>
        </div>

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project, idx) => {
            const dots = Array.from({ length: 3 }, (_, i) => i < project.difficulty);

            return (
              <div
                key={project.id}
                onClick={() => openProject(project.id)}
                className="group p-5 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c] transition-all hover:shadow-md cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-mono font-bold text-[#cc785c] uppercase tracking-wider">
                      Project P{idx + 1}
                    </span>
                    <div className="flex items-center gap-1.5" title={`Difficulty: ${project.difficulty}/3`}>
                      {dots.map((active, dIdx) => (
                        <div
                          key={dIdx}
                          className={`w-2 h-2 rounded-full ${
                            active ? 'bg-[#cc785c]' : 'bg-[#e6dfd8] dark:bg-[#383531]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <h3 className="font-serif text-lg font-bold group-hover:text-[#cc785c] transition-colors mb-1.5">
                    {project.title}
                  </h3>
                  <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] mb-4 line-clamp-2">
                    {project.tagline}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {project.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md bg-[#efe9de]/70 dark:bg-[#252320]/70 text-[10px] font-medium text-[#6c6a64] dark:text-[#a09d96]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[#8e8b82]">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      <span>~{project.estimatedMinutes}m</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Award size={12} className="text-[#5db8a6]" />
                      <span>{project.reward.title}</span>
                    </span>
                  </div>

                  <span className="font-semibold text-[#cc785c] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Launch</span>
                    <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Assignments / Teacher Banner */}
        <div className="p-6 rounded-2xl bg-[#efe9de]/40 dark:bg-[#1a1917]/40 border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#cc785c]/10 text-[#cc785c] flex items-center justify-center shrink-0">
              <GraduationCap size={24} />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold mb-1">
                Teacher Mode: Distribute Custom Assignments
              </h3>
              <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] max-w-xl leading-relaxed">
                Need to hand out assignments to a study group or class? Create a custom challenge, set requirements and datasets, and export a shareable link or QR code — completely offline and without requiring accounts.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setCurrentRoute('teach')}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#252320] border border-[#e6dfd8] dark:border-[#383531] text-xs font-semibold hover:border-[#cc785c] transition-colors"
            >
              Author Assignment
            </button>
            <button
              onClick={() => setCurrentRoute('verify')}
              className="px-4 py-2 rounded-xl bg-[#5db8a6] hover:bg-[#489989] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Verify Submissions
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

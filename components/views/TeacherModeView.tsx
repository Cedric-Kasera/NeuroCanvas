'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Share2,
  Download,
  Copy,
  Plus,
  Trash2,
  Check,
  QrCode,
  Link as LinkIcon,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { AppLogo } from '@/components/ui/AppLogo';
import LZString from 'lz-string';

export function TeacherModeView() {
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const showToast = useUIStore((s) => s.showToast);

  const [title, setTitle] = useState('Custom Logic Gate Assignment');
  const [tagline, setTagline] = useState('Design a neural network that solves custom logic constraints.');
  const [instructions, setInstructions] = useState(
    '1. Adjust weights and bias to separate the dataset.\n2. Verify that loss drops below 0.05.\n3. Write your reflection before submitting.'
  );
  const [datasetPreset, setDatasetPreset] = useState<'xor' | 'and' | 'commute'>('xor');
  const [reqAccuracy, setReqAccuracy] = useState<number>(100);
  const [reqMaxNeurons, setReqMaxNeurons] = useState<number>(3);
  const [reflectionPrompt, setReflectionPrompt] = useState('Why does this problem require a non-linear activation?');

  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleGenerateAssignment = () => {
    const payload = {
      app: 'neurocanvas',
      kind: 'assignment',
      version: 1,
      title,
      tagline,
      instructions,
      datasetPreset,
      requirements: [
        { type: 'datasetAccuracy', threshold: reqAccuracy / 100, label: `Reach ${reqAccuracy}% dataset accuracy` },
        { type: 'architecture', maxNeurons: reqMaxNeurons, label: `Use at most ${reqMaxNeurons} neurons` },
        { type: 'reflection', reflectionId: 'r_custom', label: 'Complete written reflection' },
      ],
      reflections: [{ id: 'r_custom', prompt: reflectionPrompt, minChars: 30 }],
      createdAt: new Date().toISOString(),
    };

    const json = JSON.stringify(payload);
    const compressed = LZString.compressToEncodedURIComponent(json);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://neurocanvas.app';
    const link = `${origin}/#a=${compressed}`;
    setGeneratedLink(link);
    showToast('Assignment link & QR code ready!', 'success');
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] dark:bg-[#141413] text-[#141413] dark:text-[#faf9f5] flex flex-col font-sans">
      {/* Top Header */}
      <header className="h-16 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/90 dark:bg-[#141413]/90 backdrop-blur-md px-6 max-w-7xl mx-auto w-full flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentRoute('projects')}
            className="p-1.5 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96] transition-colors"
          >
            <ArrowLeft size={16} />
          </button>
          <AppLogo className="h-7 w-auto" />
          <span className="font-serif text-lg font-bold tracking-tight">NeuroCanvas</span>
          <span className="text-[#8e8b82] text-xs font-mono">/ Teacher Assignment Builder</span>
        </div>

        <button
          onClick={() => setCurrentRoute('verify')}
          className="px-3.5 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors"
        >
          Verify Submissions
        </button>
      </header>

      {/* Main Form */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#cc785c]/10 text-[#cc785c] text-xs font-semibold mb-3">
            <GraduationCap size={13} />
            <span>Classroom & Study Group Mode</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">
            Create Verifiable Assignments
          </h1>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed max-w-2xl">
            Author assignments with custom requirements and datasets. Students complete the project offline and submit a cryptographically tamper-evident `.nnproject.json` file or completion code.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-5 shadow-xs">
          {/* Assignment Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8e8b82]">Assignment Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-2.5 text-xs rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] focus:border-[#cc785c] outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8e8b82]">Short Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="p-2.5 text-xs rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] focus:border-[#cc785c] outline-hidden"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#8e8b82]">Student Instructions</label>
            <textarea
              rows={3}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] focus:border-[#cc785c] outline-hidden resize-none leading-relaxed"
            />
          </div>

          {/* Dataset & Constraints */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[#e6dfd8] dark:border-[#2a2926]">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8e8b82]">Dataset Preset</label>
              <select
                value={datasetPreset}
                onChange={(e) => setDatasetPreset(e.target.value as any)}
                className="p-2.5 text-xs rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413]"
              >
                <option value="xor">XOR Non-linear (4 samples)</option>
                <option value="and">AND Logic Gate (4 samples)</option>
                <option value="commute">Commute Decisions (7 samples)</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8e8b82]">Required Accuracy (%)</label>
              <input
                type="number"
                min="50"
                max="100"
                value={reqAccuracy}
                onChange={(e) => setReqAccuracy(parseInt(e.target.value) || 100)}
                className="p-2.5 text-xs rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413]"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#8e8b82]">Max Allowed Neurons</label>
              <input
                type="number"
                min="1"
                max="10"
                value={reqMaxNeurons}
                onChange={(e) => setReqMaxNeurons(parseInt(e.target.value) || 3)}
                className="p-2.5 text-xs rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413]"
              />
            </div>
          </div>

          {/* Reflection Prompt */}
          <div className="flex flex-col gap-1.5 pt-4 border-t border-[#e6dfd8] dark:border-[#2a2926]">
            <label className="text-xs font-semibold text-[#8e8b82]">Required Reflection Prompt</label>
            <input
              type="text"
              value={reflectionPrompt}
              onChange={(e) => setReflectionPrompt(e.target.value)}
              className="p-2.5 text-xs rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] focus:border-[#cc785c] outline-hidden"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleGenerateAssignment}
              className="px-5 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-2"
            >
              <Share2 size={14} />
              <span>Generate Assignment Link & QR Code</span>
            </button>
          </div>
        </div>

        {/* Output Section */}
        {generatedLink && (
          <div className="p-6 rounded-2xl bg-[#efe9de]/50 dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#5db8a6]">
              <Check size={14} />
              <span>Assignment Ready to Share</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={generatedLink}
                className="flex-1 p-2.5 text-xs font-mono rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413]"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                  showToast('Assignment link copied to clipboard!', 'success');
                }}
                className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#252320] border border-[#e6dfd8] dark:border-[#383531] text-xs font-semibold hover:border-[#cc785c] transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Copy size={13} />
                <span>{isCopied ? 'Copied!' : 'Copy Link'}</span>
              </button>
            </div>

            <div className="flex items-center gap-4 text-xs text-[#8e8b82] pt-2 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60">
              <span className="flex items-center gap-1.5">
                <QrCode size={14} className="text-[#cc785c]" />
                <span>Mobile scan friendly (URL payload &lt; 2KB)</span>
              </span>
              <span>•</span>
              <span>Zero-backend offline execution</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

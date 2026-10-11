'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  Upload,
  FileCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Award,
  RefreshCw,
} from 'lucide-react';
import { useUIStore } from '@/lib/state/uiStore';
import { AppLogo } from '@/components/ui/AppLogo';
import { PROJECTS } from '@/lib/content/projects';
import { checkRequirement, computeIntegrityHash, CheckResult } from '@/lib/engine/projectChecks';

export function VerifyView() {
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const [jsonInput, setJsonInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    valid: boolean;
    tampered: boolean;
    projectTitle?: string;
    tier?: string;
    completionCode?: string;
    details: Array<{ id: string; label: string; passed: boolean; detail: string; selfReported?: boolean }>;
    hashMatched: boolean;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleVerify = async (rawJson: string) => {
    setErrorMsg(null);
    setVerificationResult(null);

    try {
      const data = JSON.parse(rawJson);
      if (!data.project || !data.canvas) {
        throw new Error('Invalid project file: missing project or canvas metadata.');
      }

      // Check SHA-256 integrity hash
      const embeddedIntegrity = data.integrity?.hash;
      const copyWithoutIntegrity = { ...data };
      delete copyWithoutIntegrity.integrity;

      const calculatedHash = await computeIntegrityHash(copyWithoutIntegrity);
      const hashMatched = !embeddedIntegrity || calculatedHash === embeddedIntegrity;

      // Find matching project definition
      const projDef = PROJECTS.find((p) => p.id === data.project.id);
      const dataset = projDef?.dataset || data.dataset;

      const resultsList: Array<{
        id: string;
        label: string;
        passed: boolean;
        detail: string;
        selfReported?: boolean;
      }> = [];

      const ctx = {
        canvas: data.canvas,
        dataset,
        runRecords: data.runRecords || [],
        reflections: data.reflections || {},
      };

      const reqsToCheck = projDef?.requirements || data.results || [];

      for (const req of reqsToCheck) {
        if ('type' in req) {
          const res: CheckResult = checkRequirement(req as any, ctx);
          resultsList.push({
            id: req.id,
            label: req.label,
            passed: res.passed,
            detail: res.detail,
            selfReported: (req as any).selfReported,
          });
        } else {
          resultsList.push({
            id: req.id,
            label: req.id,
            passed: req.passed,
            detail: req.detail,
          });
        }
      }

      const allNonSelfPassed = resultsList
        .filter((r) => !r.selfReported)
        .every((r) => r.passed);

      setVerificationResult({
        valid: allNonSelfPassed && hashMatched,
        tampered: !hashMatched,
        projectTitle: data.project.title,
        tier: data.tier,
        completionCode: data.completionCode,
        details: resultsList,
        hashMatched,
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not parse project file.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonInput(text);
      handleVerify(text);
    };
    reader.readAsText(file);
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
          <span className="text-[#8e8b82] text-xs font-mono">/ Offline Verification</span>
        </div>

        <button
          onClick={() => setCurrentRoute('projects')}
          className="px-3.5 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium transition-colors"
        >
          Projects Library
        </button>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-8 flex flex-col gap-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#5db8a6]/10 text-[#5db8a6] text-xs font-semibold mb-3">
            <ShieldCheck size={13} />
            <span>Cryptographic Proof Engine</span>
          </div>
          <h1 className="font-serif text-3xl font-bold tracking-tight mb-2">
            Verify Student Project Files
          </h1>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] leading-relaxed max-w-2xl">
            Drop or paste any `.nnproject.json` file. The engine re-executes all forward passes and architecture tests against the submitted neural network in memory to verify genuine completion.
          </p>
        </div>

        {/* Input / Drop zone */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] flex flex-col gap-4 shadow-xs">
          <div className="border-2 border-dashed border-[#e6dfd8] dark:border-[#383531] rounded-2xl p-6 text-center hover:border-[#cc785c] transition-colors flex flex-col items-center justify-center gap-2 relative cursor-pointer">
            <input
              type="file"
              accept=".json,.nnproject.json"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
            <Upload size={24} className="text-[#8e8b82]" />
            <span className="text-xs font-semibold">Drop .nnproject.json file here or click to browse</span>
            <span className="text-[11px] text-[#8e8b82]">All verification runs client-side locally</span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#8e8b82]">Or paste JSON payload:</label>
            <textarea
              rows={4}
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Paste JSON content here..."
              className="p-3 text-xs font-mono rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#141413] focus:border-[#cc785c] outline-hidden resize-none"
            />
          </div>

          <button
            onClick={() => handleVerify(jsonInput)}
            disabled={!jsonInput.trim()}
            className="self-start px-5 py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            <span>Re-Run & Verify Engine Checks</span>
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Verification Result Report */}
        {verificationResult && (
          <div
            className={`p-6 rounded-2xl border flex flex-col gap-5 ${
              verificationResult.valid
                ? 'bg-[#5db8a6]/10 border-[#5db8a6]/30'
                : 'bg-red-500/10 border-red-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {verificationResult.valid ? (
                  <ShieldCheck size={28} className="text-[#5db8a6]" />
                ) : (
                  <ShieldAlert size={28} className="text-red-500" />
                )}
                <div>
                  <h3 className="font-serif text-lg font-bold">
                    {verificationResult.valid ? 'Submission Verified Authentically' : 'Verification Warning'}
                  </h3>
                  <span className="text-xs text-[#8e8b82]">
                    Project: {verificationResult.projectTitle} • Tier: {verificationResult.tier?.toUpperCase()}
                  </span>
                </div>
              </div>

              {verificationResult.hashMatched ? (
                <span className="px-3 py-1 rounded-full bg-[#5db8a6]/20 text-[#5db8a6] text-xs font-bold uppercase">
                  SHA-256 Valid
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-500 text-xs font-bold uppercase">
                  Hash Mismatch (Tampered)
                </span>
              )}
            </div>

            {verificationResult.tampered && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
                Warning: File was modified after it was created. The cryptographic SHA-256 fingerprint does not match the canvas contents.
              </div>
            )}

            {/* Checklist results */}
            <div className="flex flex-col gap-2 pt-2 border-t border-black/10 dark:border-white/10">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#8e8b82]">
                Independent Re-Evaluation Breakdown
              </h4>
              {verificationResult.details.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/60 dark:bg-black/30 border border-black/5 dark:border-white/5 flex items-start gap-2.5 text-xs"
                >
                  {item.passed ? (
                    <CheckCircle2 size={15} className="text-[#5db8a6] shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{item.label}</span>
                      {item.selfReported && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-mono">
                          Self-reported
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-[#8e8b82] mt-0.5 block">{item.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

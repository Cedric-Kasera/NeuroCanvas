'use client';

import React, { useState, useMemo } from 'react';
import { useUIStore } from '@/lib/state/uiStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { encodeCanvasToShareUrl } from '@/lib/persistence/share';
import { downloadJson } from '@/lib/persistence/exportImport';
import { X, Copy, Check, Share2, AlertTriangle, Download } from 'lucide-react';

export function ShareModal() {
  const [copied, setCopied] = useState(false);

  const open = useUIStore((s) => s.shareModalOpen);
  const setOpen = useUIStore((s) => s.setShareModalOpen);
  const showToast = useUIStore((s) => s.showToast);
  const serialize = useCanvasStore((s) => s.serialize);

  const shareData = useMemo(() => {
    if (!open || typeof window === 'undefined') return null;
    const canvas = serialize();
    return encodeCanvasToShareUrl(canvas, window.location.href);
  }, [open, serialize]);

  if (!open) return null;

  const handleCopyLink = async () => {
    if (shareData?.url) {
      await navigator.clipboard.writeText(shareData.url);
      setCopied(true);
      showToast('Share link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleWebShare = async () => {
    if (navigator.share && shareData?.url) {
      try {
        await navigator.share({
          title: 'NeuroCanvas Neural Network',
          text: 'Check out this interactive neural network simulation on NeuroCanvas!',
          url: shareData.url,
        });
      } catch {}
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] p-5 shadow-2xl text-[#141413] dark:text-[#faf9f5]">
        <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Share2 size={16} className="text-[#cc785c]" />
            <h3 className="font-serif text-base font-bold">Share Your Network</h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]"
          >
            <X size={16} />
          </button>
        </div>

        {shareData?.tooLarge ? (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-[#c64545]/30 bg-[#fdf2f2] dark:bg-[#252320] p-3 flex items-start gap-2 text-[#c64545]">
              <AlertTriangle size={18} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Canvas is too large for a link</p>
                <p className="text-[11px] mt-0.5 text-[#6c6a64] dark:text-[#a09d96]">
                  This canvas has too many nodes/connections to fit cleanly inside a browser URL ({shareData.charCount} characters). Please download the `.nncanvas.json` file instead to share it.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                downloadJson(serialize());
                setOpen(false);
              }}
              className="w-full py-2.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-xs font-medium text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={14} />
              <span>Download .nncanvas.json file</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <p className="text-[#6c6a64] dark:text-[#a09d96]">
              Anyone with this link can open an exact copy of your neural network and run the simulation directly in their browser.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareData?.url || ''}
                className="flex-1 bg-[#efe9de] dark:bg-[#252320] rounded-xl px-3 py-2 text-xs font-mono text-[#141413] dark:text-[#faf9f5] border border-[#e6dfd8] dark:border-[#383531] outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white font-medium transition-colors shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>

            {typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && (
              <button
                onClick={handleWebShare}
                className="w-full py-2 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] font-medium text-xs text-[#141413] dark:text-[#faf9f5] flex items-center justify-center gap-2 transition-colors"
              >
                <Share2 size={14} />
                <span>Share via system dialog</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

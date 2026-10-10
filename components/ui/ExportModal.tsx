'use client';

import React, { useState } from 'react';
import { useUIStore } from '@/lib/state/uiStore';
import { useCanvasStore } from '@/lib/state/canvasStore';
import { downloadJson, copyJsonToClipboard, exportCanvasToImage, parseCanvasJson } from '@/lib/persistence/exportImport';
import { X, Download, Image as ImageIcon, FileText, Upload, Copy, Check } from 'lucide-react';

export function ExportModal() {
  const [copied, setCopied] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const open = useUIStore((s) => s.exportModalOpen);
  const setOpen = useUIStore((s) => s.setExportModalOpen);
  const showToast = useUIStore((s) => s.showToast);

  const serialize = useCanvasStore((s) => s.serialize);
  const loadCanvas = useCanvasStore((s) => s.loadCanvas);

  if (!open) return null;

  const handleDownloadJson = () => {
    downloadJson(serialize());
    showToast('Downloaded .nncanvas.json', 'success');
  };

  const handleCopyJson = async () => {
    const ok = await copyJsonToClipboard(serialize());
    if (ok) {
      setCopied(true);
      showToast('Canvas JSON copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleExportPng = async () => {
    setIsExportingImage(true);
    try {
      const flowElem = document.querySelector('.react-flow') as HTMLElement;
      if (!flowElem) {
        showToast('Canvas element not found', 'error');
        return;
      }
      const dataUrl = await exportCanvasToImage(flowElem, 'png', false);
      const link = document.createElement('a');
      link.download = `neurocanvas_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Exported canvas PNG image', 'success');
    } catch (err: any) {
      showToast('Image export failed: ' + err.message, 'error');
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = parseCanvasJson(content);
      if (res.success && res.data) {
        loadCanvas(res.data);
        showToast(`Imported "${res.data.name}"`, 'success');
        setOpen(false);
      } else {
        setImportError(res.error || 'Failed to parse file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] p-5 shadow-2xl text-[#141413] dark:text-[#faf9f5] space-y-4">
        <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-3">
          <h3 className="font-serif text-base font-bold">Export & Import Canvas</h3>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Export Options Grid */}
        <div className="space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#cc785c]">Export Formats</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={handleDownloadJson}
              className="p-3 rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] hover:border-[#cc785c] text-left transition-all group"
            >
              <Download size={18} className="text-[#cc785c] mb-1.5" />
              <strong className="block text-xs group-hover:text-[#cc785c]">Save JSON</strong>
              <span className="text-[10px] text-[#8e8b82]">.nncanvas.json format</span>
            </button>

            <button
              onClick={handleExportPng}
              disabled={isExportingImage}
              className="p-3 rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] hover:border-[#5db8a6] text-left transition-all group"
            >
              <ImageIcon size={18} className="text-[#5db8a6] mb-1.5" />
              <strong className="block text-xs group-hover:text-[#5db8a6]">PNG Image</strong>
              <span className="text-[10px] text-[#8e8b82]">{isExportingImage ? 'Rendering...' : '2x resolution'}</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="p-3 rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] hover:border-[#e8a55a] text-left transition-all group"
            >
              {copied ? <Check size={18} className="text-[#5db872] mb-1.5" /> : <Copy size={18} className="text-[#e8a55a] mb-1.5" />}
              <strong className="block text-xs group-hover:text-[#e8a55a]">Copy to Clipboard</strong>
              <span className="text-[10px] text-[#8e8b82]">JSON text string</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="pt-3 border-t border-[#e6dfd8] dark:border-[#383531] space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5db8a6]">Import Canvas File</span>
          <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-[#e6dfd8] dark:border-[#383531] hover:border-[#cc785c] rounded-xl cursor-pointer bg-white dark:bg-[#1f1e1b] transition-colors">
            <Upload size={20} className="text-[#cc785c] mb-1" />
            <span className="text-xs font-medium text-[#141413] dark:text-[#faf9f5]">
              Choose a .nncanvas.json file
            </span>
            <span className="text-[10px] text-[#8e8b82] mt-0.5">Loads into free play</span>
            <input type="file" accept=".json,.nncanvas.json" onChange={handleFileUpload} className="hidden" />
          </label>

          {importError && (
            <p className="text-xs text-[#c64545] font-medium">{importError}</p>
          )}
        </div>
      </div>
    </div>
  );
}

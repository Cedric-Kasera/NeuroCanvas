'use client';

import React from 'react';
import { useUIStore } from '@/lib/state/uiStore';
import { X } from 'lucide-react';

export function ShortcutsModal() {
  const open = useUIStore((s) => s.shortcutsModalOpen);
  const setOpen = useUIStore((s) => s.setShortcutsModalOpen);

  if (!open) return null;

  const shortcuts = [
    { key: 'Delete / Backspace', desc: 'Delete selected card or connection' },
    { key: 'Ctrl + Z / ⌘Z', desc: 'Undo last canvas change' },
    { key: 'Ctrl + Shift + Z / ⌘⇧Z', desc: 'Redo previously undone change' },
    { key: 'Drag handle to handle', desc: 'Connect two neurons with weighted synapse' },
    { key: 'Click weight badge', desc: 'Quick-adjust connection weight slider' },
    { key: 'Shift + Drag on canvas', desc: 'Box multi-select nodes' },
    { key: '?', desc: 'Toggle keyboard shortcuts help' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] p-5 shadow-2xl text-[#141413] dark:text-[#faf9f5]">
        <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-3 mb-4">
          <h3 className="font-serif text-base font-bold">Keyboard Shortcuts</h3>
          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-2 text-xs">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-1.5 border-b border-[#e6dfd8]/60 dark:border-[#383531]/60"
            >
              <span className="text-[#6c6a64] dark:text-[#a09d96]">{sc.desc}</span>
              <kbd className="px-2 py-1 rounded bg-[#efe9de] dark:bg-[#252320] font-mono text-[11px] font-semibold text-[#141413] dark:text-[#faf9f5]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={() => setOpen(false)}
          className="mt-5 w-full py-2 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-xs font-medium text-white transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

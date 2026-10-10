'use client';

import React, { useState, useEffect } from 'react';
import { useUIStore } from '@/lib/state/uiStore';
import { CheckCircle, AlertCircle, Info, XCircle, WifiOff } from 'lucide-react';

export function ToastContainer() {
  const toasts = useUIStore((s) => s.toasts);
  const removeToast = useUIStore((s) => s.removeToast);
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof window === 'undefined') return true;
    return navigator.onLine;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return (
    <>
      {/* Offline Toast */}
      {!isOnline && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-xl bg-[#e8a55a] text-[#141413] px-3.5 py-1.5 text-xs font-medium shadow-lg animate-bounce">
          <WifiOff size={14} />
          <span>Offline Mode — All network calculations run 100% locally on your device.</span>
        </div>
      )}

      {/* Floating Notifications */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          let Icon = Info;
          let color = 'text-[#cc785c] border-[#cc785c]/30';
          if (toast.type === 'success') {
            Icon = CheckCircle;
            color = 'text-[#5db872] border-[#5db872]/30';
          } else if (toast.type === 'warn') {
            Icon = AlertCircle;
            color = 'text-[#e8a55a] border-[#e8a55a]/30';
          } else if (toast.type === 'error') {
            Icon = XCircle;
            color = 'text-[#c64545] border-[#c64545]/30';
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-center gap-2 rounded-xl border bg-[#faf9f5] dark:bg-[#1f1e1b] px-3.5 py-2.5 text-xs font-medium shadow-lg text-[#141413] dark:text-[#faf9f5] ${color}`}
            >
              <Icon size={15} className="shrink-0" />
              <span className="flex-1">{toast.message}</span>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5] ml-2 text-xs"
              >
                ✕
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

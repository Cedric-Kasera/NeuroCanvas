'use client';

import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    return !/android|iphone|ipad|ipod|windows phone|mobile/.test(ua);
  });
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      // Only capture and show install for desktop
      if (isDesktop) {
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isDesktop]);

  if (!isDesktop || isInstalled || !deferredPrompt) return null;

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } catch {
      // Ignored
    }
  };

  return (
    <button
      onClick={handleInstallClick}
      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors shadow-2xs"
      title="Install NeuroCanvas Desktop App (PWA)"
    >
      <Download size={13} className="text-[#cc785c]" />
      <span className="hidden sm:inline">Install Desktop App</span>
    </button>
  );
}

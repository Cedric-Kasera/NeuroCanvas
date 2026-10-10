'use client';

import React, { useState, useEffect } from 'react';
import { Download, Monitor, X, Check, Laptop } from 'lucide-react';
import { AppLogo } from '@/components/ui/AppLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);

  // Lazy initializers to avoid hydration mismatches and eliminate setState inside useEffect
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    const ua = window.navigator.userAgent.toLowerCase();
    const isMobileUA = /android|iphone|ipad|ipod|windows phone|mobile|blackberry|opera mini|tablet/i.test(ua);
    const isWideViewport = window.innerWidth >= 768;
    return !isMobileUA && isWideViewport;
  });

  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  const [isDismissed, setIsDismissed] = useState(() => {
    if (typeof window === 'undefined') return false;
    try {
      return sessionStorage.getItem('pwa_desktop_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Handle viewport resize (e.g. if developer tools simulate mobile or window resized)
    const handleResize = () => {
      const ua = window.navigator.userAgent.toLowerCase();
      const isMobileUA = /android|iphone|ipad|ipod|windows phone|mobile|blackberry|opera mini|tablet/i.test(ua);
      const isWide = window.innerWidth >= 768;
      setIsDesktop(!isMobileUA && isWide);
    };

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setTimeout(() => {
        setIsDismissed(true);
      }, 4000);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Strict desktop-only condition:
  // 1. Must be desktop (not mobile UA and >=768px)
  // 2. Must not be already installed or running in standalone mode
  // 3. Must not be dismissed by user
  if (!isDesktop || isInstalled || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('pwa_desktop_banner_dismissed', 'true');
    } catch {
      // Ignored
    }
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setInstalledSuccess(true);
          setDeferredPrompt(null);
          setTimeout(() => {
            setIsDismissed(true);
          }, 4000);
        }
      } catch {
        setShowManualGuide(true);
      }
    } else {
      // Browser didn't dispatch prompt yet or requires address bar trigger (Safari / Firefox / Chromium)
      setShowManualGuide((prev) => !prev);
    }
  };

  return (
    <aside
      aria-label="Desktop App Installation Banner"
      className="hidden md:flex fixed bottom-5 right-5 z-50 flex-col w-[350px] max-w-[calc(100vw-2.5rem)] rounded-2xl border border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5]/95 dark:bg-[#1a1917]/95 text-[#141413] dark:text-[#faf9f5] backdrop-blur-md shadow-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      {/* Header Row: Logo, Desktop Badge, Dismiss Button */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <AppLogo className="h-5 w-auto" />
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider bg-[#cc785c]/10 text-[#cc785c] border border-[#cc785c]/20">
            <Monitor size={10} />
            Desktop App
          </span>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-[#8c8983] hover:text-[#141413] dark:hover:text-white hover:bg-[#efe9de] dark:hover:bg-[#252320] transition-colors"
          title="Dismiss banner"
          aria-label="Dismiss banner"
        >
          <X size={15} />
        </button>
      </div>

      {/* Main Body */}
      {installedSuccess ? (
        <div className="flex items-center gap-2 py-2 text-xs font-medium text-[#5db872]">
          <Check size={16} />
          <span>NeuroCanvas has been installed to your desktop!</span>
        </div>
      ) : (
        <>
          <h4 className="text-sm font-semibold text-[#141413] dark:text-[#faf9f5] leading-snug">
            Install NeuroCanvas for Desktop
          </h4>
          <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] mt-1 leading-relaxed">
            Run natively on macOS, Windows, or Linux with full keyboard shortcuts, smooth hardware acceleration, and complete offline simulation.
          </p>

          {showManualGuide && (
            <div className="mt-2.5 p-2 rounded-xl bg-[#efe9de]/70 dark:bg-[#252320]/70 border border-[#e6dfd8] dark:border-[#383531] text-[11px] text-[#6c6a64] dark:text-[#a09d96] space-y-1">
              <p className="font-medium text-[#141413] dark:text-[#faf9f5]">Browser installation tip:</p>
              <p>
                Click the <span className="font-semibold text-[#cc785c]">Install icon (⤓)</span> in your browser’s address bar, or open the browser menu <span className="font-semibold">⋮ &gt; Save and share &gt; Install NeuroCanvas</span>.
              </p>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-3.5 flex items-center justify-between gap-2 pt-1 border-t border-[#e6dfd8]/70 dark:border-[#383531]/70">
            <button
              onClick={handleDismiss}
              className="text-xs text-[#8c8983] hover:text-[#141413] dark:hover:text-[#faf9f5] px-2 py-1.5 transition-colors font-medium"
            >
              Not now
            </button>
            <button
              onClick={handleInstallClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#b8674d] text-white text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              <Download size={13} />
              <span>Install Desktop App</span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

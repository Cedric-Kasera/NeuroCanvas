import { create } from 'zustand';

export interface ToastItem {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warn' | 'error';
}

interface UIStoreState {
  leftOpen: boolean;
  rightOpen: boolean;
  leftTab: 'network' | 'layers' | 'concepts' | 'templates' | 'saved';
  rightTab: 'inspector' | 'lesson';
  mode: 'beginner' | 'student';
  theme: 'light' | 'dark';
  currentRoute: 'landing' | 'learn' | 'play';
  isMobileDrawerOpen: boolean;
  isMobileSheetOpen: boolean;

  // Modals
  shortcutsModalOpen: boolean;
  shareModalOpen: boolean;
  exportModalOpen: boolean;
  aboutModalOpen: boolean;

  toasts: ToastItem[];

  // Actions
  setLeftOpen: (open: boolean) => void;
  setRightOpen: (open: boolean) => void;
  setLeftTab: (tab: 'network' | 'layers' | 'concepts' | 'templates' | 'saved') => void;
  setRightTab: (tab: 'inspector' | 'lesson') => void;
  setMode: (mode: 'beginner' | 'student') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setCurrentRoute: (route: 'landing' | 'learn' | 'play') => void;
  setMobileDrawerOpen: (open: boolean) => void;
  setMobileSheetOpen: (open: boolean) => void;
  setShortcutsModalOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setAboutModalOpen: (open: boolean) => void;

  showToast: (message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStoreState>((set, get) => ({
  leftOpen: true,
  rightOpen: true,
  leftTab: 'network',
  rightTab: 'inspector',
  mode: 'beginner',
  theme: 'light',
  currentRoute: 'landing',
  isMobileDrawerOpen: false,
  isMobileSheetOpen: false,

  shortcutsModalOpen: false,
  shareModalOpen: false,
  exportModalOpen: false,
  aboutModalOpen: false,

  toasts: [],

  setLeftOpen: (open) => set({ leftOpen: open }),
  setRightOpen: (open) => set({ rightOpen: open }),
  setLeftTab: (tab) => set({ leftTab: tab, leftOpen: true }),
  setRightTab: (tab) => set({ rightTab: tab, rightOpen: true }),
  setMode: (mode) => set({ mode }),
  setTheme: (theme) => {
    set({ theme });
    if (typeof document !== 'undefined') {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },
  setCurrentRoute: (route) => set({ currentRoute: route }),
  setMobileDrawerOpen: (open) => set({ isMobileDrawerOpen: open }),
  setMobileSheetOpen: (open) => set({ isMobileSheetOpen: open }),
  setShortcutsModalOpen: (open) => set({ shortcutsModalOpen: open }),
  setShareModalOpen: (open) => set({ shareModalOpen: open }),
  setExportModalOpen: (open) => set({ exportModalOpen: open }),
  setAboutModalOpen: (open) => set({ aboutModalOpen: open }),

  showToast: (message, type = 'info') => {
    const id = `toast_${Date.now()}_${Math.random()}`;
    set((s) => ({
      toasts: [...s.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      get().removeToast(id);
    }, 3800);
  },

  removeToast: (id) => {
    set((s) => ({
      toasts: s.toasts.filter((t) => t.id !== id),
    }));
  },
}));

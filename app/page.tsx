'use client';

import React, { useEffect } from 'react';
import { useUIStore } from '@/lib/state/uiStore';
import { LandingView } from '@/components/views/LandingView';
import { LessonListView } from '@/components/views/LessonListView';
import { PlayView } from '@/components/views/PlayView';

export default function HomePage() {
  const currentRoute = useUIStore((s) => s.currentRoute);
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash === '#learn') {
        setCurrentRoute('learn');
      } else if (hash === '#play' || hash.startsWith('#s=')) {
        setCurrentRoute('play');
      }
    }
  }, [setCurrentRoute]);

  if (currentRoute === 'landing') {
    return <LandingView />;
  }

  if (currentRoute === 'learn') {
    return <LessonListView />;
  }

  return <PlayView />;
}

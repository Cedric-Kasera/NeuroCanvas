'use client';

import React, { useEffect } from 'react';
import { useUIStore } from '@/lib/state/uiStore';
import { LandingView } from '@/components/views/LandingView';
import { LessonListView } from '@/components/views/LessonListView';
import { PlayView } from '@/components/views/PlayView';
import { ProjectsView } from '@/components/views/ProjectsView';
import { ProjectDetailView } from '@/components/views/ProjectDetailView';
import { TeacherModeView } from '@/components/views/TeacherModeView';
import { VerifyView } from '@/components/views/VerifyView';
import { LabView } from '@/components/views/LabView';
import { ExperimentDetailView } from '@/components/views/ExperimentDetailView';
import { GamesView } from '@/components/views/GamesView';
import { AssignmentView } from '@/components/views/AssignmentView';

export default function HomePage() {
  const currentRoute = useUIStore((s) => s.currentRoute);
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const setActiveProjectId = useUIStore((s) => s.setActiveProjectId);
  const setActiveExperimentId = useUIStore((s) => s.setActiveExperimentId);
  const setActiveAssignmentPayload = useUIStore((s) => s.setActiveAssignmentPayload);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleHashChange = () => {
        const hash = window.location.hash;
        if (!hash || hash === '#') {
          return;
        }

        if (hash === '#learn') {
          setCurrentRoute('learn');
        } else if (hash === '#play' || hash.startsWith('#s=')) {
          setCurrentRoute('play');
        } else if (hash === '#projects') {
          setCurrentRoute('projects');
        } else if (hash.startsWith('#projects/')) {
          const id = hash.replace('#projects/', '');
          setActiveProjectId(id);
          setCurrentRoute('project-detail');
        } else if (hash === '#teach') {
          setCurrentRoute('teach');
        } else if (hash === '#verify') {
          setCurrentRoute('verify');
        } else if (hash === '#lab') {
          setCurrentRoute('lab');
        } else if (hash.startsWith('#lab/')) {
          const id = hash.replace('#lab/', '');
          setActiveExperimentId(id);
          setCurrentRoute('experiment-detail');
        } else if (hash === '#games' || hash === '#play/games') {
          setCurrentRoute('games');
        } else if (hash === '#daily' || hash === '#play/daily') {
          setCurrentRoute('games');
        } else if (hash.startsWith('#a=') || hash.startsWith('#/a/')) {
          const payload = hash.startsWith('#a=') ? hash.replace('#a=', '') : hash.replace('#/a/', '');
          setActiveAssignmentPayload(payload);
          setCurrentRoute('assignment');
        }
      };

      handleHashChange();
      window.addEventListener('hashchange', handleHashChange);
      return () => window.removeEventListener('hashchange', handleHashChange);
    }
  }, [setCurrentRoute, setActiveProjectId, setActiveExperimentId, setActiveAssignmentPayload]);

  switch (currentRoute) {
    case 'landing':
      return <LandingView />;
    case 'learn':
      return <LessonListView />;
    case 'projects':
      return <ProjectsView />;
    case 'project-detail':
      return <ProjectDetailView />;
    case 'teach':
      return <TeacherModeView />;
    case 'verify':
      return <VerifyView />;
    case 'lab':
      return <LabView />;
    case 'experiment-detail':
      return <ExperimentDetailView />;
    case 'games':
      return <GamesView />;
    case 'assignment':
      return <AssignmentView />;
    case 'play':
    default:
      return <PlayView />;
  }
}

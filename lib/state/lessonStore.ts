import { create } from 'zustand';
import { LESSONS, Lesson, LessonStep } from '../content/lessons';
import { useCanvasStore } from './canvasStore';
import { saveLessonProgress, getAllLessonProgress } from '../persistence/db';
import { LessonProgress } from '../persistence/schema';
import { useUIStore } from './uiStore';
import confetti from 'canvas-confetti';

interface LessonStoreState {
  currentLessonId: string | null;
  stepIndex: number;
  completedLessons: Record<string, boolean>;
  gatePassed: boolean;
  quizAnswers: Record<string, any>; // maps stepId or quizId to user answer
  quizAnsweredIndex: number | null; // current step selected option
  isCompletedModalOpen: boolean;

  // Actions
  initializeProgress: () => Promise<void>;
  startLesson: (lessonId: string) => void;
  clearLesson: () => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  skipStep: () => void;
  answerQuiz: (answer: any) => void;
  markLessonComplete: (lessonId?: string) => void;
  resetLessonCanvas: () => void;
  closeCompleteModal: () => void;
  getCurrentLesson: () => Lesson | null;
  getCurrentStep: () => LessonStep | null;
  isLessonFullyAnswered: (lessonId?: string) => boolean;
}

export const useLessonStore = create<LessonStoreState>((set, get) => ({
  currentLessonId: null,
  stepIndex: 0,
  completedLessons: {},
  gatePassed: true,
  quizAnswers: {},
  quizAnsweredIndex: null,
  isCompletedModalOpen: false,

  initializeProgress: async () => {
    try {
      const all = await getAllLessonProgress();
      const completed: Record<string, boolean> = {};
      for (const [id, progress] of Object.entries(all)) {
        if (progress.completed) completed[id] = true;
      }
      set({ completedLessons: completed });
    } catch (err) {
      console.warn('Could not load lesson progress from DB', err);
    }
  },

  startLesson: (lessonId: string) => {
    const lesson = LESSONS.find((l) => l.id === lessonId);
    if (!lesson) return;

    const firstStep = lesson.steps[0];
    const initialCanvas = firstStep?.stepCanvas || lesson.startCanvas;

    // Load initial progressive canvas
    useCanvasStore.getState().loadCanvas(initialCanvas);

    set({
      currentLessonId: lessonId,
      stepIndex: 0,
      gatePassed: true,
      quizAnsweredIndex: null,
      isCompletedModalOpen: false,
    });

    // Automatically focus right sidebar on Lesson tab
    useUIStore.getState().setRightTab('lesson');
    useUIStore.getState().setRightOpen(true);

    if (firstStep?.highlight) {
      useCanvasStore.getState().setHighlights(firstStep.highlight.nodeIds, firstStep.highlight.edgeIds);
    } else {
      useCanvasStore.getState().setHighlights([], []);
    }
  },

  clearLesson: () => {
    set({
      currentLessonId: null,
      stepIndex: 0,
      quizAnsweredIndex: null,
    });
  },

  nextStep: () => {
    const lesson = get().getCurrentLesson();
    if (!lesson) return;

    const nextIdx = get().stepIndex + 1;
    if (nextIdx >= lesson.steps.length) {
      // Completed lesson
      get().markLessonComplete(lesson.id);
      return;
    }

    const step = lesson.steps[nextIdx];
    // Gradually add or transition canvas nodes for this step
    if (step?.stepCanvas) {
      useCanvasStore.getState().loadCanvas(step.stepCanvas);
    }

    set({
      stepIndex: nextIdx,
      quizAnsweredIndex: null,
      gatePassed: true,
    });

    if (step?.highlight) {
      useCanvasStore.getState().setHighlights(step.highlight.nodeIds, step.highlight.edgeIds);
    } else {
      useCanvasStore.getState().setHighlights([], []);
    }
  },

  prevStep: () => {
    const lesson = get().getCurrentLesson();
    if (!lesson || get().stepIndex <= 0) return;

    const prevIdx = get().stepIndex - 1;
    const step = lesson.steps[prevIdx];
    if (step?.stepCanvas) {
      useCanvasStore.getState().loadCanvas(step.stepCanvas);
    }

    set({
      stepIndex: prevIdx,
      quizAnsweredIndex: null,
      gatePassed: true,
    });

    if (step?.highlight) {
      useCanvasStore.getState().setHighlights(step.highlight.nodeIds, step.highlight.edgeIds);
    } else {
      useCanvasStore.getState().setHighlights([], []);
    }
  },

  goToStep: (index: number) => {
    const lesson = get().getCurrentLesson();
    if (!lesson || index < 0 || index >= lesson.steps.length) return;

    const step = lesson.steps[index];
    if (step?.stepCanvas) {
      useCanvasStore.getState().loadCanvas(step.stepCanvas);
    }

    set({
      stepIndex: index,
      quizAnsweredIndex: null,
    });

    if (step?.highlight) {
      useCanvasStore.getState().setHighlights(step.highlight.nodeIds, step.highlight.edgeIds);
    } else {
      useCanvasStore.getState().setHighlights([], []);
    }
  },

  skipStep: () => {
    get().nextStep();
  },

  answerQuiz: (answer: any) => {
    const step = get().getCurrentStep();
    if (!step) return;

    const key = step.quiz?.id || step.id;
    const updated = { ...get().quizAnswers, [key]: answer };

    set({
      quizAnswers: updated,
      quizAnsweredIndex: typeof answer === 'number' ? answer : 0,
    });
  },

  markLessonComplete: (targetLessonId?: string) => {
    const lesson = targetLessonId
      ? LESSONS.find((l) => l.id === targetLessonId)
      : get().getCurrentLesson();
    if (!lesson) return;

    const updated = { ...get().completedLessons, [lesson.id]: true };
    set({
      completedLessons: updated,
      isCompletedModalOpen: true,
    });

    // Save to persistence
    const progress: LessonProgress = {
      lessonId: lesson.id,
      completedStepIds: lesson.steps.map((s) => s.id),
      completed: true,
      updatedAt: new Date().toISOString(),
    };
    saveLessonProgress(progress);

    // Celebrate with confetti
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#cc785c', '#5db8a6', '#e8a55a', '#141413'],
      });
    } catch {}
  },

  resetLessonCanvas: () => {
    const lesson = get().getCurrentLesson();
    if (!lesson) return;
    const step = lesson.steps[get().stepIndex];
    useCanvasStore.getState().loadCanvas(step?.stepCanvas || lesson.startCanvas);
    if (step?.highlight) {
      useCanvasStore.getState().setHighlights(step.highlight.nodeIds, step.highlight.edgeIds);
    }
  },

  closeCompleteModal: () => {
    set({ isCompletedModalOpen: false });
  },

  getCurrentLesson: () => {
    const { currentLessonId } = get();
    return LESSONS.find((l) => l.id === currentLessonId) || null;
  },

  getCurrentStep: () => {
    const lesson = get().getCurrentLesson();
    if (!lesson) return null;
    return lesson.steps[get().stepIndex] || null;
  },

  isLessonFullyAnswered: (targetLessonId?: string) => {
    const lesson = targetLessonId
      ? LESSONS.find((l) => l.id === targetLessonId)
      : get().getCurrentLesson();
    if (!lesson) return true;

    const quizzes = lesson.steps.filter((s) => !!s.quiz);
    if (quizzes.length === 0) return true;

    const answers = get().quizAnswers;
    return quizzes.every((s) => {
      const qKey = s.quiz!.id || s.id;
      return answers[qKey] !== undefined;
    });
  },
}));

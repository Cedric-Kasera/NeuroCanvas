'use client';

import React, { useState } from 'react';
import {
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Check,
} from 'lucide-react';
import { useLessonStore } from '@/lib/state/lessonStore';
import { useUIStore } from '@/lib/state/uiStore';
import { GLOSSARY } from '@/lib/content/glossary';
import { FormattedMath } from '@/components/ui/FormattedMath';
import { LESSONS } from '@/lib/content/lessons';

export function LessonPanel() {
  const [activeGlossaryTerm, setActiveGlossaryTerm] = useState<string | null>(null);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [numericInput, setNumericInput] = useState<string>('');

  const getCurrentLesson = useLessonStore((s) => s.getCurrentLesson);
  const getCurrentStep = useLessonStore((s) => s.getCurrentStep);
  const stepIndex = useLessonStore((s) => s.stepIndex);
  const nextStep = useLessonStore((s) => s.nextStep);
  const prevStep = useLessonStore((s) => s.prevStep);
  const goToStep = useLessonStore((s) => s.goToStep);
  const skipStep = useLessonStore((s) => s.skipStep);
  const resetLessonCanvas = useLessonStore((s) => s.resetLessonCanvas);
  const answerQuiz = useLessonStore((s) => s.answerQuiz);
  const quizAnswers = useLessonStore((s) => s.quizAnswers);
  const markLessonComplete = useLessonStore((s) => s.markLessonComplete);
  const completedLessons = useLessonStore((s) => s.completedLessons);
  const isLessonFullyAnswered = useLessonStore((s) => s.isLessonFullyAnswered);
  const startLesson = useLessonStore((s) => s.startLesson);

  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const mode = useUIStore((s) => s.mode);

  const lesson = getCurrentLesson();
  const step = getCurrentStep();

  // If no active lesson, render Free Play guide
  if (!lesson || !step) {
    return (
      <div className="p-5 text-center py-12 space-y-4 text-xs text-[#6c6a64] dark:text-[#a09d96]">
        <div className="w-12 h-12 rounded-2xl bg-[#efe9de] dark:bg-[#252320] text-[#cc785c] flex items-center justify-center mx-auto shadow-2xs">
          <Sparkles size={22} />
        </div>
        <div className="space-y-1">
          <h3 className="font-serif text-base font-bold text-[#141413] dark:text-[#faf9f5]">
            Free Play Mode
          </h3>
          <p className="text-xs leading-relaxed max-w-xs mx-auto">
            You are currently on an open canvas. Add inputs, connect neurons, adjust weights, and simulate custom architectures freely.
          </p>
        </div>

        <div className="pt-2 space-y-2">
          <button
            onClick={() => startLesson('neuron')}
            className="w-full py-2.5 px-4 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <BookOpen size={14} />
            <span>Start Lesson 1: A Single Neuron</span>
          </button>
          <button
            onClick={() => setCurrentRoute('learn')}
            className="w-full py-2 px-3 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
          >
            Browse All 9 Guided Lessons
          </button>
        </div>
      </div>
    );
  }

  const isCompleted = !!completedLessons[lesson.id];
  const allQuizzesDone = isLessonFullyAnswered(lesson.id);
  const isLastStep = stepIndex === lesson.steps.length - 1;

  // Key for the current quiz question
  const quizKey = step.quiz?.id || step.id;
  const currentAnswer = quizAnswers[quizKey];
  const hasAnswered = currentAnswer !== undefined;

  // Parse {{term}} in body into interactive glossary tooltips
  const renderFormattedBody = (text: string) => {
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, idx) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const rawTerm = part.slice(2, -2).toLowerCase().trim();
        const entry = GLOSSARY[rawTerm];
        return (
          <span
            key={idx}
            onClick={() => setActiveGlossaryTerm(rawTerm)}
            className="underline decoration-[#cc785c] decoration-dashed underline-offset-4 cursor-pointer font-medium text-[#cc785c] hover:text-[#a9583e] transition-colors"
            title={entry ? `${entry.term}: ${entry.shortDef}` : 'View glossary definition'}
          >
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#faf9f5] dark:bg-[#181715] text-[#141413] dark:text-[#faf9f5] select-none">
      {/* Header bar */}
      <div className="p-3.5 border-b border-[#e6dfd8] dark:border-[#383531] space-y-2 bg-[#faf9f5] dark:bg-[#181715]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#cc785c] bg-[#cc785c]/10 px-2 py-0.5 rounded-full">
              Lesson {lesson.order}
            </span>
            {isCompleted && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#5db872] bg-[#5db872]/10 px-2 py-0.5 rounded-full">
                <Check size={10} /> Completed
              </span>
            )}
          </div>
          <button
            onClick={resetLessonCanvas}
            className="p-1 rounded-lg hover:bg-[#efe9de] dark:hover:bg-[#252320] text-[#6c6a64] dark:text-[#a09d96]"
            title="Reset canvas for this step"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div>
          <h2 className="font-serif text-sm font-bold text-[#141413] dark:text-[#faf9f5] leading-tight">
            {lesson.title}
          </h2>
          <p className="text-[11px] text-[#6c6a64] dark:text-[#a09d96] truncate mt-0.5">
            {lesson.summary}
          </p>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1 pt-1">
          {lesson.steps.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => goToStep(idx)}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                idx === stepIndex
                  ? 'bg-[#cc785c]'
                  : idx < stepIndex
                  ? 'bg-[#5db872]'
                  : 'bg-[#e6dfd8] dark:bg-[#383531]'
              }`}
              title={`Step ${idx + 1}: ${s.title}`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        <div>
          <span className="text-[10px] font-mono text-[#8e8b82] block mb-1">
            Step {stepIndex + 1} of {lesson.steps.length}
          </span>
          <h3 className="font-serif text-base font-bold text-[#141413] dark:text-[#faf9f5] mb-2">
            {step.title}
          </h3>
          <div className="text-xs leading-relaxed text-[#3d3d3a] dark:text-[#efe9de] whitespace-pre-wrap space-y-2">
            {renderFormattedBody(step.body)}
          </div>
        </div>

        {/* Math Callout formatted as printed textbook */}
        {step.mathBody && (
          <div className="rounded-xl border border-[#cc785c]/30 bg-white dark:bg-[#1f1e1b] p-3 space-y-1 shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-[#cc785c] block tracking-wider">
              Mathematical Formula
            </span>
            <FormattedMath math={step.mathBody} displayMode={true} />
          </div>
        )}

        {/* Interactive Step Quiz (MCQ, True/False, or Numeric) */}
        {step.quiz && (
          <div className="rounded-xl border border-[#e6dfd8] dark:border-[#383531] bg-white dark:bg-[#1f1e1b] p-3 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[#cc785c] tracking-wider">
                Quick Intuition Check
              </span>
              {step.quiz.hint && (
                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-[10px] text-[#8e8b82] hover:text-[#cc785c] flex items-center gap-1"
                >
                  <HelpCircle size={11} />
                  <span>{showHint ? 'Hide Hint' : 'Hint'}</span>
                </button>
              )}
            </div>

            {showHint && step.quiz.hint && (
              <p className="text-[11px] p-2 rounded-lg bg-[#faf9f5] dark:bg-[#252320] border border-[#e6dfd8] dark:border-[#383531] text-[#6c6a64] dark:text-[#a09d96] italic">
                💡 {step.quiz.hint}
              </p>
            )}

            <p className="font-semibold text-xs text-[#141413] dark:text-[#faf9f5] leading-snug">
              {step.quiz.q}
            </p>

            {/* MCQ Type */}
            {step.quiz.type === 'mcq' && step.quiz.options && (
              <div className="space-y-1.5">
                {step.quiz.options.map((opt, oIdx) => {
                  const isSelected = currentAnswer === oIdx;
                  const isCorrectOption = oIdx === step.quiz!.correct;
                  const answered = hasAnswered;

                  let btnStyle = 'border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] hover:border-[#cc785c]';
                  if (answered) {
                    if (isCorrectOption) btnStyle = 'border-[#5db872] bg-[#f0f9f3] text-[#5db872] dark:bg-[#1a291e] font-semibold';
                    else if (isSelected) btnStyle = 'border-[#c64545] bg-[#fdf2f2] text-[#c64545] dark:bg-[#291a1a]';
                  }

                  return (
                    <button
                      key={oIdx}
                      onClick={() => answerQuiz(oIdx)}
                      className={`w-full text-left p-2 rounded-lg border text-xs font-medium transition-all ${btnStyle}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* True / False Type */}
            {step.quiz.type === 'tf' && (
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'True', val: true },
                  { label: 'False', val: false },
                ].map((item) => {
                  const isSelected = currentAnswer === item.val;
                  const isCorrect = step.quiz!.answerBool === item.val;
                  const answered = hasAnswered;

                  let btnStyle = 'border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] hover:border-[#cc785c]';
                  if (answered) {
                    if (isCorrect) btnStyle = 'border-[#5db872] bg-[#f0f9f3] text-[#5db872] dark:bg-[#1a291e] font-semibold';
                    else if (isSelected) btnStyle = 'border-[#c64545] bg-[#fdf2f2] text-[#c64545] dark:bg-[#291a1a]';
                  }

                  return (
                    <button
                      key={item.label}
                      onClick={() => answerQuiz(item.val)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold text-center transition-all ${btnStyle}`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Numeric Type */}
            {step.quiz.type === 'numeric' && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="Enter value..."
                    value={numericInput}
                    onChange={(e) => setNumericInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-[#e6dfd8] dark:border-[#383531] bg-[#faf9f5] dark:bg-[#181715] text-xs font-mono outline-none focus:border-[#cc785c]"
                  />
                  <button
                    onClick={() => {
                      const parsed = parseFloat(numericInput);
                      if (!isNaN(parsed)) {
                        answerQuiz(parsed);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-medium"
                  >
                    Check
                  </button>
                </div>
              </div>
            )}

            {/* Quiz Result & Explanation */}
            {hasAnswered && (
              <div className="pt-2 border-t border-[#e6dfd8] dark:border-[#383531] text-[11px] leading-relaxed text-[#6c6a64] dark:text-[#a09d96]">
                {(() => {
                  let isUserCorrect = false;
                  if (step.quiz.type === 'mcq') {
                    isUserCorrect = currentAnswer === step.quiz.correct;
                  } else if (step.quiz.type === 'tf') {
                    isUserCorrect = currentAnswer === step.quiz.answerBool;
                  } else if (step.quiz.type === 'numeric') {
                    const tol = step.quiz.tolerance ?? 0.05;
                    isUserCorrect = Math.abs(Number(currentAnswer) - Number(step.quiz.answerNum)) <= tol;
                  }

                  return (
                    <>
                      <strong className={isUserCorrect ? 'text-[#5db872]' : 'text-[#c64545]'}>
                        {isUserCorrect ? 'Correct! ' : 'Not quite. '}
                      </strong>
                      {step.quiz.explain}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Mark Lesson Complete Callout */}
        <div className="pt-2">
          {isCompleted ? (
            <div className="p-3 rounded-xl border border-[#5db872]/40 bg-[#f0f9f3] dark:bg-[#1a291e] flex items-center justify-between text-xs text-[#5db872]">
              <span className="font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Lesson Completed!
              </span>
              <button
                onClick={() => markLessonComplete(lesson.id)}
                className="text-[11px] underline font-medium hover:opacity-80"
              >
                Review Certificate
              </button>
            </div>
          ) : (
            <button
              onClick={() => markLessonComplete(lesson.id)}
              disabled={!allQuizzesDone && !isLastStep}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                allQuizzesDone || isLastStep
                  ? 'border-[#5db872] bg-[#5db872] text-white shadow-xs hover:bg-[#4ea361]'
                  : 'border-[#e6dfd8] dark:border-[#383531] bg-[#efe9de]/50 dark:bg-[#252320]/50 text-[#8e8b82] cursor-not-allowed'
              }`}
              title={
                allQuizzesDone || isLastStep
                  ? 'Mark this lesson complete and earn badge'
                  : 'Complete quizzes and reach recap to mark complete'
              }
            >
              <CheckCircle2 size={14} />
              <span>
                {allQuizzesDone || isLastStep
                  ? 'Mark Lesson Complete'
                  : 'Answer quizzes to mark complete'}
              </span>
            </button>
          )}
        </div>

        {/* Glossary popup sheet if active */}
        {activeGlossaryTerm && GLOSSARY[activeGlossaryTerm] && (
          <div className="rounded-xl border border-[#cc785c]/40 bg-[#faf9f5] dark:bg-[#252320] p-3 shadow-md space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-[#cc785c]">
                {GLOSSARY[activeGlossaryTerm].term}
              </span>
              <button
                onClick={() => setActiveGlossaryTerm(null)}
                className="text-xs text-[#8e8b82] hover:text-[#141413] dark:hover:text-white"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-[#3d3d3a] dark:text-[#efe9de] leading-relaxed">
              {GLOSSARY[activeGlossaryTerm].fullDef}
            </p>
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div className="p-3 border-t border-[#e6dfd8] dark:border-[#383531] flex items-center justify-between gap-2 bg-[#faf9f5] dark:bg-[#181715]">
        <button
          onClick={prevStep}
          disabled={stepIndex <= 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] disabled:opacity-30 text-xs font-medium text-[#141413] dark:text-[#faf9f5] transition-colors"
        >
          <ChevronLeft size={14} />
          <span>Back</span>
        </button>

        <button
          onClick={skipStep}
          className="text-[11px] text-[#8e8b82] hover:underline"
        >
          Skip
        </button>

        <button
          onClick={nextStep}
          className="flex items-center gap-1 px-4 py-1.5 rounded-xl bg-[#cc785c] hover:bg-[#a9583e] text-white text-xs font-medium shadow-xs transition-colors"
        >
          <span>{isLastStep ? 'Finish' : 'Next'}</span>
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

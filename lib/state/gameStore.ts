import { create } from 'zustand';
import {
  TunerLevel,
  CurveRound,
  BlameLevel,
  genTunerLevel,
  genCurveRound,
  genBlameLevel,
  dailySeed,
  shareDailyResult,
} from '@/lib/games/generators';
import { db } from '@/lib/persistence/db';
import { activate } from '@/lib/engine/activations';

export interface GameState {
  // Mode
  gameType: 'tuner' | 'curve' | 'blame' | 'daily' | null;

  // Weight Tuner state
  tunerLevel: TunerLevel | null;
  tunerWeights: number[];
  tunerBias: number;
  tunerMovesUsed: number;
  tunerOutput: number;
  tunerDiff: number;
  tunerSolved: boolean;
  tunerStars: number;

  // Curve Detective state
  curveRounds: CurveRound[];
  curveRoundIndex: number;
  curveSelectedOption: number | null;
  curveScore: number;
  curveRoundSolved: boolean;

  // Blame Game state
  blameLevel: BlameLevel | null;
  blameSelectedEdgeId: string | null;
  blameRevealed: boolean;
  blameIsCorrect: boolean;

  // Daily Challenge state
  dailyActive: boolean;
  dailyDayNumber: number;
  dailyDateKey: string;
  dailyStep: number; // 0 to 4 (5 rounds total: 2 Tuner, 2 Curve, 1 Blame)
  dailyStarsEarned: number[];
  dailyStreak: number;
  dailyCompleted: boolean;

  // Stats
  totalPlays: Record<string, number>;
  bestStars: Record<string, number>;

  // Actions
  initTuner: (difficulty?: 1 | 2 | 3, customSeed?: number) => void;
  updateTunerWeight: (index: number, val: number) => void;
  updateTunerBias: (val: number) => void;
  applyTunerMove: () => void;
  resetTuner: () => void;

  initCurve: (difficulty?: 1 | 2 | 3, customSeed?: number) => void;
  selectCurveOption: (index: number) => void;
  nextCurveRound: () => void;

  initBlame: (customSeed?: number) => void;
  selectBlameEdge: (edgeId: string) => void;
  revealBlame: () => void;

  initDaily: () => Promise<void>;
  advanceDaily: (stars: number) => Promise<void>;
  getDailyShareText: () => string;
}

export const useGameStore = create<GameState>((set, get) => ({
  gameType: null,

  tunerLevel: null,
  tunerWeights: [0, 0],
  tunerBias: 0,
  tunerMovesUsed: 0,
  tunerOutput: 0,
  tunerDiff: 1,
  tunerSolved: false,
  tunerStars: 0,

  curveRounds: [],
  curveRoundIndex: 0,
  curveSelectedOption: null,
  curveScore: 0,
  curveRoundSolved: false,

  blameLevel: null,
  blameSelectedEdgeId: null,
  blameRevealed: false,
  blameIsCorrect: false,

  dailyActive: false,
  dailyDayNumber: 1,
  dailyDateKey: '',
  dailyStep: 0,
  dailyStarsEarned: [0, 0, 0, 0, 0],
  dailyStreak: 1,
  dailyCompleted: false,

  totalPlays: {},
  bestStars: {},

  initTuner: (difficulty = 1, customSeed) => {
    const seed = customSeed !== undefined ? customSeed : Date.now();
    const level = genTunerLevel(seed, difficulty);

    const x1 = level.inputs[0];
    const x2 = level.inputs[1];
    const w1 = level.initialWeights[0];
    const w2 = level.initialWeights[1];
    const b = level.initialBias;
    const z = x1 * w1 + x2 * w2 + b;
    const currentOut = Number(activate(level.activation, z).toFixed(3));
    const diff = Math.abs(currentOut - level.targetOutput);

    set({
      gameType: 'tuner',
      tunerLevel: level,
      tunerWeights: [...level.initialWeights],
      tunerBias: b,
      tunerMovesUsed: 0,
      tunerOutput: currentOut,
      tunerDiff: diff,
      tunerSolved: false,
      tunerStars: 0,
    });
  },

  updateTunerWeight: (index, val) => {
    const { tunerWeights, tunerBias, tunerLevel } = get();
    if (!tunerLevel || get().tunerSolved) return;

    const newWeights = [...tunerWeights];
    newWeights[index] = val;

    const x1 = tunerLevel.inputs[0];
    const x2 = tunerLevel.inputs[1];
    const z = x1 * newWeights[0] + x2 * newWeights[1] + tunerBias;
    const out = Number(activate(tunerLevel.activation, z).toFixed(3));
    const diff = Math.abs(out - tunerLevel.targetOutput);

    set({
      tunerWeights: newWeights,
      tunerOutput: out,
      tunerDiff: diff,
    });
  },

  updateTunerBias: (val) => {
    const { tunerWeights, tunerLevel } = get();
    if (!tunerLevel || get().tunerSolved) return;

    const x1 = tunerLevel.inputs[0];
    const x2 = tunerLevel.inputs[1];
    const z = x1 * tunerWeights[0] + x2 * tunerWeights[1] + val;
    const out = Number(activate(tunerLevel.activation, z).toFixed(3));
    const diff = Math.abs(out - tunerLevel.targetOutput);

    set({
      tunerBias: val,
      tunerOutput: out,
      tunerDiff: diff,
    });
  },

  applyTunerMove: () => {
    const { tunerLevel, tunerDiff, tunerMovesUsed } = get();
    if (!tunerLevel || get().tunerSolved) return;

    const moves = tunerMovesUsed + 1;
    const isHit = tunerDiff <= tunerLevel.tolerance;

    let stars = 0;
    if (isHit) {
      if (moves <= Math.ceil(tunerLevel.maxMoves / 2)) {
        stars = 3;
      } else if (moves <= tunerLevel.maxMoves) {
        stars = 2;
      } else {
        stars = 1;
      }
    }

    set({
      tunerMovesUsed: moves,
      tunerSolved: isHit,
      tunerStars: stars,
    });

    if (isHit && get().dailyActive) {
      get().advanceDaily(stars);
    }
  },

  resetTuner: () => {
    const { tunerLevel } = get();
    if (!tunerLevel) return;
    get().initTuner(tunerLevel.difficulty);
  },

  initCurve: (difficulty = 1, customSeed) => {
    const seed = customSeed !== undefined ? customSeed : Date.now();
    const rounds: CurveRound[] = [];
    for (let i = 0; i < 8; i++) {
      rounds.push(genCurveRound(seed + i * 97, difficulty));
    }

    set({
      gameType: 'curve',
      curveRounds: rounds,
      curveRoundIndex: 0,
      curveSelectedOption: null,
      curveScore: 0,
      curveRoundSolved: false,
    });
  },

  selectCurveOption: (index) => {
    const { curveRounds, curveRoundIndex, curveSelectedOption, curveScore } = get();
    if (curveSelectedOption !== null) return; // already answered

    const round = curveRounds[curveRoundIndex];
    const isCorrect = index === round.correctOptionIndex;
    const newScore = isCorrect ? curveScore + 1 : curveScore;

    set({
      curveSelectedOption: index,
      curveScore: newScore,
      curveRoundSolved: true,
    });

    if (get().dailyActive) {
      get().advanceDaily(isCorrect ? 3 : 1);
    }
  },

  nextCurveRound: () => {
    const { curveRoundIndex, curveRounds } = get();
    if (curveRoundIndex + 1 < curveRounds.length) {
      set({
        curveRoundIndex: curveRoundIndex + 1,
        curveSelectedOption: null,
        curveRoundSolved: false,
      });
    }
  },

  initBlame: (customSeed) => {
    const seed = customSeed !== undefined ? customSeed : Date.now();
    const level = genBlameLevel(seed);

    set({
      gameType: 'blame',
      blameLevel: level,
      blameSelectedEdgeId: null,
      blameRevealed: false,
      blameIsCorrect: false,
    });
  },

  selectBlameEdge: (edgeId) => {
    if (get().blameRevealed) return;
    set({ blameSelectedEdgeId: edgeId });
  },

  revealBlame: () => {
    const { blameLevel, blameSelectedEdgeId } = get();
    if (!blameLevel || !blameSelectedEdgeId || get().blameRevealed) return;

    const isCorrect = blameSelectedEdgeId === blameLevel.winningEdgeId;
    set({
      blameRevealed: true,
      blameIsCorrect: isCorrect,
    });

    if (get().dailyActive) {
      get().advanceDaily(isCorrect ? 3 : 1);
    }
  },

  initDaily: async () => {
    const { dateKey, seed, dayNumber } = dailySeed();

    // Check if already completed today in Dexie
    let completed = false;
    let starsEarned = [0, 0, 0, 0, 0];
    let streak = 1;

    try {
      const stored = await db.dailyResults.get(dateKey);
      if (stored) {
        completed = true;
      }
    } catch {}

    set({
      gameType: 'daily',
      dailyActive: true,
      dailyDateKey: dateKey,
      dailyDayNumber: dayNumber,
      dailyStep: 0,
      dailyStarsEarned: starsEarned,
      dailyStreak: streak,
      dailyCompleted: completed,
    });

    // Start round 0 (Weight Tuner, difficulty 1)
    get().initTuner(1, seed + 10);
  },

  advanceDaily: async (stars) => {
    const { dailyStep, dailyStarsEarned, dailyDateKey, dailyDayNumber, dailyStreak } = get();
    const newStars = [...dailyStarsEarned];
    newStars[dailyStep] = stars;

    const nextStep = dailyStep + 1;
    const { seed } = dailySeed();

    if (nextStep >= 5) {
      // Completed all 5 rounds!
      const totalStars = newStars.reduce((a, b) => a + b, 0);
      set({
        dailyStarsEarned: newStars,
        dailyCompleted: true,
      });

      try {
        await db.dailyResults.put({
          dateKey: dailyDateKey,
          stars: totalStars,
          completedAt: new Date().toISOString(),
        });
      } catch {}
      return;
    }

    set({
      dailyStep: nextStep,
      dailyStarsEarned: newStars,
    });

    // Setup round nextStep
    // Round 0: Tuner D1
    // Round 1: Tuner D2
    // Round 2: Curve D1
    // Round 3: Curve D2
    // Round 4: Blame
    if (nextStep === 1) {
      get().initTuner(2, seed + 20);
    } else if (nextStep === 2) {
      get().initCurve(1, seed + 30);
    } else if (nextStep === 3) {
      get().initCurve(2, seed + 40);
    } else if (nextStep === 4) {
      get().initBlame(seed + 50);
    }
  },

  getDailyShareText: () => {
    const { dailyDayNumber, dailyStarsEarned, dailyStreak } = get();
    const total = dailyStarsEarned.reduce((a, b) => a + b, 0);
    return shareDailyResult(dailyDayNumber, total, dailyStreak);
  },
}));

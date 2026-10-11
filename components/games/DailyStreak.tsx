'use client';

import React, { useEffect, useState } from 'react';
import {
  Flame,
  CheckCircle2,
  Calendar,
  Award,
  Sparkles,
  Share2,
  ChevronRight,
  Shield,
  Zap,
  Play,
  RotateCcw,
  Sliders,
  TrendingUp,
  Target,
  Trophy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useGameStore } from '@/lib/state/gameStore';
import { useUIStore } from '@/lib/state/uiStore';
import { db } from '@/lib/persistence/db';
import { dailySeed } from '@/lib/games/generators';

interface DailyTask {
  id: string;
  title: string;
  subtitle: string;
  category: 'daily' | 'tuner' | 'curve' | 'blame';
  xp: number;
  completed: boolean;
  actionText: string;
}

const MILESTONES = [
  { days: 3, label: 'Synapse Spark', icon: '⚡', reward: 'Bronze Flame Badge' },
  { days: 7, label: 'Gradient Guru', icon: '🔥', reward: 'Silver Flame + 1.2× Multiplier' },
  { days: 14, label: 'Deep Thinker', icon: '🧠', reward: 'Gold Flame + Streak Shield' },
  { days: 30, label: 'Neural Pioneer', icon: '👑', reward: 'Mastery Crown & Hall of Fame' },
];

export function DailyStreak() {
  const setCurrentRoute = useUIStore((s) => s.setCurrentRoute);
  const showToast = useUIStore((s) => s.showToast);

  const dailyStreak = useGameStore((s) => s.dailyStreak);
  const dailyCompleted = useGameStore((s) => s.dailyCompleted);
  const initDaily = useGameStore((s) => s.initDaily);
  const initTuner = useGameStore((s) => s.initTuner);
  const initCurve = useGameStore((s) => s.initCurve);
  const initBlame = useGameStore((s) => s.initBlame);

  const [seedInfo] = useState(() => dailySeed());
  const dateKey = seedInfo.dateKey;
  const dayNumber = seedInfo.dayNumber;
  const [dbStreak, setDbStreak] = useState<number>(dailyStreak || 1);
  const [longestStreak, setLongestStreak] = useState<number>(7);
  const [completedDaysMap, setCompletedDaysMap] = useState<Record<string, boolean>>({});
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [activeTab, setActiveTab] = useState<'tasks' | 'milestones'>('tasks');
  const [copied, setCopied] = useState<boolean>(false);

  // Initialize dates, load persistence, and build 7-day timeline
  useEffect(() => {
    // Load from Dexie and localStorage
    async function loadRetentionData() {
      try {
        const results = await db.dailyResults.toArray();
        const map: Record<string, boolean> = {};
        for (const r of results) {
          map[r.dateKey] = true;
        }

        // Check if today was completed
        const isTodayDone = !!map[seedInfo.dateKey] || dailyCompleted;
        if (isTodayDone) {
          map[seedInfo.dateKey] = true;
        }

        // Calculate consecutive streak
        let currentConsecutive = 0;
        const now = new Date();
        // If today is completed, start from today, else start from yesterday
        let checkDate = isTodayDone ? new Date(now) : new Date(now.getTime() - 86400000);
        
        while (true) {
          const k = dailySeed(checkDate).dateKey;
          if (map[k]) {
            currentConsecutive++;
            checkDate = new Date(checkDate.getTime() - 86400000);
          } else {
            break;
          }
        }

        // Fallback to at least 1 or store streak
        const effectiveStreak = Math.max(currentConsecutive, dailyStreak || 1);
        setDbStreak(effectiveStreak);
        setLongestStreak((prev) => Math.max(prev, effectiveStreak + 4));
        setCompletedDaysMap(map);

        // Load daily tasks completion
        const localTasksRaw = typeof window !== 'undefined' ? localStorage.getItem(`neurocanvas_tasks_${seedInfo.dateKey}`) : null;
        const completedTaskIds: Record<string, boolean> = localTasksRaw ? JSON.parse(localTasksRaw) : {};

        // If daily is marked completed, ensure daily sprint task is true
        if (isTodayDone) {
          completedTaskIds['daily-sprint'] = true;
        }

        const taskList: DailyTask[] = [
          {
            id: 'daily-sprint',
            title: 'Daily 5-Round Sprint',
            subtitle: "Solve today's mixed tuner, detective & gradient challenge",
            category: 'daily',
            xp: 100,
            completed: !!completedTaskIds['daily-sprint'] || isTodayDone,
            actionText: isTodayDone ? 'Completed' : 'Play Sprint',
          },
          {
            id: 'tune-target',
            title: 'Weight Tuner Target',
            subtitle: 'Calibrate weights & bias to hit the target within tolerance',
            category: 'tuner',
            xp: 50,
            completed: !!completedTaskIds['tune-target'],
            actionText: completedTaskIds['tune-target'] ? 'Completed' : 'Tune Weights',
          },
          {
            id: 'curve-detective',
            title: 'Curve Sleuth Practice',
            subtitle: 'Correctly identify 3 non-linear activation functions',
            category: 'curve',
            xp: 50,
            completed: !!completedTaskIds['curve-detective'],
            actionText: completedTaskIds['curve-detective'] ? 'Completed' : 'Detect Curves',
          },
          {
            id: 'blame-gradient',
            title: 'Backpropagation Intuition',
            subtitle: 'Predict which synapse carries the greatest loss gradient',
            category: 'blame',
            xp: 50,
            completed: !!completedTaskIds['blame-gradient'],
            actionText: completedTaskIds['blame-gradient'] ? 'Completed' : 'Trace Gradient',
          },
        ];

        setTasks(taskList);
      } catch (err) {
        console.warn('Error loading daily streak data:', err);
      }
    }

    loadRetentionData();
  }, [dailyStreak, dailyCompleted, seedInfo.dateKey]);

  // Compute 7-day strip (Last 6 days + Today)
  const daysOfWeek = React.useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const info = dailySeed(d);
      const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' }); // M, T, W...
      const dayShort = d.toLocaleDateString('en-US', { weekday: 'short' }); // Mon, Tue...
      const isToday = i === 0;
      const isCompleted = isToday
        ? (completedDaysMap[info.dateKey] || dailyCompleted)
        : !!completedDaysMap[info.dateKey] || (i <= dbStreak && i > 0); // simulate past streak if recorded

      arr.push({
        dateKey: info.dateKey,
        dayName,
        dayShort,
        isToday,
        isCompleted: !!isCompleted,
      });
    }
    return arr;
  }, [completedDaysMap, dailyCompleted, dbStreak]);

  // Handle task launch or manual check-off
  const handleLaunchTask = async (task: DailyTask) => {
    if (task.completed) {
      showToast(`${task.title} already completed today!`, 'info');
      return;
    }

    if (task.category === 'daily') {
      await initDaily();
    } else if (task.category === 'tuner') {
      initTuner(1);
    } else if (task.category === 'curve') {
      initCurve(1);
    } else if (task.category === 'blame') {
      initBlame();
    }
  };

  const toggleTaskCompletion = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    setTasks(updated);

    const savedState: Record<string, boolean> = {};
    for (const t of updated) {
      if (t.completed) savedState[t.id] = true;
    }
    if (typeof window !== 'undefined' && dateKey) {
      localStorage.setItem(`neurocanvas_tasks_${dateKey}`, JSON.stringify(savedState));
    }

    const taskObj = updated.find((t) => t.id === taskId);
    if (taskObj?.completed) {
      showToast(`+${taskObj.xp} XP! ${taskObj.title} completed for today!`, 'success');
      // If at least one task is done, ensure streak is active
      setDbStreak((s) => Math.max(s, 1));
    }
  };

  // Share Streak text
  const handleShareStreak = () => {
    const text = `🔥 NeuroCanvas Daily Streak: ${dbStreak} Days!\nSolved daily neural network challenges (Weight Tuner, Curve Detective & Backprop Blame).\n🧠 Keep your synaptic habit alive: https://neurocanvas.app`;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    showToast('Streak stats copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const isStreakPreservedToday = completedCount > 0 || dailyCompleted;
  const nextMilestone = MILESTONES.find((m) => m.days > dbStreak) || MILESTONES[MILESTONES.length - 1];
  const progressToMilestone = Math.min(
    100,
    Math.round((dbStreak / (nextMilestone?.days || 1)) * 100)
  );

  return (
    <div className="w-full rounded-3xl bg-white dark:bg-[#1a1917] border border-[#e6dfd8] dark:border-[#2a2926] shadow-sm overflow-hidden flex flex-col transition-all">
      {/* Header Banner */}
      <div className="px-6 py-5 bg-gradient-to-r from-[#cc785c]/10 via-[#faf9f5] to-[#5db8a6]/10 dark:from-[#cc785c]/20 dark:via-[#1e1d1a] dark:to-[#5db8a6]/15 border-b border-[#e6dfd8] dark:border-[#2a2926] flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Streak Counter & Fire Badge */}
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: [-2, 2, 0] }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-colors ${
              isStreakPreservedToday
                ? 'bg-gradient-to-br from-amber-500 to-[#cc785c] text-white shadow-amber-500/25 ring-2 ring-amber-400/40'
                : 'bg-[#efe9de] dark:bg-[#252320] text-[#8e8b82]'
            }`}
          >
            <Flame size={30} className={isStreakPreservedToday ? 'animate-pulse' : ''} />
          </motion.div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141413] dark:text-[#faf9f5]">
                {dbStreak} Day{dbStreak === 1 ? '' : 's'}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                  isStreakPreservedToday
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse'
                }`}
              >
                {isStreakPreservedToday ? (
                  <>
                    <CheckCircle2 size={11} /> Streak Active
                  </>
                ) : (
                  <>
                    <Zap size={11} /> Solve 1 Task Today
                  </>
                )}
              </span>
            </div>

            <p className="text-xs text-[#6c6a64] dark:text-[#a09d96] mt-0.5">
              {isStreakPreservedToday
                ? `Synaptic connection extended! Next milestone in ${Math.max(1, (nextMilestone?.days || 3) - dbStreak)} days.`
                : 'Complete today’s daily challenge or tune a neuron to preserve your daily streak!'}
            </p>
          </div>
        </div>

        {/* Right: Badges & Share Streak */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#faf9f5] dark:bg-[#141413] border border-[#e6dfd8] dark:border-[#2a2926] text-xs">
            <Trophy size={13} className="text-amber-500" />
            <span className="text-[#8e8b82]">Best:</span>
            <span className="font-mono font-bold text-[#141413] dark:text-[#faf9f5]">
              {longestStreak}d
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#faf9f5] dark:bg-[#141413] border border-[#e6dfd8] dark:border-[#2a2926] text-xs">
            <Shield size={13} className="text-[#5db8a6]" />
            <span className="text-[#8e8b82]">Shield:</span>
            <span className="font-semibold text-[#5db8a6]">1 Active</span>
          </div>

          <button
            onClick={handleShareStreak}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#e6dfd8] dark:border-[#383531] hover:bg-[#efe9de] dark:hover:bg-[#252320] text-xs font-semibold text-[#6c6a64] dark:text-[#a09d96] transition-colors"
            title="Share your streak"
          >
            <Share2 size={13} />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Middle: 7-Day Visual Timeline Strip */}
      <div className="px-6 py-4 border-b border-[#e6dfd8] dark:border-[#2a2926] bg-[#faf9f5]/50 dark:bg-[#151412]/50">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="font-mono uppercase tracking-wider text-[11px] font-semibold text-[#8e8b82] flex items-center gap-1.5">
            <Calendar size={13} />
            <span>Weekly Momentum</span>
          </span>
          <span className="text-[11px] text-[#6c6a64] dark:text-[#a09d96]">
            {completedCount} of {tasks.length} Daily Tasks Done Today
          </span>
        </div>

        {/* Day-by-Day Ribbon */}
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {daysOfWeek.map((day, idx) => {
            return (
              <div
                key={day.dateKey}
                className={`relative flex flex-col items-center justify-center py-2.5 px-1 rounded-2xl border transition-all text-center ${
                  day.isToday
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/50 ring-2 ring-amber-500/20 shadow-xs'
                    : day.isCompleted
                    ? 'bg-[#cc785c]/10 dark:bg-[#cc785c]/15 border-[#cc785c]/40 text-[#cc785c]'
                    : 'bg-[#faf9f5] dark:bg-[#1a1917] border-[#e6dfd8] dark:border-[#2a2926] text-[#8e8b82] opacity-70'
                }`}
              >
                <span className="text-[10px] font-mono uppercase font-bold mb-1">
                  {day.dayShort}
                </span>

                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                    day.isCompleted
                      ? 'bg-[#cc785c] text-white shadow-xs'
                      : day.isToday
                      ? 'bg-amber-500 text-white animate-pulse'
                      : 'bg-[#efe9de] dark:bg-[#2a2926] text-[#8e8b82]'
                  }`}
                >
                  {day.isCompleted ? (
                    <CheckCircle2 size={14} />
                  ) : day.isToday ? (
                    <Flame size={14} />
                  ) : (
                    <span className="text-[10px] font-bold">•</span>
                  )}
                </div>

                <span className="text-[9px] font-mono mt-1 font-semibold">
                  {day.isToday ? 'Today' : day.isCompleted ? 'Done' : 'Rest'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs: Daily Tasks vs Retention Milestones */}
      <div className="flex border-b border-[#e6dfd8] dark:border-[#2a2926] px-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'tasks'
              ? 'border-[#cc785c] text-[#cc785c]'
              : 'border-transparent text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]'
          }`}
        >
          <Sparkles size={13} />
          <span>Today’s Neural Puzzles ({completedCount}/{tasks.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className={`py-3 px-2 border-b-2 transition-colors flex items-center gap-2 ml-4 ${
            activeTab === 'milestones'
              ? 'border-[#cc785c] text-[#cc785c]'
              : 'border-transparent text-[#8e8b82] hover:text-[#141413] dark:hover:text-[#faf9f5]'
          }`}
        >
          <Award size={13} />
          <span>Streak Milestones & Rewards</span>
        </button>
      </div>

      {/* Tab 1: Today's Tasks */}
      {activeTab === 'tasks' && (
        <div className="p-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-[#8e8b82] mb-1">
            <span>Solve any puzzle below to extend your streak and sharpen your intuition.</span>
            <span className="font-mono text-[#cc785c] font-bold">
              +{tasks.reduce((acc, t) => acc + (t.completed ? t.xp : 0), 0)} XP Earned
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tasks.map((task) => {
              return (
                <div
                  key={task.id}
                  onClick={() => handleLaunchTask(task)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 group ${
                    task.completed
                      ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30 text-[#141413] dark:text-[#faf9f5]'
                      : 'bg-white dark:bg-[#1a1917] border-[#e6dfd8] dark:border-[#2a2926] hover:border-[#cc785c]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={(e) => toggleTaskCompletion(task.id, e)}
                      className={`w-6 h-6 rounded-lg mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                        task.completed
                          ? 'bg-emerald-500 text-white shadow-xs'
                          : 'border border-[#e6dfd8] dark:border-[#383531] text-transparent hover:border-[#cc785c]'
                      }`}
                      title={task.completed ? 'Mark incomplete' : 'Mark completed'}
                    >
                      <CheckCircle2 size={14} className={task.completed ? 'block' : 'opacity-0'} />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-xs font-semibold truncate ${
                            task.completed ? 'line-through text-[#8e8b82]' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                        <span className="px-1.5 py-0.2 rounded-md bg-[#cc785c]/10 text-[#cc785c] text-[9px] font-mono font-bold shrink-0">
                          +{task.xp} XP
                        </span>
                      </div>
                      <p className="text-[11px] text-[#6c6a64] dark:text-[#a09d96] truncate mt-0.5">
                        {task.subtitle}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleLaunchTask(task)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1 transition-all ${
                      task.completed
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold'
                        : 'bg-[#faf9f5] dark:bg-[#252320] border border-[#e6dfd8] dark:border-[#383531] text-[#141413] dark:text-[#faf9f5] group-hover:bg-[#cc785c] group-hover:text-white'
                    }`}
                  >
                    <span>{task.actionText}</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 2: Retention Milestones & Multipliers */}
      {activeTab === 'milestones' && (
        <div className="p-6 flex flex-col gap-4">
          {/* Milestone Progress Bar */}
          <div className="p-4 rounded-2xl bg-[#faf9f5] dark:bg-[#141413] border border-[#e6dfd8] dark:border-[#2a2926]">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-[#141413] dark:text-[#faf9f5] flex items-center gap-1.5">
                <span>Next Milestone:</span>
                <span className="text-[#cc785c] font-bold">{nextMilestone.label}</span>
              </span>
              <span className="font-mono text-[#8e8b82]">
                {dbStreak} / {nextMilestone.days} Days ({progressToMilestone}%)
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-[#efe9de] dark:bg-[#252320] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToMilestone}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-amber-500 to-[#cc785c] rounded-full"
              />
            </div>
          </div>

          {/* Milestone Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {MILESTONES.map((m) => {
              const reached = dbStreak >= m.days;
              return (
                <div
                  key={m.days}
                  className={`p-3.5 rounded-2xl border text-xs flex flex-col justify-between transition-all ${
                    reached
                      ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/40 text-[#141413] dark:text-[#faf9f5]'
                      : 'bg-white dark:bg-[#1a1917] border-[#e6dfd8] dark:border-[#2a2926] opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xl">{m.icon}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          reached
                            ? 'bg-amber-500 text-white'
                            : 'bg-[#efe9de] dark:bg-[#252320] text-[#8e8b82]'
                        }`}
                      >
                        {m.days} Days
                      </span>
                    </div>
                    <h5 className="font-serif font-bold text-sm mb-1">{m.label}</h5>
                    <p className="text-[11px] text-[#6c6a64] dark:text-[#a09d96]">{m.reward}</p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#e6dfd8]/60 dark:border-[#2a2926]/60 text-[10px] font-semibold text-[#cc785c]">
                    {reached ? '✓ Unlocked' : `${m.days - dbStreak} days left`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

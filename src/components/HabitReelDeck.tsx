import React, { useState, useCallback, useMemo } from 'react';
import type { Habit, CheckInStatus } from '../types/habit';
import { calculateHabitStats, formatDisplayDate } from '../lib/momentum';
import { DynamicIcon } from './DynamicIcon';
import {
  Check,
  X,
  Flame,
  Target,
  BarChart3,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Zap,
  Shield,
  Star,
  Flag,
  Crown,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface HabitReelDeckProps {
  habits: Habit[];
  activeDateStr: string;
  onSelectDate: (dateStr: string) => void;
  onCheckIn: (habitId: string, status: CheckInStatus, dateStr?: string) => void;
  onBatchSave: (updates: Record<string, CheckInStatus>, dateStr: string) => void;
  onOpenNewHabit: () => void;
  onOpenDetail: (habit: Habit) => void;
  onOpenHub: () => void;
  onAscendHabit?: (habit: Habit) => void;
  floorAtZero?: boolean;
}

export const HabitReelDeck: React.FC<HabitReelDeckProps> = ({
  habits,
  activeDateStr,
  onSelectDate,
  onCheckIn,
  onOpenNewHabit,
  onOpenDetail,
  onAscendHabit,
  floorAtZero = false,
}) => {
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  // Separate habits into unlogged (deck queue) and logged for active date
  const isLogged = useCallback(
    (h: Habit) => {
      const st = h.history?.[activeDateStr];
      return st === 'done' || st === 'missed';
    },
    [activeDateStr]
  );

  const unloggedHabits = useMemo(() => activeHabits.filter((h) => !isLogged(h)), [activeHabits, isLogged]);
  const loggedHabits = useMemo(() => activeHabits.filter((h) => isLogged(h)), [activeHabits, isLogged]);

  const [animState, setAnimState] = useState<'idle' | 'exit-up' | 'enter-up'>('idle');

  // Total daily progress for active date
  const totalHabitsCount = activeHabits.length;
  const completedCount = activeHabits.filter((h) => h.history[activeDateStr] === 'done').length;
  const isAllDone = totalHabitsCount > 0 && unloggedHabits.length === 0;
  const isPerfectDay = completedCount === totalHabitsCount && totalHabitsCount > 0;
  const percent = totalHabitsCount > 0 ? Math.round((completedCount / totalHabitsCount) * 100) : 0;

  // Circular gauge geometry
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  // The active card currently at the top of the unlogged deck
  const currentCard = unloggedHabits[0];

  // Direct 1-tap check-in on the active card in the queue
  const handleCheckInCard = useCallback(
    (status: CheckInStatus) => {
      if (!currentCard) return;

      setAnimState('exit-up');

      setTimeout(() => {
        onCheckIn(currentCard.id, status, activeDateStr);

        if (unloggedHabits.length === 1 && (status === 'done' || completedCount > 0)) {
          confetti({
            particleCount: 65,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'],
          });
        }

        setAnimState('enter-up');
        setTimeout(() => setAnimState('idle'), 250);
      }, 160);
    },
    [currentCard, onCheckIn, activeDateStr, unloggedHabits.length, completedCount]
  );

  // Date navigation helpers
  const handleShiftDate = (days: number) => {
    const [y, m, d] = activeDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + days);
    const yStr = date.getFullYear();
    const mStr = String(date.getMonth() + 1).padStart(2, '0');
    const dStr = String(date.getDate()).padStart(2, '0');
    onSelectDate(`${yStr}-${mStr}-${dStr}`);
  };

  const isToday = useMemo(() => {
    const today = new Date();
    const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return activeDateStr === iso;
  }, [activeDateStr]);

  if (activeHabits.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto px-4 py-12 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-md">
          <Zap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Habits Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Create positive Build Habits or control Bad Habits to start tracking daily score momentum.
        </p>
        <button
          onClick={onOpenNewHabit}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-slate-950 font-bold text-xs shadow-lg hover:scale-105 transition-all cursor-pointer"
        >
          + Add Your First Habit
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg mx-auto px-3 sm:px-4 flex flex-col items-center">
      {/* Aesthetic Unified Date Bar */}
      <div className="w-full mb-4 flex items-center justify-between bg-white/80 dark:bg-slate-800/80 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-xs backdrop-blur-md">
        {/* Left: Previous / Next Controls with Formatted Date */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-1 text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap">
            <Calendar className="w-4 h-4 text-cyan-500 flex-shrink-0" />
            <span>{formatDisplayDate(activeDateStr, true)}</span>
          </div>

          <button
            onClick={() => handleShiftDate(1)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Jump to Today (if not on today) */}
        <div className="flex items-center gap-1.5">
          {!isToday && (
            <button
              onClick={() => {
                const today = new Date();
                const y = today.getFullYear();
                const m = String(today.getMonth() + 1).padStart(2, '0');
                const d = String(today.getDate()).padStart(2, '0');
                onSelectDate(`${y}-${m}-${d}`);
              }}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white border border-cyan-500/30 transition-all cursor-pointer font-mono whitespace-nowrap"
              title="Return to Today"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Case 1: All habits checked in for active date -> AAA Gamified Result Arena */}
      {isAllDone ? (
        <div className="w-full animate-scale-in">
          <div className="app-card rounded-3xl p-5 sm:p-6 shadow-2xl border-slate-200 dark:border-slate-800 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className={`absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700 ${
              isPerfectDay ? 'bg-amber-400' : 'bg-emerald-500'
            }`} />

            {/* Gamified Score Arena Header with Circular Gauge */}
            <div className="relative z-10 flex flex-col items-center pb-5 border-b border-slate-200 dark:border-slate-800/80">
              {/* Radial Progress Ring */}
              <div className="relative w-28 h-28 flex items-center justify-center my-1">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 96 96">
                  {/* Background Track */}
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="6"
                    fill="transparent"
                  />
                  {/* Dynamic Progress Track */}
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke={isPerfectDay ? '#f59e0b' : '#10b981'}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Score & Icon Inside Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  {isPerfectDay ? (
                    <>
                      <Star className="w-5 h-5 fill-amber-400 text-amber-500 animate-pulse mb-0.5" />
                      <div className="text-xl font-black font-mono text-amber-500 leading-none">
                        {completedCount}/{totalHabitsCount}
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mt-0.5">
                        PERFECT
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-black font-mono text-slate-900 dark:text-white leading-none">
                        <span className="text-emerald-500">{completedCount}</span>
                        <span className="text-slate-400 text-base font-normal">/</span>
                        <span className="text-slate-400">{totalHabitsCount}</span>
                      </div>
                      <span className="text-[10px] font-bold font-mono text-slate-400 mt-1">
                        {percent}% DONE
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Banner */}
              {isPerfectDay ? (
                <div className="mt-2.5 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/15 to-amber-500/20 border border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-black font-mono flex items-center gap-1.5 shadow-xs animate-bounce">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>🌟 +1 JUMBO POINT UNLOCKED!</span>
                </div>
              ) : (
                <div className="mt-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-mono font-bold flex items-center gap-1.5">
                  <span>{totalHabitsCount - completedCount} more needed for Jumbo Point (100%)</span>
                </div>
              )}
            </div>

            {/* Clean Gamified Habit Rows */}
            <div className="mt-4 space-y-2 relative z-10">
              {loggedHabits.map((h) => {
                const currentStatus = h.history[activeDateStr];
                const isBreak = h.type === 'BREAK';
                const isDone = currentStatus === 'done';
                const stats = calculateHabitStats(h, floorAtZero);
                const targetDays = h.targetGoalDays || 21;
                const goalStreak = stats.currentGoalStreak;
                const isGoalConquered = goalStreak >= targetDays && isDone;
                const progressPercent = Math.min(100, Math.round((goalStreak / targetDays) * 100));
                const daysRemaining = Math.max(0, targetDays - goalStreak);
                const isNearGoal = !isGoalConquered && progressPercent >= 80 && isDone;

                return (
                  <div
                    key={h.id}
                    onClick={() => onOpenDetail(h)}
                    className={`p-3 pb-3.5 rounded-2xl bg-white dark:bg-slate-850/90 hover:bg-slate-50 dark:hover:bg-slate-800 border flex items-center justify-between gap-3 transition-all shadow-xs cursor-pointer group active:scale-[0.99] relative overflow-hidden ${
                      isGoalConquered
                        ? 'border-amber-500/40 dark:border-amber-500/30'
                        : 'border-slate-200/90 dark:border-slate-800'
                    }`}
                    title={`Click to view insights and modify check-in for ${h.name}`}
                  >
                    {/* Left: Distinctive Icon Frame & Habit Name */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Icon Frame: Rounded with Leaf for Build, Shielded for Break */}
                      <div
                        className={`w-10 h-10 flex items-center justify-center text-white flex-shrink-0 shadow-xs relative transition-transform group-hover:scale-105 ${
                          isBreak
                            ? 'rounded-xl ring-2 ring-rose-500/30 dark:ring-rose-500/40'
                            : 'rounded-2xl ring-2 ring-emerald-500/30 dark:ring-emerald-500/40'
                        }`}
                        style={{ backgroundColor: `${h.color}25`, color: h.color }}
                      >
                        <DynamicIcon name={h.icon} className="w-5 h-5" />
                        <span className="absolute -bottom-1 -right-1 text-[11px] leading-none select-none">
                          {isBreak ? '🛡️' : '🌱'}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors">
                            {h.name}
                          </span>
                          {h.currentTier && h.currentTier > 1 && (
                            <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[9px] font-black font-mono flex items-center gap-0.5 shadow-xs">
                              <Crown className="w-2.5 h-2.5 fill-amber-500" />
                              <span>Lv.{h.currentTier}</span>
                            </span>
                          )}
                        </div>

                        {/* Streak & Target Goal Indicators */}
                        <div className="flex items-center gap-2 text-xs mt-0.5 font-mono font-bold flex-wrap">
                          {/* Flame Streak Indicator */}
                          <span className="flex items-center gap-1 text-amber-500" title={`Current Streak: ${stats.currentStreak} days`}>
                            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{stats.currentStreak}d</span>
                          </span>

                          <span className="text-slate-300 dark:text-slate-700">•</span>

                          {/* Dynamic Milestone Tag / Interactive Ascension CTA */}
                          {isGoalConquered ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onAscendHabit) onAscendHabit(h);
                              }}
                              className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 shadow-md shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all animate-bounce cursor-pointer border border-amber-300"
                              title="Milestone Conquered! Click to level up and claim rewards"
                            >
                              <Zap className="w-3 h-3 fill-slate-950 stroke-none" />
                              <span>Ascend Target ⚡</span>
                            </button>
                          ) : isNearGoal ? (
                            <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 font-bold text-[10px] flex items-center gap-1 shadow-xs font-mono">
                              <Flag className="w-3 h-3 text-cyan-500" />
                              <span>{daysRemaining === 1 ? '1 day to goal' : `${daysRemaining}d to goal`}</span>
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400" title={`Target Goal: ${goalStreak} of ${targetDays} days`}>
                              <Target className="w-3.5 h-3.5 text-cyan-500" />
                              <span>{goalStreak}/{targetDays}d</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Contextual Cumulative XP Pill (✓ 14 XP / ✕ 12 XP) */}
                    <div className="flex items-center flex-shrink-0">
                      <div
                        className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono flex items-center gap-1.5 shadow-xs transition-all duration-200 ${
                          isDone
                            ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/20 shadow-md font-extrabold'
                            : 'bg-rose-500 text-white shadow-rose-500/20 shadow-md font-extrabold'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : (
                          <X className="w-3.5 h-3.5 stroke-[3]" />
                        )}
                        <span>{stats.currentScore} XP</span>
                      </div>
                    </div>

                    {/* Ultra-Thin (3px) Seamless Bottom Progress Rail */}
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-200/50 dark:bg-slate-800/80 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ease-out ${
                          isGoalConquered
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                            : isDone
                            ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                            : 'bg-slate-300 dark:bg-slate-700'
                        }`}
                        style={{
                          width: `${isDone ? progressPercent : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Case 2: Active Card Deck Queue (1 habit card at a time for active date) */
        (() => {
          const currentStats = currentCard ? calculateHabitStats(currentCard, floorAtZero) : null;
          const targetGoalDays = currentCard?.targetGoalDays || 21;
          const streakProgress = currentStats ? currentStats.currentGoalStreak : 0;
          const daysLeft = Math.max(0, targetGoalDays - streakProgress);
          const progressPercent = Math.min(100, Math.round((streakProgress / targetGoalDays) * 100));
          const animClass = animState === 'exit-up' ? 'reel-exit-up' : animState === 'enter-up' ? 'reel-enter-up' : '';
          const isBreak = currentCard?.type === 'BREAK';

          return (
            <div className="w-full">
              {/* Top Deck Status Bar */}
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Habit Queue
                  </span>
                </div>

                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {unloggedHabits.length} {unloggedHabits.length === 1 ? 'left' : 'left'} ({loggedHabits.length}/{totalHabitsCount})
                </div>
              </div>

              {/* Progress Bar of Daily Completion */}
              <div className="w-full mb-3.5">
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(loggedHabits.length / totalHabitsCount) * 100}%` }}
                  />
                </div>
              </div>

              {/* The Active Habit Card */}
              {currentCard && (
                <div
                  className={`w-full app-card rounded-3xl p-5 sm:p-7 relative overflow-hidden transition-all duration-200 shadow-2xl ${animClass}`}
                  style={{
                    borderTop: `4px solid ${currentCard.color || (isBreak ? '#f43f5e' : '#10b981')}`,
                  }}
                >
                  {/* Ambient Glow */}
                  <div
                    className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20"
                    style={{ backgroundColor: currentCard.color || (isBreak ? '#f43f5e' : '#10b981') }}
                  />

                  {/* Top Category & Paradigm Badges & View Analytics Trigger */}
                  <div className="flex items-center justify-between relative z-10 mb-3">
                    <div className="flex items-center gap-1.5">
                      {/* Habit Paradigm Badge */}
                      <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        isBreak
                          ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                      }`}>
                        {isBreak ? <Shield className="w-3 h-3 text-rose-500" /> : <span className="text-xs">🌱</span>}
                        <span>{isBreak ? 'Break Habit' : 'Build Habit'}</span>
                      </span>

                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {currentCard.category}
                      </span>
                    </div>

                    <button
                      onClick={() => onOpenDetail(currentCard)}
                      className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Analytics
                    </button>
                  </div>

                  {/* Central Habit Title & Icon */}
                  <div className="flex flex-col items-center text-center my-2 sm:my-3 relative z-10">
                    <div
                      className="w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-white mb-2.5 shadow-md transition-transform hover:scale-105 duration-200"
                      style={{
                        backgroundColor: `${currentCard.color}25`,
                        border: `2px solid ${currentCard.color}`,
                        color: currentCard.color,
                      }}
                    >
                      <DynamicIcon name={currentCard.icon} className="w-9 h-9 sm:w-10 sm:h-10" />
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {currentCard.name}
                    </h1>

                    {currentCard.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
                        {currentCard.description}
                      </p>
                    )}

                    {/* Habit XP & Streak Banner */}
                    <div className="mt-3 flex items-center gap-4 bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400">Habit XP</span>
                        <div className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white">
                          {currentStats && currentStats.currentScore > 0 ? `+${currentStats.currentScore}` : currentStats?.currentScore ?? 0} <span className="text-[10px] font-normal text-slate-400">XP</span>
                        </div>
                      </div>
                      <div className="w-px h-5 bg-slate-300 dark:bg-slate-700" />
                      <div>
                        <span className="text-[10px] uppercase font-mono text-slate-400">
                          {isBreak ? 'Clean Streak' : 'Streak'}
                        </span>
                        <div className="text-base sm:text-lg font-extrabold font-mono text-amber-500 dark:text-amber-400 flex items-center gap-1">
                          {isBreak ? (
                            <Shield className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                          ) : (
                            <Flame className="w-4 h-4 fill-amber-500" />
                          )}
                          <span>{currentStats?.currentStreak ?? 0}d</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Strict Target Days Countdown Gauge */}
                  <div className="my-3.5 p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 relative z-10">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-cyan-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {targetGoalDays}-Day {isBreak ? 'Clean Target Goal' : 'Target Goal'}
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        Day {streakProgress} of {targetGoalDays}
                      </div>
                    </div>

                    {/* Countdown Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-cyan-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    {/* Countdown Days Remaining & Reset Warning */}
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {daysLeft === 0 ? '🏆 Target Goal Reached!' : `${daysLeft} ${isBreak ? 'clean days' : 'target days'} remaining`}
                      </span>
                      <span className="text-rose-500 text-[10px] font-medium">
                        {isBreak ? 'Failed resets clean streak to 0' : 'Missed resets streak to 0'}
                      </span>
                    </div>
                  </div>

                  {/* Fast One-Tap Check-In Actions (Dynamic for Build vs Break) */}
                  <div className="mt-4 relative z-10">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Success Button */}
                      <button
                        onClick={() => handleCheckInCard('done')}
                        className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-800 dark:text-emerald-300 hover:text-white dark:hover:text-slate-950 border border-emerald-500/30 font-bold text-sm transition-all duration-150 active:scale-95 shadow-sm cursor-pointer min-h-[72px]"
                      >
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
                          {isBreak ? <Shield className="w-5 h-5 stroke-[2.5]" /> : <Check className="w-5 h-5 stroke-[3]" />}
                        </div>
                        <span className="text-sm sm:text-base">
                          {isBreak ? 'Controlled (+1 XP)' : 'Done (+1 XP)'}
                        </span>
                      </button>

                      {/* Failure Button */}
                      <button
                        onClick={() => handleCheckInCard('missed')}
                        className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/20 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 font-bold text-sm transition-all duration-150 active:scale-95 cursor-pointer min-h-[72px]"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-1">
                          <X className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <span className="text-sm sm:text-base">
                          {isBreak ? 'Failed (-1 XP)' : 'Missed (-1 XP)'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}
    </div>
  );
};

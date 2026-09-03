import React, { useState, useCallback, useMemo } from 'react';
import type { Habit, CheckInStatus } from '../types/habit';
import { calculateHabitStats, formatDisplayDate, getTodayString } from '../lib/momentum';
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
  ShieldCheck,
  Sprout,
  Crown,
  Gem,
  Flag,
} from 'lucide-react';
import { DatePickerPopover } from './DatePickerPopover';
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
  jumboPointsCount?: number;
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
  jumboPointsCount = 0,
  floorAtZero = false,
}) => {
  const hasAnyHabits = useMemo(() => habits.some((h) => !h.archived), [habits]);

  const activeHabits = useMemo(() => {
    return habits.filter((h) => {
      if (h.archived) return false;
      const startDate =
        h.startDate ||
        (h.createdAt ? h.createdAt.split('T')[0] : Object.keys(h.history || {}).sort()[0]) ||
        getTodayString();
      return startDate <= activeDateStr;
    });
  }, [habits, activeDateStr]);

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
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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

  if (!hasAnyHabits) {
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

          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700/60 text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono whitespace-nowrap transition-colors cursor-pointer group"
            title="Click to jump to any date"
          >
            <Calendar className="w-4 h-4 text-cyan-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span>{formatDisplayDate(activeDateStr, true)}</span>
          </button>

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

      {/* Case 0: No habits started yet on this date */}
      {activeHabits.length === 0 ? (
        <div className="w-full app-card rounded-3xl p-8 text-center border-slate-200 dark:border-slate-800 animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-3 border border-cyan-500/20 shadow-sm">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-1">
            No Habits Active On This Date
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 max-w-sm mx-auto leading-relaxed">
            Your habit tracking began after this day. Jump forward to see your active check-in queue.
          </p>
          <button
            onClick={() => {
              const today = new Date();
              const y = today.getFullYear();
              const m = String(today.getMonth() + 1).padStart(2, '0');
              const d = String(today.getDate()).padStart(2, '0');
              onSelectDate(`${y}-${m}-${d}`);
            }}
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-950 font-bold text-xs shadow-md hover:scale-105 transition-all cursor-pointer font-mono"
          >
            Jump to Today
          </button>
        </div>
      ) : isAllDone ? (
        <div className="w-full animate-scale-in">
          <div className="app-card rounded-3xl p-5 sm:p-6 shadow-2xl border-slate-200 dark:border-slate-800 relative overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 bg-emerald-500 transition-all duration-700" />

            {/* Gamified Score Arena Header with Circular Gauge */}
            <div className="relative z-10 flex flex-col items-center pb-4 border-b border-slate-200 dark:border-slate-800/80">
              {/* Radial Progress Ring (Emerald Mint Task Completion) */}
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
                  {/* Dynamic Progress Track (Emerald) */}
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    stroke="#10b981"
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-700 ease-out"
                  />
                </svg>

                {/* Clean Task Completion Display Inside Ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  {isPerfectDay ? (
                    <>
                      <div className="text-3xl font-black font-mono text-emerald-500 dark:text-emerald-400 leading-none">
                        {completedCount}/{totalHabitsCount}
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1">
                        ALL DONE
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-black font-mono text-slate-900 dark:text-white leading-none">
                        <span className="text-emerald-500">{completedCount}</span>
                        <span className="text-slate-400 text-xl font-normal">/</span>
                        <span className="text-slate-400">{totalHabitsCount}</span>
                      </div>
                      <span className="text-[9px] font-bold font-mono text-slate-400 mt-1 uppercase tracking-wider">
                        {percent}% DONE
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Dynamic Jumbo Point Achievement Banner (Render ONLY on 100% Perfect Cleared Days with >= 3 habits) */}
              {isPerfectDay && totalHabitsCount >= 3 && (
                <div className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs font-black font-mono flex items-center gap-2 shadow-xs animate-bounce">
                  <Gem className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>+1 Jumbo Point Credited</span>
                  <span className="w-1 h-1 rounded-full bg-amber-400/60" />
                  <span className="text-amber-700 dark:text-amber-300 font-bold">Total: {jumboPointsCount}</span>
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
                const isNearGoal = !isGoalConquered && isDone && progressPercent >= 70 && daysRemaining > 0;

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

                        {/* Secondary Info Row: Streak + Lifetime XP + Near Goal Alert */}
                        <div className="flex items-center gap-2 text-xs mt-0.5 font-mono font-bold flex-wrap">
                          {/* Flame Streak Indicator */}
                          <span className="flex items-center gap-1 text-amber-500" title={`Current Streak: ${stats.currentStreak} days`}>
                            <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            <span>{stats.currentStreak}d</span>
                          </span>

                          <span className="text-slate-300 dark:text-slate-700">•</span>

                          {/* Lifetime XP Badge */}
                          <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400 font-medium" title={`Lifetime XP: ${stats.currentScore} XP`}>
                            <Zap className="w-3 h-3 text-amber-500" />
                            <span>{stats.currentScore} XP</span>
                          </span>

                          {/* Engaging Near Goal Indicator */}
                          {isNearGoal && (
                            <>
                              <span className="text-slate-300 dark:text-slate-700">•</span>
                              <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 border border-cyan-500/30 font-bold text-[10px] flex items-center gap-1 shadow-xs font-mono animate-pulse" title={`${daysRemaining} days left to conquer target goal!`}>
                                <Flag className="w-3 h-3 text-cyan-500" />
                                <span>{daysRemaining === 1 ? '1 day to goal!' : `${daysRemaining}d to goal!`}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Milestone Cluster (Level Up CTA + Target Ratio + Tactile Check-In Switch) */}
                    <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
                      {/* Level Up CTA Button (Appears BEFORE target goal without displacing it) */}
                      {isGoalConquered && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onAscendHabit) onAscendHabit(h);
                          }}
                          className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-xs font-black font-mono uppercase tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer animate-pulse"
                          title="Milestone Conquered! Click to level up and claim rewards"
                        >
                          <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          <span>Level Up ⚡</span>
                        </button>
                      )}

                      {/* The Target Ratio / Milestone Chase (Anchored in place) */}
                      <div className="flex flex-col items-end text-right min-w-[48px]">
                        <div className="flex items-baseline gap-0.5 justify-end">
                          <span className={`font-black text-sm font-mono tracking-tight ${
                            isDone
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}>
                            {isDone ? goalStreak : 0}
                          </span>
                          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
                            /{targetDays}d
                          </span>
                        </div>
                        <span className="text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
                          target
                        </span>
                      </div>

                      {/* Tactile Daily Check-In Micro-Switch (Always in the rightmost slot) */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCheckIn(h.id, isDone ? 'missed' : 'done', activeDateStr);
                        }}
                        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all duration-150 active:scale-90 shadow-xs cursor-pointer ${
                          isDone
                            ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:border-emerald-500/50'
                            : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:border-rose-500/50'
                        }`}
                        title={isDone ? 'Marked Done. Click to toggle to Missed.' : 'Marked Missed. Click to toggle to Done.'}
                      >
                        {isDone ? (
                          <Check className="w-4 h-4 stroke-[2.5]" />
                        ) : (
                          <X className="w-4 h-4 stroke-[2.5]" />
                        )}
                      </button>
                    </div>

                    {/* Ultra-Thin (3px) Seamless Bottom Progress Rail */}
                    <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-slate-200/50 dark:bg-slate-800/80 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ease-out ${
                          isGoalConquered
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                            : isDone
                            ? 'bg-gradient-to-r from-emerald-400 to-teal-500 shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                            : 'bg-slate-200 dark:bg-slate-800'
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

                <div className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 shadow-xs">
                  {loggedHabits.length}/{totalHabitsCount}
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

                  {/* Top Header: Habit Intent Pill (Left) & Icon-Only Analytics Trigger (Right) */}
                  <div className="flex items-center justify-between relative z-10 mb-3">
                    {/* Habit Paradigm Intent Badge */}
                    <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-xs ${
                      isBreak
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                        : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    }`}>
                      {isBreak ? <Shield className="w-3 h-3 text-rose-500" /> : <Sprout className="w-3 h-3 text-emerald-500" />}
                      <span>{isBreak ? 'Break Habit' : 'Build Habit'}</span>
                    </span>

                    {/* Minimalist Icon-Only Analytics Trigger */}
                    <button
                      onClick={() => onOpenDetail(currentCard)}
                      className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all active:scale-90 cursor-pointer shadow-xs"
                      title={`View Analytics & History for ${currentCard.name}`}
                      aria-label="View Analytics"
                    >
                      <BarChart3 className="w-4 h-4" />
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

                    {/* Clean XP & Universal Flame Streak Pill */}
                    <div className="mt-3 flex items-center gap-3.5 bg-slate-100 dark:bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
                      {/* XP without plus symbol */}
                      <div className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-white flex items-center gap-1">
                        <Zap className="w-4 h-4 text-amber-500" />
                        <span>{currentStats?.currentScore ?? 0} XP</span>
                      </div>

                      <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />

                      {/* Universal Flame Streak */}
                      <div className="text-base sm:text-lg font-extrabold font-mono text-amber-500 dark:text-amber-400 flex items-center gap-1">
                        <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
                        <span>{currentStats?.currentStreak ?? 0}d</span>
                      </div>
                    </div>
                  </div>

                  {/* Simplified Target Goal Progress Box */}
                  <div className="my-3.5 p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 relative z-10">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <Target className="w-4 h-4 text-cyan-500" />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Target Goal
                        </span>
                      </div>
                      <div className="text-xs font-mono font-bold">
                        <span className="text-slate-900 dark:text-white font-black text-sm">{streakProgress}</span>
                        <span className="text-slate-400 dark:text-slate-500 font-semibold"> / {targetGoalDays}</span>
                      </div>
                    </div>

                    {/* Dynamic Horizontal Progress Track */}
                    <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-emerald-500 to-cyan-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Clean One-Tap Check-In Actions (Left: Failed/Missed, Right: Controlled/Done) */}
                  <div className="mt-4 relative z-10">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Left: Failure Button (Failed for Break, Missed for Build) */}
                      <button
                        onClick={() => handleCheckInCard('missed')}
                        className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 hover:bg-rose-500/20 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 font-bold text-sm transition-all duration-150 active:scale-95 cursor-pointer min-h-[72px]"
                      >
                        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-1">
                          <X className="w-5 h-5 stroke-[2.5]" />
                        </div>
                        <span className="text-sm sm:text-base font-extrabold">
                          {isBreak ? 'Failed' : 'Missed'}
                        </span>
                      </button>

                      {/* Right: Success Button (Controlled with Shield for Break, Done with Check for Build) */}
                      <button
                        onClick={() => handleCheckInCard('done')}
                        className="flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-800 dark:text-emerald-300 hover:text-white dark:hover:text-slate-950 border border-emerald-500/30 font-bold text-sm transition-all duration-150 active:scale-95 shadow-sm cursor-pointer min-h-[72px]"
                      >
                        <div className="w-9 h-9 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
                          {isBreak ? (
                            <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
                          ) : (
                            <Check className="w-5 h-5 stroke-[3]" />
                          )}
                        </div>
                        <span className="text-sm sm:text-base font-extrabold">
                          {isBreak ? 'Controlled' : 'Done'}
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

      {/* Interactive Date Picker Calendar Popover Modal */}
      <DatePickerPopover
        activeDateStr={activeDateStr}
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={onSelectDate}
      />
    </div>
  );
};

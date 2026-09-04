import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
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
  onAscendHabit?: (habit: Habit) => void;
  jumboPointsCount?: number;
  floorAtZero?: boolean;
}

interface DailySummaryHabitRowProps {
  habit: Habit;
  activeDateStr: string;
  floorAtZero: boolean;
  index: number;
  onOpenDetail: (habit: Habit) => void;
  onAscendHabit?: (habit: Habit) => void;
  onCheckIn: (habitId: string, status: CheckInStatus, dateStr?: string) => void;
}

const DailySummaryHabitRow: React.FC<DailySummaryHabitRowProps> = ({
  habit: h,
  activeDateStr,
  floorAtZero,
  index: idx,
  onOpenDetail,
  onAscendHabit,
  onCheckIn,
}) => {
  const currentStatus = h.history?.[activeDateStr];
  const isBreak = h.type === 'BREAK';
  const isDone = currentStatus === 'done';
  const stats = calculateHabitStats(h, floorAtZero, activeDateStr);
  const targetDays = h.targetGoalDays || 21;
  const goalStreak = stats.currentGoalStreak;
  const isGoalConquered = goalStreak >= targetDays && isDone;
  const daysRemaining = Math.max(0, targetDays - goalStreak);
  const isNearGoal = !isGoalConquered && isDone && (goalStreak / targetDays) >= 0.7 && daysRemaining > 0;

  const [animatedStreak, setAnimatedStreak] = useState<number>(() => {
    return isDone && goalStreak > 0 ? goalStreak - 1 : (isDone ? goalStreak : 0);
  });

  React.useEffect(() => {
    if (!isDone) {
      setAnimatedStreak(0);
      return;
    }
    const timer = setTimeout(() => {
      setAnimatedStreak(goalStreak);
    }, 200 + idx * 60);

    return () => clearTimeout(timer);
  }, [goalStreak, isDone, idx]);

  const railWidth = !isDone
    ? 0
    : Math.min(100, Math.round((animatedStreak / targetDays) * 100));

  const isExpanded = animatedStreak === goalStreak && isDone && goalStreak > 0;

  return (
    <div
      onClick={() => onOpenDetail(h)}
      className={`p-3 pb-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border flex items-center justify-between gap-2.5 sm:gap-3 transition-all shadow-xs dark:shadow-md dark:shadow-black/20 cursor-pointer group active:scale-[0.99] relative overflow-hidden ${
        isGoalConquered
          ? 'border-amber-500/40 dark:border-amber-400/40'
          : 'border-slate-200/90 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
      }`}
      title={`Click to view insights and modify check-in for ${h.name}`}
    >
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
        <div
          className={`w-10 h-10 flex items-center justify-center flex-shrink-0 shadow-xs relative transition-transform group-hover:scale-105 rounded-2xl bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 ${
            isBreak
              ? 'ring-2 ring-rose-500/30 dark:ring-rose-500/40'
              : 'ring-2 ring-emerald-500/30 dark:ring-emerald-500/40'
          }`}
          style={{ color: h.color }}
        >
          <DynamicIcon name={h.icon} className="w-5 h-5" />
          <span className="absolute -bottom-1 -right-1 text-[11px] leading-none select-none">
            {isBreak ? '🛡️' : '🌱'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
              {h.name}
            </span>
            {h.currentTier && h.currentTier > 1 && (
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[9px] font-black font-mono flex items-center gap-0.5 shadow-xs flex-shrink-0">
                <Crown className="w-2.5 h-2.5 fill-amber-500" />
                <span>Lv.{h.currentTier}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs mt-0.5 font-mono font-bold flex-wrap">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold" title={`Current Streak: ${stats.currentStreak} days`}>
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              <span>{stats.currentStreak}</span>
            </span>

            <span className="text-slate-300 dark:text-slate-600">•</span>

            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-medium" title={`Lifetime Score: ${stats.currentScore}`}>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{stats.currentScore}</span>
            </span>

            {isNearGoal && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 font-bold text-[10px] flex items-center gap-1 shadow-xs font-mono animate-pulse" title={`${daysRemaining} days left to conquer target goal!`}>
                  <Flag className="w-3 h-3 text-cyan-500" />
                  <span>{daysRemaining === 1 ? '1 day to goal!' : `${daysRemaining}d to goal!`}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {isGoalConquered && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onAscendHabit) onAscendHabit(h);
            }}
            className="px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-400/25 to-yellow-500/20 hover:from-amber-500/30 hover:to-yellow-500/30 text-amber-700 dark:text-amber-300 border border-amber-400/40 text-[10px] sm:text-xs font-black font-mono uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer animate-pulse whitespace-nowrap"
            title="Milestone Conquered! Click to level up and claim rewards"
          >
            <Crown className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
            <span>Level Up ⚡</span>
          </button>
        )}

        <div className="flex flex-col items-end text-right min-w-[42px] sm:min-w-[48px]">
          <div className="flex items-baseline gap-0.5 justify-end">
            <span
              className={`font-black text-sm font-mono tracking-tight transition-all duration-300 inline-block ${
                isDone
                  ? 'text-slate-900 dark:text-slate-100'
                  : 'text-slate-400 dark:text-slate-500'
              } ${
                isExpanded
                  ? 'scale-100 text-slate-900 dark:text-slate-100'
                  : isDone
                  ? 'scale-110 text-emerald-600 dark:text-emerald-400'
                  : ''
              }`}
            >
              {isDone ? animatedStreak : 0}
            </span>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 font-mono">
              /{targetDays} D
            </span>
          </div>
          <span className="text-[9px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase tracking-tighter">
            TARGET
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onCheckIn(h.id, isDone ? 'missed' : 'done', activeDateStr);
          }}
          className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border transition-all duration-200 active:scale-90 shadow-xs cursor-pointer ${
            isDone
              ? 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50 dark:bg-emerald-500/25 dark:border-emerald-400/50'
              : 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 border-rose-500/30 hover:border-rose-500/50 dark:bg-rose-500/25 dark:border-rose-400/50'
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

      <div className="absolute bottom-0 left-0 right-0 h-[3.5px] bg-slate-200/50 dark:bg-slate-800 overflow-hidden">
        <div
          className={`h-full relative ${
            isGoalConquered
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
              : isDone
              ? 'bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]'
              : 'bg-slate-200 dark:bg-slate-800'
          }`}
          style={{
            width: `${railWidth}%`,
            transition: 'width 700ms cubic-bezier(0.16, 1, 0.3, 1)',
            willChange: 'width',
          }}
        >
          {isGoalConquered && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-bar-sheen" />
          )}
        </div>
      </div>
    </div>
  );
};

interface HabitCardContentProps {
  habit: Habit;
  activeDateStr: string;
  floorAtZero: boolean;
  isInteractive?: boolean;
  isCharging?: boolean;
  isDeckLocked?: boolean;
  chargePhase?: 'idle' | 'charging' | 'incremented';
  onCheckIn?: (status: CheckInStatus) => void;
  onOpenDetail?: (habit: Habit) => void;
}

const HabitCardContent: React.FC<HabitCardContentProps> = ({
  habit,
  activeDateStr,
  floorAtZero,
  isInteractive = true,
  isCharging = false,
  isDeckLocked = false,
  chargePhase = 'idle',
  onCheckIn,
  onOpenDetail,
}) => {
  const currentStats = calculateHabitStats(habit, floorAtZero, activeDateStr);
  const targetGoalDays = habit.targetGoalDays || 21;
  const initialStreak = currentStats.currentGoalStreak;
  const targetStreak = initialStreak + 1;

  const initialPercent = Math.min(100, Math.round((initialStreak / targetGoalDays) * 100));
  const targetPercent = Math.min(100, Math.round((targetStreak / targetGoalDays) * 100));

  const currentBarWidth = isCharging && (chargePhase === 'charging' || chargePhase === 'incremented')
    ? targetPercent
    : initialPercent;

  const displayStreak = isCharging && chargePhase === 'incremented'
    ? targetStreak
    : initialStreak;

  const isBreak = habit.type === 'BREAK';

  return (
    <div
      className="w-full app-card rounded-3xl p-5 sm:p-7 relative overflow-hidden shadow-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-750 select-none"
      style={{
        borderTop: `4px solid ${habit.color || (isBreak ? '#f43f5e' : '#10b981')}`,
      }}
    >
      <div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-500"
        style={{ backgroundColor: isCharging ? '#10b981' : habit.color || (isBreak ? '#f43f5e' : '#10b981') }}
      />

      <div className="flex items-center justify-between relative z-10 mb-3">
        <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 shadow-xs ${
          isBreak
            ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30 dark:bg-rose-500/20 dark:border-rose-500/40'
            : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/20 dark:border-emerald-500/40'
        }`}>
          {isBreak ? <Shield className="w-3 h-3 text-rose-500" /> : <Sprout className="w-3 h-3 text-emerald-500" />}
          <span>{isBreak ? 'Break Habit' : 'Build Habit'}</span>
        </span>

        {isInteractive && onOpenDetail && (
          <button
            onClick={() => onOpenDetail(habit)}
            disabled={isDeckLocked}
            className="p-2 rounded-xl text-slate-500 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-all active:scale-90 cursor-pointer shadow-xs disabled:opacity-50"
            title={`View Analytics & History for ${habit.name}`}
            aria-label="View Analytics"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col items-center text-center my-2 sm:my-3 relative z-10">
        <div
          className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl flex items-center justify-center text-white mb-2.5 shadow-md transition-all duration-300 ${
            isCharging ? 'scale-110 shadow-lg shadow-emerald-500/30' : isInteractive ? 'hover:scale-105' : ''
          }`}
          style={{
            backgroundColor: `${habit.color}25`,
            border: `2px solid ${habit.color}`,
            color: habit.color,
          }}
        >
          <DynamicIcon name={habit.icon} className="w-9 h-9 sm:w-10 sm:h-10" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-center break-words max-w-full">
          {habit.name}
        </h1>

        {habit.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-md leading-relaxed text-center">
            {habit.description}
          </p>
        )}

        <div className="mt-3 flex items-center gap-3.5 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-750 shadow-xs">
          <div className="text-base sm:text-lg font-extrabold font-mono text-slate-900 dark:text-slate-100 flex items-center gap-1">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>{currentStats.currentScore}</span>
          </div>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700" />

          <div className="text-base sm:text-lg font-extrabold font-mono text-amber-500 dark:text-amber-400 flex items-center gap-1">
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500" />
            <span>{currentStats.currentStreak}</span>
          </div>
        </div>
      </div>

      <div className={`my-3.5 p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border transition-all duration-300 relative z-10 ${
        isCharging
          ? 'border-emerald-500/50 dark:border-emerald-500/60 shadow-md shadow-emerald-500/10'
          : 'border-slate-200 dark:border-slate-750'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Target className={`w-4 h-4 transition-colors ${isCharging ? 'text-emerald-500 animate-pulse' : 'text-cyan-500'}`} />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Target Goal
            </span>
          </div>
          <div className="text-xs font-mono font-bold">
            <span className={`font-black text-sm transition-all inline-block ${
              isCharging && chargePhase === 'incremented'
                ? 'animate-count-pop text-emerald-600 dark:text-emerald-400'
                : 'text-slate-900 dark:text-slate-100'
            }`}>
              {displayStreak}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-semibold"> / {targetGoalDays} D</span>
          </div>
        </div>

        <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden relative shadow-inner">
          <div
            className={`h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 relative ${
              isCharging ? 'shadow-[0_0_12px_rgba(16,185,129,0.8)]' : ''
            }`}
            style={{
              width: `${currentBarWidth}%`,
              transition: isCharging ? 'width 400ms cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
              willChange: 'width',
            }}
          >
            {isCharging && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-bar-sheen" />
            )}
          </div>

          {isCharging && currentBarWidth > 0 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-emerald-300 dark:bg-emerald-200 animate-pulse-beacon pointer-events-none"
              style={{
                left: `${currentBarWidth}%`,
                transition: 'left 400ms cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'left',
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-4 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onCheckIn && onCheckIn('missed')}
            disabled={!isInteractive || !!isCharging || isDeckLocked}
            className="flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-500/20 text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-300 border border-slate-200 dark:border-slate-700 font-bold text-sm transition-all duration-150 active:scale-95 cursor-pointer min-h-[68px] sm:min-h-[76px] disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-1">
              <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
            </div>
            <span className="text-xs sm:text-sm font-extrabold">
              {isBreak ? 'Failed' : 'Missed'}
            </span>
          </button>

          <button
            onClick={() => onCheckIn && onCheckIn('done')}
            disabled={!isInteractive || !!isCharging || isDeckLocked}
            className={`flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border font-bold text-sm transition-all duration-150 active:scale-95 shadow-sm cursor-pointer min-h-[68px] sm:min-h-[76px] disabled:pointer-events-none ${
              isCharging
                ? 'bg-emerald-500 text-white dark:text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/30 scale-[0.98]'
                : isDeckLocked
                ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 opacity-60 border-emerald-500/30'
                : 'bg-emerald-500/15 hover:bg-emerald-500 text-emerald-800 dark:text-emerald-300 hover:text-white dark:hover:text-slate-950 border-emerald-500/30 dark:bg-emerald-500/25 dark:border-emerald-400/50'
            }`}
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-emerald-500/20 dark:bg-emerald-500/30 flex items-center justify-center mb-1">
              {isBreak ? (
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
              ) : (
                <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
              )}
            </div>
            <span className="text-xs sm:text-sm font-extrabold">
              {isBreak ? 'Controlled' : 'Done'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

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

  const isLogged = useCallback(
    (h: Habit) => {
      const st = h.history?.[activeDateStr];
      return st === 'done' || st === 'missed';
    },
    [activeDateStr]
  );

  const unloggedHabits = useMemo(() => activeHabits.filter((h) => !isLogged(h)), [activeHabits, isLogged]);
  const loggedHabits = useMemo(() => activeHabits.filter((h) => isLogged(h)), [activeHabits, isLogged]);

  const [viewModeOverride, setViewModeOverride] = useState<'deck' | 'summary' | null>(null);

  const [deckIndex, setDeckIndex] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const [animationMode, setAnimationMode] = useState<'carousel' | 'checkin'>('carousel');
  const [isDeckLocked, setIsDeckLocked] = useState<boolean>(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  React.useEffect(() => {
    setDeckIndex(0);
    setViewModeOverride(null);
    setDirection(1);
    setAnimationMode('carousel');
    setIsDeckLocked(false);
  }, [activeDateStr]);

  const [chargingHabitId, setChargingHabitId] = useState<string | null>(null);
  const [chargePhase, setChargePhase] = useState<'idle' | 'charging' | 'incremented'>('idle');

  const totalHabitsCount = activeHabits.length;
  const completedCount = activeHabits.filter((h) => h.history?.[activeDateStr] === 'done').length;
  const isAllDone = totalHabitsCount > 0 && unloggedHabits.length === 0;
  const isPerfectDay = completedCount === totalHabitsCount && totalHabitsCount > 0;
  const percent = totalHabitsCount > 0 ? Math.round((completedCount / totalHabitsCount) * 100) : 0;

  const currentView = isAllDone ? 'summary' : (viewModeOverride || 'deck');

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  const pendingCount = unloggedHabits.length;
  const safeIndex = pendingCount > 0 ? Math.max(0, Math.min(pendingCount - 1, deckIndex)) : 0;
  const currentCard = unloggedHabits[safeIndex];

  // Keep deckIndex in valid range if pendingCount decreases
  React.useEffect(() => {
    if (deckIndex >= pendingCount && pendingCount > 0) {
      setDeckIndex(pendingCount - 1);
    }
  }, [pendingCount, deckIndex]);

  const hasPrev = safeIndex > 0;
  const hasNext = safeIndex < pendingCount - 1;

  const remainingUnderneath = pendingCount - 1 - safeIndex;
  const nextCard = remainingUnderneath >= 1 ? unloggedHabits[safeIndex + 1] : null;
  const nextNextCard = remainingUnderneath >= 2 ? unloggedHabits[safeIndex + 2] : null;

  // Flow A: Carousel Browsing (Next / Back Arrows / Neutral Swipe only)
  const handleNextCard = useCallback(() => {
    if (!hasNext || chargingHabitId || isDeckLocked) return;
    setAnimationMode('carousel');
    setDirection(1);
    setDeckIndex((prev) => Math.min(pendingCount - 1, prev + 1));
  }, [hasNext, chargingHabitId, isDeckLocked, pendingCount]);

  const handlePrevCard = useCallback(() => {
    if (!hasPrev || chargingHabitId || isDeckLocked) return;
    setAnimationMode('carousel');
    setDirection(-1);
    setDeckIndex((prev) => Math.max(0, prev - 1));
  }, [hasPrev, chargingHabitId, isDeckLocked]);

  // Flow B: Habit Check-In (Done / Controlled / Missed / Failed)
  const handleCheckInCard = useCallback(
    (status: CheckInStatus) => {
      if (!currentCard || chargingHabitId || isDeckLocked) return;

      // 1. Lock Deck immediately
      setIsDeckLocked(true);
      setAnimationMode('checkin');

      if (status === 'done') {
        setChargingHabitId(currentCard.id);

        // 2. Local Progress Fill: Animate only this specific habit's target goal bar from current to +1 over 400ms
        requestAnimationFrame(() => {
          setChargePhase('charging');
        });

        // 3. Number Pop: Pop this specific habit's target counter at 200ms
        const numTimer = setTimeout(() => {
          setChargePhase('incremented');
        }, 200);

        // 4. Celebration Exit: Once the fill completes (~450ms), animate the completed card exiting with upward fade
        const exitTimer = setTimeout(() => {
          onCheckIn(currentCard.id, 'done', activeDateStr);
          setChargingHabitId(null);
          setChargePhase('idle');

          setTimeout(() => {
            setIsDeckLocked(false);
          }, 350);

          if (unloggedHabits.length === 1 && completedCount >= 0) {
            confetti({
              particleCount: 75,
              spread: 80,
              origin: { y: 0.58 },
              colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'],
            });
          }
        }, 450);

        return () => {
          clearTimeout(numTimer);
          clearTimeout(exitTimer);
        };
      } else {
        // Missed / Failed action
        onCheckIn(currentCard.id, status, activeDateStr);
        setTimeout(() => {
          setIsDeckLocked(false);
        }, 350);
      }
    },
    [currentCard, chargingHabitId, isDeckLocked, onCheckIn, activeDateStr, unloggedHabits.length, completedCount]
  );

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
      <div className="w-full max-w-md sm:max-w-lg mx-auto px-4 sm:px-6 py-12 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-md">
          <Zap className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Active Habits Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
          Create positive Build Habits or control Bad Habits to start building your Flux momentum.
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
    <div className="w-full max-w-md sm:max-w-lg mx-auto px-3 sm:px-6 flex flex-col items-center">
      <div className="w-full mb-4 flex items-center justify-between bg-white/90 dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200 dark:border-slate-750 shadow-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => handleShiftDate(-1)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsDatePickerOpen(true)}
            className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 font-mono whitespace-nowrap transition-colors cursor-pointer group"
            title="Click to jump to any date"
          >
            <Calendar className="w-4 h-4 text-cyan-500 flex-shrink-0 group-hover:scale-110 transition-transform" />
            <span>{formatDisplayDate(activeDateStr, true)}</span>
          </button>

          <button
            onClick={() => handleShiftDate(1)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

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

      {activeHabits.length === 0 ? (
        <div className="w-full app-card rounded-3xl p-8 text-center border-slate-200 dark:border-slate-750 animate-scale-in">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-500 flex items-center justify-center mx-auto mb-3 border border-cyan-500/20 shadow-sm">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mb-1">
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
      ) : currentView === 'summary' ? (
        <div className="w-full animate-scale-in">
          {unloggedHabits.length > 0 && (
            <div className="mb-3.5 p-3 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-emerald-500/10 to-cyan-500/15 border border-cyan-500/30 flex items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {unloggedHabits.length} Pending Habit{unloggedHabits.length > 1 ? 's' : ''} Left
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewModeOverride('deck')}
                className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
              >
                <span>Return to Deck ⚡</span>
              </button>
            </div>
          )}

          <div className="app-card rounded-3xl p-5 sm:p-6 shadow-2xl border-slate-200 dark:border-slate-750 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full blur-3xl pointer-events-none opacity-20 bg-emerald-500 transition-all duration-700" />

            <div className="relative z-10 flex flex-col items-center pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative w-28 h-28 flex items-center justify-center my-1">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    className="stroke-slate-200 dark:stroke-slate-800"
                    strokeWidth="6"
                    fill="transparent"
                  />
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
                      <div className="text-3xl font-black font-mono text-slate-900 dark:text-slate-100 leading-none">
                        <span className="text-emerald-500 dark:text-emerald-400">{completedCount}</span>
                        <span className="text-slate-400 dark:text-slate-500 text-xl font-normal">/</span>
                        <span className="text-slate-400 dark:text-slate-500">{totalHabitsCount}</span>
                      </div>
                      <span className="text-[9px] font-bold font-mono text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider">
                        {percent}% DONE
                      </span>
                    </>
                  )}
                </div>
              </div>

              {isPerfectDay && totalHabitsCount >= 3 && (
                <div className="mt-2.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/30 text-amber-900 dark:text-amber-300 text-xs font-black font-mono flex items-center gap-2 shadow-xs animate-bounce">
                  <Gem className="w-4 h-4 fill-amber-400 text-amber-500" />
                  <span>+1 Jumbo Point Credited</span>
                  <span className="w-1 h-1 rounded-full bg-amber-400/60" />
                  <span className="text-amber-700 dark:text-amber-300 font-bold">Total: {jumboPointsCount}</span>
                </div>
              )}
            </div>

            <div className="mt-4 space-y-2 relative z-10">
              {loggedHabits.map((h, idx) => (
                <DailySummaryHabitRow
                  key={h.id}
                  habit={h}
                  activeDateStr={activeDateStr}
                  floorAtZero={floorAtZero}
                  index={idx}
                  onOpenDetail={onOpenDetail}
                  onAscendHabit={onAscendHabit}
                  onCheckIn={onCheckIn}
                />
              ))}

              {loggedHabits.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                  No habits logged yet today.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        (() => {
          const cardVariants: Variants = {
            enter: (custom: { mode: 'carousel' | 'checkin'; dir: number }) => {
              if (custom?.mode === 'checkin') {
                return {
                  x: 0,
                  y: 8,
                  scale: 0.96,
                  rotate: 0,
                  opacity: 0.85,
                  zIndex: 30,
                  transition: {
                    type: 'spring',
                    stiffness: 280,
                    damping: 24,
                    mass: 0.8,
                  },
                };
              }
              const dir = custom?.dir ?? 1;
              return {
                x: dir === -1 ? '115%' : 0,
                y: dir === -1 ? -8 : 8,
                scale: dir === -1 ? 1.02 : 0.95,
                rotate: dir === -1 ? 10 : 0,
                opacity: dir === -1 ? 0.3 : 0.7,
                zIndex: 30,
              };
            },
            center: {
              x: 0,
              y: 0,
              scale: 1,
              rotate: 0,
              opacity: 1,
              zIndex: 30,
              transition: {
                type: 'spring',
                stiffness: 280,
                damping: 24,
                mass: 0.8,
              },
            },
            exit: (custom: { mode: 'carousel' | 'checkin'; dir: number }) => {
              if (custom?.mode === 'checkin') {
                return {
                  x: 0,
                  y: -24,
                  scale: 0.98,
                  rotate: 0,
                  opacity: 0,
                  zIndex: 35,
                  transition: {
                    duration: 0.35,
                    ease: 'easeOut',
                  },
                };
              }
              const dir = custom?.dir ?? 1;
              return {
                x: dir === 1 ? '135%' : 0,
                y: dir === 1 ? 20 : 8,
                scale: dir === 1 ? 0.92 : 0.95,
                rotate: dir === 1 ? 15 : 0,
                opacity: dir === 1 ? 0 : 0.7,
                zIndex: 20,
                transition: {
                  type: 'spring',
                  stiffness: 280,
                  damping: 24,
                  mass: 0.8,
                },
              };
            },
          };

          return (
            <div className="w-full flex flex-col">
              <div className="w-full flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider font-mono">
                    Active Card Stack
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {loggedHabits.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setViewModeOverride('summary')}
                      disabled={isDeckLocked}
                      className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-0.5 rounded-lg border border-cyan-500/25 transition-all cursor-pointer flex items-center gap-1 shadow-xs disabled:opacity-50"
                      title="Peek at logged habits summary"
                    >
                      <span>Summary</span>
                      <span className="font-extrabold text-cyan-700 dark:text-cyan-300">({loggedHabits.length})</span>
                    </button>
                  )}

                  <div className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/20 dark:border-emerald-500/40 shadow-xs">
                    {safeIndex + 1}/{pendingCount}
                  </div>
                </div>
              </div>

              <div className="w-full mb-3.5">
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${(loggedHabits.length / totalHabitsCount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="w-full relative flex items-center justify-center pb-3 sm:pb-4">
                {hasPrev && (
                  <button
                    type="button"
                    onClick={handlePrevCard}
                    disabled={!!chargingHabitId || isDeckLocked}
                    className="absolute -left-3.5 sm:-left-5 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-slate-850/95 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md sm:shadow-lg backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:scale-110 active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none group"
                    title="Bring back previous card from right"
                    aria-label="Previous Card"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
                  </button>
                )}

                <div className="w-full relative min-h-[480px]">
                  {remainingUnderneath >= 2 && nextNextCard && (
                    <div
                      className="absolute inset-0 translate-y-4 sm:translate-y-5 scale-[0.92] z-10 rounded-3xl border border-slate-300/80 dark:border-slate-700/80 bg-slate-100/90 dark:bg-slate-850/90 shadow-md pointer-events-none transition-all duration-300 overflow-hidden"
                      style={{
                        borderTop: `4px solid ${(nextNextCard.color || '#94a3b8')}50`,
                      }}
                    />
                  )}

                  {remainingUnderneath >= 1 && nextCard && (
                    <motion.div
                      key={`bg-${nextCard.id}`}
                      className="absolute inset-0 pointer-events-none"
                      animate={{
                        scale: 0.96,
                        y: 8,
                        opacity: 0.85,
                        zIndex: 20,
                      }}
                      transition={{
                        type: 'spring',
                        stiffness: 280,
                        damping: 24,
                        mass: 0.8,
                      }}
                    >
                      <HabitCardContent
                        habit={nextCard}
                        activeDateStr={activeDateStr}
                        floorAtZero={floorAtZero}
                        isInteractive={false}
                      />
                    </motion.div>
                  )}

                  <AnimatePresence custom={{ mode: animationMode, dir: direction }} initial={false} mode="popLayout">
                    {currentCard && (
                      <motion.div
                        key={currentCard.id}
                        custom={{ mode: animationMode, dir: direction }}
                        variants={cardVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        drag={!chargingHabitId && !isDeckLocked ? 'x' : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.65}
                        onDragEnd={(_, info) => {
                          if (chargingHabitId || isDeckLocked) return;
                          if (info.offset.x > 70 && hasNext) {
                            handleNextCard();
                          } else if (info.offset.x < -70 && hasPrev) {
                            handlePrevCard();
                          }
                        }}
                        className="w-full relative z-30 touch-pan-y"
                      >
                        <HabitCardContent
                          habit={currentCard}
                          activeDateStr={activeDateStr}
                          floorAtZero={floorAtZero}
                          isInteractive={true}
                          isCharging={chargingHabitId === currentCard.id}
                          isDeckLocked={isDeckLocked}
                          chargePhase={chargingHabitId === currentCard.id ? chargePhase : 'idle'}
                          onCheckIn={handleCheckInCard}
                          onOpenDetail={onOpenDetail}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {hasNext && (
                  <button
                    type="button"
                    onClick={handleNextCard}
                    disabled={!!chargingHabitId || isDeckLocked}
                    className="absolute -right-3.5 sm:-right-5 top-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/95 dark:bg-slate-850/95 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md sm:shadow-lg backdrop-blur-md flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 hover:scale-110 active:scale-90 transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none group"
                    title="Swipe card towards right"
                    aria-label="Next Card"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
                  </button>
                )}
              </div>

              {loggedHabits.length > 0 && (
                <div className="w-full mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => setViewModeOverride('summary')}
                    className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors cursor-pointer inline-flex items-center gap-1 py-1 px-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span>View Today's Logged Summary ({completedCount} Done{loggedHabits.length - completedCount > 0 ? `, ${loggedHabits.length - completedCount} Missed` : ''})</span>
                    <span>→</span>
                  </button>
                </div>
              )}
            </div>
          );
        })()
      )}

      <DatePickerPopover
        activeDateStr={activeDateStr}
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        onSelectDate={onSelectDate}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gem,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Sparkles,
  Zap,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import type { Habit } from '../../types/habit';
import { DynamicIcon } from '../DynamicIcon';
import {
  useJumboAnalytics,
  type DayJumboStatus,
  type JumboWindowMode,
} from '../../hooks/useJumboAnalytics';

interface JumboPointsVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  jumboDates: string[];
}

export const JumboPointsVaultModal: React.FC<JumboPointsVaultModalProps> = ({
  isOpen,
  onClose,
  habits,
  jumboDates,
}) => {
  const [selectedDay, setSelectedDay] = useState<DayJumboStatus | null>(null);
  const [windowMode, setWindowMode] = useState<JumboWindowMode>('smart');

  const {
    days,
    cleanRate,
    perfectDaysCount,
    longestFlawlessStreak,
    rankedSaboteurs,
    maxBreaks,
    totalPoints,
    nextMilestone,
    windowStartDate,
    windowEndDate,
  } = useJumboAnalytics(habits, jumboDates, windowMode);

  // Diagnostic log for historical accomplishments inspection
  React.useEffect(() => {
    if (isOpen) {
      console.log('Jumbo Vault Data Map:', {
        storedJumboPoints: totalPoints,
        jumboDatesArray: jumboDates,
        sampleHabitKeys: habits.map((h) => ({
          name: h.name,
          recordedDates: Object.keys(h.history || {}),
        })),
      });
    }
  }, [isOpen, totalPoints, jumboDates, habits]);

  if (!isOpen) return null;

  const hasAnySaboteurs = rankedSaboteurs.some((s) => s.count > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop Click Dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative z-10 bg-white dark:bg-slate-900 rounded-[2.2rem] sm:rounded-[2.5rem] p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-amber-200/50 dark:border-amber-500/20 overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none" />

        {/* Sticky Close Tag */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer"
          title="Close Vault"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ZONE 1: HERO VAULT COUNTER */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 p-0.5 shadow-lg shadow-amber-400/25 flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-amber-400">
                <Gem className="w-7 h-7 fill-amber-400 text-amber-300 drop-shadow-md animate-pulse" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                  {totalPoints}
                </span>
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                  Jumbo Points
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>100% Habit Conquered Days</span>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex flex-col items-end">
            <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
              <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
              <span>{cleanRate}% Clean Rate</span>
            </span>
            <span className="text-[10px] font-mono text-slate-400 mt-1">
              {perfectDaysCount} of 28 Days Conquered
            </span>
          </div>
        </div>

        {/* LIFETIME JUMBO METRICS STRIP */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 my-3 relative z-10">
          <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Gem className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span className="text-lg sm:text-xl font-black font-mono">{totalPoints}</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 dark:text-slate-300 mt-0.5">
              Total Conquered Days
            </span>
          </div>

          <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/25 flex flex-col items-center justify-center text-center shadow-2xs">
            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span className="text-lg sm:text-xl font-black font-mono">{longestFlawlessStreak}d</span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-bold font-mono text-slate-600 dark:text-slate-300 mt-0.5">
              Longest Perfect Run
            </span>
          </div>
        </div>

        {/* ZONE 2: THE 28-DAY CONSTELLATION MATRIX */}
        <div className="py-2.5 relative z-10">
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200">
                Constellation
              </span>
              <span className="text-slate-400 font-normal text-[10px] font-mono">
                ({windowStartDate} – {windowEndDate})
              </span>
            </div>

            {/* Window Mode Selector */}
            <div className="inline-flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold">
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  setWindowMode('smart');
                }}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  windowMode === 'smart'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="Anchor to most recent user activity"
              >
                Active Window
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  setWindowMode('recent');
                }}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  windowMode === 'recent'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
                title="28-day window ending today"
              >
                Today
              </button>
              {longestFlawlessStreak > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(null);
                    setWindowMode('streak');
                  }}
                  className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                    windowMode === 'streak'
                      ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-xs'
                      : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                  title="28-day window containing longest unbroken run"
                >
                  Best Run
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 text-[10px] font-mono font-medium text-slate-400 mb-1.5">
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 border border-amber-500 inline-block" />
              <span>Claimed</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-rose-400 inline-block" />
              <span>Broken</span>
            </div>
          </div>

          {/* 4x7 Constellation Grid */}
          <div className="bg-slate-50/80 dark:bg-slate-850/60 p-3 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {days.map((day) => {
                const isClaimed = day.isPerfect;
                const isSelected = selectedDay?.dateKey === day.dateKey;
                const hasFailures = day.failedHabits.length > 0;

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`h-8 sm:h-9 rounded-xl flex items-center justify-center relative transition-all duration-200 active:scale-90 cursor-pointer ${
                      isClaimed
                        ? 'bg-gradient-to-tr from-amber-400/25 via-yellow-400/20 to-amber-500/30 border border-amber-400/60 text-amber-500 shadow-xs shadow-amber-400/20 hover:scale-105 hover:border-amber-400'
                        : day.isFuture
                        ? 'border border-dashed border-slate-200 dark:border-slate-800 bg-transparent opacity-30 cursor-default'
                        : hasFailures
                        ? 'bg-white dark:bg-slate-800 border border-rose-300/80 dark:border-rose-900/60 hover:border-rose-400 text-rose-500'
                        : 'bg-slate-100/50 dark:bg-slate-800/30 border border-dashed border-slate-200/90 dark:border-slate-750/60 text-slate-300 dark:text-slate-600'
                    } ${isSelected ? 'ring-2 ring-amber-500 dark:ring-amber-400 scale-105' : ''}`}
                    title={`${day.displayDate}: ${isClaimed ? '💎 Jumbo Claimed' : hasFailures ? `${day.failedHabits.length} Habits Missed` : 'Incomplete'}`}
                  >
                    {isClaimed ? (
                      <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-400 text-amber-500 drop-shadow-xs" />
                    ) : hasFailures ? (
                      <div className="relative flex items-center justify-center">
                        <span className="w-3.5 h-3.5 rounded-full border border-rose-400/70 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        </span>
                      </div>
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Interactive Day Details Micro-Banner */}
            <AnimatePresence>
              {selectedDay && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-750 flex items-center justify-between text-xs font-mono"
                >
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1 pr-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {selectedDay.displayDate}
                    </span>
                    <span className="text-slate-400">•</span>
                    {selectedDay.isPerfect ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <Gem className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        Perfect Day: All habits conquered (+1 💎)
                      </span>
                    ) : selectedDay.failedHabits.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          Missed Jumbo:
                        </span>
                        {selectedDay.failedHabits.map((h) => (
                          <span
                            key={h.id}
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-900/40"
                          >
                            <DynamicIcon name={h.icon} className="w-2.5 h-2.5" />
                            <span>{h.name}</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 dark:text-slate-400 font-bold">
                        Incomplete: No check-in recorded
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 cursor-pointer"
                  >
                    Dismiss
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ZONE 3: THE SABOTEUR RADAR */}
        <div className="py-2.5 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <span>Saboteur Radar</span>
              <span className="text-slate-400 font-normal text-[11px]">(Break Frequency)</span>
            </span>
          </div>

          <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
            {!hasAnySaboteurs ? (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="font-bold">Zero Saboteurs: Perfect habit discipline across all fronts.</span>
              </div>
            ) : (
              rankedSaboteurs.map(({ habit, count, isTopSaboteur }) => {
                const barWidth = Math.max(8, Math.round((count / maxBreaks) * 100));

                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-2 text-xs font-mono"
                  >
                    {/* Habit Icon & Name */}
                    <div className="flex items-center gap-1.5 w-24 sm:w-28 truncate flex-shrink-0">
                      <div
                        className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${habit.color}25`, color: habit.color }}
                      >
                        <DynamicIcon name={habit.icon} className="w-3 h-3" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                        {habit.name}
                      </span>
                    </div>

                    {/* Proportional Bar (Only when count > 0) */}
                    <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden relative">
                      {count > 0 ? (
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isTopSaboteur
                              ? 'bg-gradient-to-r from-rose-500 to-rose-400 shadow-xs shadow-rose-500/30'
                              : 'bg-rose-500/80 dark:bg-rose-500/70'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      ) : (
                        <div className="h-full rounded-full bg-transparent w-full" />
                      )}
                    </div>

                    {/* Count Tag */}
                    <div className="flex-shrink-0 min-w-[85px] text-right">
                      {isTopSaboteur ? (
                        <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 font-black text-[10px] inline-flex items-center gap-1">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>{count} {count === 1 ? 'Day' : 'Days'} Interrupted</span>
                        </span>
                      ) : count > 0 ? (
                        <span className="text-rose-600 dark:text-rose-400 text-[11px] font-bold">
                          {count} {count === 1 ? 'Day' : 'Days'} Interrupted
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>100% Flawless</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ZONE 4: VAULT UTILITY TEASER (Next Reward Milestone) */}
        <div className="mt-2.5 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-400/30">
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
              <div className="flex items-center gap-1 text-slate-900 dark:text-white">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>Next Milestone: {nextMilestone.rewardTitle}</span>
              </div>
              <span className="text-amber-700 dark:text-amber-300 font-black">
                {nextMilestone.currentPoints} / {nextMilestone.targetPoints} 💎
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-750 h-2 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-500 transition-all duration-500"
                style={{ width: `${nextMilestone.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

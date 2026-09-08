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
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Habit } from '../../types/habit';
import { DynamicIcon } from '../DynamicIcon';
import {
  useJumboAnalytics,
  type DayJumboStatus,
} from '../../hooks/useJumboAnalytics';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

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
  const [pageOffset, setPageOffset] = useState<number>(0);

  const {
    days,
    cleanRate,
    conqueredCount,
    interruptedCount,
    longestFlawlessStreak,
    rankedSaboteurs,
    totalPoints,
    nextMilestone,
    rangeTitle,
  } = useJumboAnalytics(habits, jumboDates, pageOffset);

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
        className="relative z-10 bg-white dark:bg-slate-900 rounded-[2.2rem] sm:rounded-[2.5rem] p-5 sm:p-7 max-w-lg w-full shadow-2xl border border-amber-200/50 dark:border-amber-500/20 overflow-hidden max-h-[90vh] flex flex-col"
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

        {/* Scrollable Container */}
        <div className="overflow-y-auto space-y-4 pr-1 -mr-1">
          {/* ZONE 1: HERO VAULT COUNTER */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-500 p-0.5 shadow-lg shadow-amber-400/25 flex items-center justify-center flex-shrink-0">
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
                  <Sparkles className="w-3 h-3 text-amber-500 flex-shrink-0" />
                  <span>All Habits Conquered</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex flex-col items-end">
              <span className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-bold font-mono px-2.5 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                <span>{cleanRate}% Clean Rate</span>
              </span>
            </div>
          </div>

          {/* STREAMLINED TOP METRICS ROW (2 COLUMNS) */}
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 relative z-10">
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

          {/* ZONE 2: UNIFIED 7-COLUMN CALENDAR GRID ARCHITECTURE */}
          <div className="py-2.5 relative z-10 bg-slate-50/80 dark:bg-slate-850/60 p-3 sm:p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
            {/* Header Controls & Date Range */}
            <div className="flex items-center justify-between mb-3 px-0.5">
              <div className="flex items-center gap-1.5 font-mono text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200">
                <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <span>{rangeTitle}</span>
              </div>

              {/* Pagination Controls (<, Current, >) */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(null);
                    setPageOffset((prev) => prev - 1);
                  }}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs active:scale-95"
                  title="Previous 28 Days"
                  aria-label="Previous 28 Days"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {pageOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedDay(null);
                      setPageOffset(0);
                    }}
                    className="px-2 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] font-mono font-bold transition-colors cursor-pointer border border-amber-500/20"
                  >
                    Current
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(null);
                    setPageOffset((prev) => prev + 1);
                  }}
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs active:scale-95"
                  title="Next 28 Days"
                  aria-label="Next 28 Days"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekday Column Headers (MON - SUN) */}
            <div className="grid grid-cols-7 gap-1.5 mb-1 text-center">
              {WEEKDAYS.map((dayName) => (
                <div
                  key={dayName}
                  className="text-[11px] font-bold tracking-widest text-slate-400 dark:text-slate-500 text-center uppercase font-mono pb-1"
                >
                  {dayName}
                </div>
              ))}
            </div>

            {/* 28-Day Jumbo Calendar Tiles */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {days.map((day) => {
                const isClaimed = day.isPerfect;
                const isSelected = selectedDay?.dateKey === day.dateKey;
                const hasFailures = day.isBroken;

                let tileBg =
                  'bg-slate-50/40 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 text-slate-400';

                if (isClaimed) {
                  tileBg =
                    'bg-amber-500/10 border border-amber-400/40 dark:bg-amber-950/20 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 shadow-2xs hover:border-amber-400';
                } else if (hasFailures) {
                  tileBg =
                    'bg-rose-500/10 border border-rose-300/40 dark:bg-rose-950/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:border-rose-400';
                }

                if (day.isToday) {
                  tileBg += ' ring-2 ring-amber-500 dark:ring-amber-400';
                }

                return (
                  <button
                    key={day.dateKey}
                    type="button"
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`aspect-square rounded-2xl flex flex-col justify-between p-1.5 sm:p-2 transition-all cursor-pointer select-none text-center hover:scale-[1.04] active:scale-95 ${tileBg} ${
                      isSelected ? 'ring-2 ring-amber-500 shadow-md scale-105 z-10' : ''
                    }`}
                    title={`${day.displayDate}: ${
                      isClaimed
                        ? '💎 Jumbo Conquered Day'
                        : hasFailures
                        ? `✕ Lost Day (${day.failedHabits.length} Missed)`
                        : 'Unlogged / Rest Day'
                    }`}
                  >
                    {/* Date Label: Top Day Num + Month */}
                    <div className="flex items-center justify-between w-full text-[9px] font-mono leading-none">
                      <span className="font-mono text-xs font-black">{day.dayNum}</span>
                      <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase text-slate-400">
                        {day.monthShort}
                      </span>
                    </div>

                    {/* Center Visual Badge */}
                    <div className="my-auto flex items-center justify-center">
                      {isClaimed ? (
                        <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-amber-400 text-white flex items-center justify-center shadow-sm shadow-amber-500/30">
                          <Gem className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white text-white drop-shadow-xs" />
                        </div>
                      ) : hasFailures ? (
                        <div className="w-5.5 h-5.5 sm:w-6 sm:h-6 rounded-full bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow-sm shadow-rose-500/20">
                          <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                      )}
                    </div>
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
                      <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                        <Gem className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                        Conquered: All habits completed (+1 💎)
                      </span>
                    ) : selectedDay.failedHabits.length > 0 ? (
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          Lost Jumbo:
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
                        Unlogged: No check-ins recorded
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

            {/* Grid Summary Footer */}
            <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-750 flex items-center justify-center gap-6 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-[9px] shadow-xs">
                  <Gem className="w-2.5 h-2.5 fill-white text-white" />
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  Conquered ({conqueredCount})
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-[9px] shadow-xs">
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  Interrupted ({interruptedCount})
                </span>
              </div>
            </div>
          </div>

          {/* ZONE 3: INTEGRATED SABOTEUR LIST (Why You Missed) */}
          <div className="py-2 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider font-mono text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>Break Frequency</span>
                <span className="text-slate-400 font-normal text-[11px]">(Saboteur Radar)</span>
              </span>
            </div>

            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
              {!hasAnySaboteurs ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs font-mono text-emerald-700 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="font-bold">Zero Saboteurs: Perfect habit discipline across all fronts.</span>
                </div>
              ) : (
                rankedSaboteurs.map(({ habit, count }) => {
                  return (
                    <div
                      key={habit.id}
                      className="flex items-center justify-between gap-2 text-xs font-mono py-1 px-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-850/50 transition-colors"
                    >
                      {/* Habit Icon + Name */}
                      <div className="flex items-center gap-2 truncate">
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

                      {/* Status Pill */}
                      <div className="flex-shrink-0">
                        {count > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-400 font-bold text-[10px] inline-flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            <span>
                              {count} {count === 1 ? 'Day' : 'Days'} Interrupted
                            </span>
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
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 relative z-10">
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
        </div>
      </motion.div>
    </div>
  );
};

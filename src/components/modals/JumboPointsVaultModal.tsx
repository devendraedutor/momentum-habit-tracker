import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gem,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Swords,
  ShieldCheck,
  Lock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import type { Habit } from '../../types/habit';
import { DynamicIcon } from '../DynamicIcon';
import {
  useJumboAnalytics,
  type DayJumboStatus,
  type JumboHistoryRange,
  formatRuinedDate,
} from '../../hooks/useJumboAnalytics';
import { getHistoricalPendingBacklog } from '../../lib/storage';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const RANGE_OPTIONS: JumboHistoryRange[] = ['30d', '60d', '90d'];

interface JumboPointsVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  jumboDates: string[];
  onSelectDate?: (dateStr: string) => void;
}

export const JumboPointsVaultModal: React.FC<JumboPointsVaultModalProps> = ({
  isOpen,
  onClose,
  habits,
  jumboDates,
  onSelectDate,
}) => {
  const [hoveredDay, setHoveredDay] = useState<DayJumboStatus | null>(null);
  const [hoveredHabitId, setHoveredHabitId] = useState<string | null>(null);
  const [historyRange, setHistoryRange] = useState<JumboHistoryRange>('30d');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const pendingBacklog = React.useMemo(() => getHistoricalPendingBacklog(habits), [habits]);
  const isAuditRequired = pendingBacklog.length > 0;

  const {
    days,
    conqueredCount,
    failedCount,
    totalPoints,
    rangeTitle,
    saboteurRanking,
  } = useJumboAnalytics(habits, jumboDates, historyRange, weekOffset);

  if (!isOpen) return null;

  const stepWeeks = historyRange === '90d' ? 13 : historyRange === '60d' ? 9 : 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop Click Dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative z-10 w-[92vw] max-w-5xl h-[88vh] max-h-[920px] mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. TOP ROW: PURE IDENTITY + CLOSE BUTTON */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 relative z-10 flex-shrink-0">
          {/* Left: Jumbo Vault Identity */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-2xl drop-shadow-sm text-amber-500 flex-shrink-0">
              <Gem className="w-5.5 h-5.5 sm:w-6 sm:h-6 fill-amber-400 text-amber-500" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {totalPoints}
              </span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                Jumbo Points
              </span>
            </div>
          </div>

          {/* Right: Clean Close Tag */}
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            title="Close Vault"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* CONDITIONAL BRANCH: AUDIT REQUIRED LOCKOUT VS ANALYTICS VIEW    */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {isAuditRequired ? (
          /* VAULT AUDIT LOCK SCREEN */
          <div className="overflow-y-auto flex-1 py-6 px-1 space-y-6 scrollbar-thin">
            {/* Header & Lock Icon */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-b from-amber-500/20 via-yellow-500/10 to-amber-600/25 border-2 border-amber-400/60 dark:border-amber-400/40 flex items-center justify-center shadow-lg shadow-amber-500/20 animate-pulse">
                  <Lock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500 stroke-[2.5]" />
                </div>
                <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <AlertTriangle className="w-4 h-4 fill-white text-amber-500" />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  Vault Locked • Pending Past Check-ins
                </h3>
                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 text-xs font-mono font-bold text-amber-700 dark:text-amber-300">
                  <span>⚠️ {pendingBacklog.length} past {pendingBacklog.length === 1 ? 'day needs' : 'days need'} attention</span>
                </div>
              </div>

              <div className="px-3.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Audited Score: <span className="text-amber-600 dark:text-amber-400">{totalPoints} JUMBO POINTS</span>
              </div>
            </div>

            {/* Interactive Action List (Fix-It Cards) */}
            <div className="space-y-2.5 pt-1 max-w-2xl mx-auto w-full">
              <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                Unresolved Dates ({pendingBacklog.length})
              </div>

              {pendingBacklog.map((item) => (
                <div
                  key={item.dateKey}
                  className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750/80 hover:border-amber-400/60 dark:hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-amber-500" />
                        {item.displayDate}
                      </span>
                    </div>

                    {/* Pending Habit Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.pendingHabits.map((h) => (
                        <span
                          key={h.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-mono font-semibold border border-amber-200/60 dark:border-amber-800/40"
                        >
                          <DynamicIcon name={h.icon} className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                          <span className="truncate max-w-[140px]">{h.name}</span>
                        </span>
                      ))}
                    </div>

                    <div className="text-xs font-mono font-bold text-rose-500 dark:text-rose-400">
                      {item.pendingHabits.length} {item.pendingHabits.length === 1 ? 'habit' : 'habits'} unlogged
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onSelectDate) {
                        onSelectDate(item.dateKey);
                      }
                      onClose();
                    }}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-amber-500/20 cursor-pointer flex-shrink-0"
                  >
                    <span>👉 Resolve Date</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* FULL UNLOCKED 30D/60D/90D ANALYTICS VIEW */
          <div className="overflow-y-auto flex-1 pr-2 scrollbar-thin space-y-6 pb-4">
            {/* 2. CALENDAR BLOCK WRAPPER (Defines the boundary of contextual sticky positioning) */}
            <section className="relative">
              {/* PINNED CONTROLS ASSEMBLY (Sticky strictly while calendar is in view, 100% solid with edge occlusion) */}
              <div className="sticky top-0 z-20 bg-white dark:bg-slate-900 pt-3 pb-2.5 border-b border-slate-100 dark:border-slate-800 -mx-6 px-6 sm:-mx-8 sm:px-8 shadow-xs">
                {/* 1. Date Range + Filter + Navigation Arrows */}
                <div className="flex items-center justify-between gap-3 py-1 w-full flex-wrap sm:flex-nowrap bg-white dark:bg-slate-900">
                  {/* Left: Date Range */}
                  <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 text-sm font-mono flex-shrink-0">
                    <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    <span>{rangeTitle}</span>
                  </div>

                  {/* Right: Inline Filter + Pagination Group */}
                  <div className="flex items-center gap-2 ml-auto">
                    {/* Duration Segment Pill */}
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                      {RANGE_OPTIONS.map((range) => {
                        const isActive = historyRange === range;
                        return (
                          <button
                            key={range}
                            type="button"
                            onClick={() => setHistoryRange(range)}
                            className={`font-mono text-xs px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                              isActive
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs shadow-amber-500/20'
                                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                          >
                            {range === '30d' ? '30 D' : range === '60d' ? '60 D' : '90 D'}
                          </button>
                        );
                      })}
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setWeekOffset((prev) => prev - stepWeeks)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs active:scale-95"
                        aria-label="Previous Period"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {weekOffset !== 0 && (
                        <button
                          type="button"
                          onClick={() => setWeekOffset(0)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-mono font-bold transition-colors cursor-pointer border border-amber-500/20"
                        >
                          Current
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setWeekOffset((prev) => prev + stepWeeks)}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs active:scale-95"
                        aria-label="Next Period"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. 7-Column Weekday Headers */}
                <div className="grid grid-cols-7 gap-x-3 sm:gap-x-4 text-center px-1 pt-2 bg-white dark:bg-slate-900">
                  {WEEKDAYS.map((dayName) => (
                    <div
                      key={dayName}
                      className="text-xs font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider text-center uppercase"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>
              </div>

              {/* CALENDAR TILES GRID */}
              <div className="grid grid-cols-7 gap-x-3 sm:gap-x-4 gap-y-3 sm:gap-y-4 px-1 pt-3 relative">
                {days.map((day) => {
                  const isConquered = day.isPerfect;
                  const isMissed = day.isBroken;
                  const isHovered = hoveredDay?.dateKey === day.dateKey;

                  let tileStyle =
                    'bg-slate-50/50 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-400';

                  if (isConquered) {
                    tileStyle =
                      'bg-amber-500/10 border border-amber-300/60 dark:bg-amber-950/20 dark:border-amber-500/30 text-amber-900/80 dark:text-amber-200/80 shadow-2xs hover:border-amber-400';
                  } else if (isMissed) {
                    tileStyle =
                      'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-600 dark:text-rose-400 hover:border-rose-400';
                  }

                  if (day.isToday) {
                    tileStyle += ' ring-2 ring-amber-500 dark:ring-amber-400 border-amber-500 shadow-xs';
                  }

                  return (
                    <div
                      key={day.dateKey}
                      className="relative flex flex-col items-center"
                      onMouseEnter={() => {
                        // Only trigger hover tooltip for failed days
                        if (isMissed) setHoveredDay(day);
                      }}
                      onMouseLeave={() => setHoveredDay(null)}
                    >
                      <div
                        className={`w-full aspect-[1.35/1] sm:aspect-[1.5/1] rounded-2xl border p-1.5 sm:p-2 flex flex-col justify-between items-center transition-all select-none text-center ${tileStyle}`}
                      >
                        {/* Top Day Number + Month Label */}
                        <div className="flex items-center justify-between w-full px-1 text-[9px] sm:text-[10px] font-mono leading-none">
                          <span className="font-mono text-xs sm:text-sm font-black">{day.dayNum}</span>
                          <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase opacity-75">
                            {day.monthShort}
                          </span>
                        </div>

                        {/* Center Badge Scale */}
                        <div className="my-auto flex items-center justify-center">
                          {isConquered ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-white flex items-center justify-center shadow-xs shadow-amber-500/40">
                              <Gem className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-white text-white drop-shadow-xs" />
                            </div>
                          ) : isMissed ? (
                            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-xs shadow-rose-500/20">
                              <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 stroke-[3]" />
                            </div>
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                          )}
                        </div>
                      </div>

                      {/* Single Floating Tooltip for Failed Days Only (Clean Vertical Stack) */}
                      <AnimatePresence>
                        {isHovered && isMissed && (
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 2, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-40 pointer-events-none bg-slate-900/95 dark:bg-slate-950 text-white text-xs font-semibold px-3 py-2.5 rounded-xl shadow-xl border border-slate-700/60 flex flex-col gap-1.5 min-w-[130px] whitespace-nowrap"
                          >
                            {day.failedHabits.map((h) => (
                              <div key={h.id} className="flex items-center gap-2 text-rose-300">
                                <DynamicIcon name={h.icon} className="w-3.5 h-3.5 flex-shrink-0" />
                                <span className="font-medium text-slate-100">{h.name}</span>
                              </div>
                            ))}

                            {/* Tooltip Arrow */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-950" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>

              {/* CALENDAR LEGEND SUMMARY */}
              <div className="pt-4 pb-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-8 text-xs font-mono text-slate-600 dark:text-slate-400 flex-wrap">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-4 h-4 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center text-white font-black text-[9px] shadow-xs shadow-amber-500/30">
                    <Gem className="w-2.5 h-2.5 fill-white text-white" />
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Conquered ({conqueredCount})
                  </span>
                </div>

                <div className="flex items-center gap-2 font-bold">
                  <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-[9px] shadow-xs">
                    <X className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                  <span className="text-slate-700 dark:text-slate-300">
                    Failed ({failedCount})
                  </span>
                </div>
              </div>
            </section>

            {/* 3. LOWER SECTION: HABIT SABOTEUR RANKING */}
            <section className="pt-2">
              <div className="p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-3.5">
                {/* Header */}
                <div className="text-xs font-mono font-bold tracking-widest text-slate-400 dark:text-slate-500 uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span>👾 HABIT SABOTEUR RANKING</span>
                  </span>
                  <span>IMPACT SHARE</span>
                </div>

                {/* List of Habits */}
                <div className="space-y-2.5">
                  {saboteurRanking.length === 0 ? (
                    <div className="p-4 text-center text-xs font-mono text-slate-400">
                      No active habits found for this time range.
                    </div>
                  ) : (
                    saboteurRanking.map((item, idx) => {
                      const isTopBoss = idx === 0 && item.ruinedCount > 0;
                      const isHabitHovered = hoveredHabitId === item.id;

                      // 1. Rank 1: Active Boss
                      if (isTopBoss) {
                        return (
                          <div
                            key={item.id}
                            className="relative"
                            onMouseEnter={() => setHoveredHabitId(item.id)}
                            onMouseLeave={() => setHoveredHabitId(null)}
                          >
                            <div className="bg-rose-500/10 border border-rose-200 dark:border-rose-900/40 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-4 shadow-2xs cursor-default">
                              {/* Left: Icon + Name + Active Boss tag adjacent on right */}
                              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div
                                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: `${item.color || '#f43f5e'}25`,
                                    color: item.color || '#f43f5e',
                                  }}
                                >
                                  <DynamicIcon name={item.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                                </div>

                                <div className="flex items-center gap-2 flex-wrap min-w-0">
                                  <span className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                                    {item.name}
                                  </span>
                                  <span className="bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-wider uppercase inline-flex items-center gap-1 flex-shrink-0 shadow-xs">
                                    <Swords className="w-2.5 h-2.5" />
                                    <span>Active Boss</span>
                                  </span>
                                </div>
                              </div>

                              {/* Right: Ruined count & Impact Share */}
                              <div className="flex-shrink-0 text-right font-mono">
                                <div className="font-black text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                                  💔 Ruined {item.ruinedCount} {item.ruinedCount === 1 ? 'Day' : 'Days'}
                                </div>
                                <div className="text-[10px] text-slate-400 uppercase tracking-tight">
                                  {item.leakPercentage}% of all leaks
                                </div>
                              </div>
                            </div>

                            {/* Hover Breakdown Popover (Up to 15 days + scrollable clamp) */}
                            <AnimatePresence>
                              {isHabitHovered && item.ruinedDates.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 2, scale: 0.96 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-full mb-2 right-4 sm:right-6 z-50 pointer-events-none bg-slate-900/95 dark:bg-slate-950 text-white text-xs p-3.5 rounded-2xl shadow-2xl border border-slate-700/60 min-w-[210px] max-w-[300px]"
                                >
                                  <div className="font-mono font-bold text-rose-400 mb-2 text-xs flex items-center gap-1.5">
                                    <span>💔 Ruined Days ({item.ruinedCount}):</span>
                                  </div>
                                  <div className="space-y-1 font-mono text-[11px] text-slate-200 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                                    {item.ruinedDates.slice(0, 15).map((d) => (
                                      <div key={d} className="flex items-center gap-1.5 text-slate-300">
                                        <span className="text-rose-400">•</span>
                                        <span>{formatRuinedDate(d)}</span>
                                      </div>
                                    ))}
                                    {item.ruinedDates.length > 15 && (
                                      <div className="text-[10px] text-slate-400 font-mono italic pt-1">
                                        +{item.ruinedDates.length - 15} more days
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      // 2. Remaining Habits with Breaks (ruinedCount > 0)
                      if (item.ruinedCount > 0) {
                        return (
                          <div
                            key={item.id}
                            className="relative"
                            onMouseEnter={() => setHoveredHabitId(item.id)}
                            onMouseLeave={() => setHoveredHabitId(null)}
                          >
                            <div className="p-3 sm:p-3.5 rounded-xl bg-white/70 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 cursor-default hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
                              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                                <div
                                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: `${item.color || '#64748b'}20`,
                                    color: item.color || '#64748b',
                                  }}
                                >
                                  <DynamicIcon name={item.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </div>
                                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {item.name}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 flex-shrink-0 text-right font-mono">
                                <span className="text-xs font-bold text-rose-500/90">
                                  Ruined {item.ruinedCount} {item.ruinedCount === 1 ? 'Day' : 'Days'}
                                </span>
                                <span className="text-[11px] font-bold text-slate-400 min-w-[36px]">
                                  {item.leakPercentage}%
                                </span>
                              </div>
                            </div>

                            {/* Hover Breakdown Popover (Up to 15 days + scrollable clamp) */}
                            <AnimatePresence>
                              {isHabitHovered && item.ruinedDates.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 4, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: 2, scale: 0.96 }}
                                  transition={{ duration: 0.15 }}
                                  className="absolute bottom-full mb-2 right-4 sm:right-6 z-50 pointer-events-none bg-slate-900/95 dark:bg-slate-950 text-white text-xs p-3.5 rounded-2xl shadow-2xl border border-slate-700/60 min-w-[210px] max-w-[300px]"
                                >
                                  <div className="font-mono font-bold text-rose-400 mb-2 text-xs flex items-center gap-1.5">
                                    <span>💔 Ruined Days ({item.ruinedCount}):</span>
                                  </div>
                                  <div className="space-y-1 font-mono text-[11px] text-slate-200 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                                    {item.ruinedDates.slice(0, 15).map((d) => (
                                      <div key={d} className="flex items-center gap-1.5 text-slate-300">
                                        <span className="text-rose-400">•</span>
                                        <span>{formatRuinedDate(d)}</span>
                                      </div>
                                    ))}
                                    {item.ruinedDates.length > 15 && (
                                      <div className="text-[10px] text-slate-400 font-mono italic pt-1">
                                        +{item.ruinedDates.length - 15} more days
                                      </div>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      }

                      // 3. Habits with Zero Breaks (ruinedCount === 0)
                      return (
                        <div
                          key={item.id}
                          className="p-3 sm:p-3.5 rounded-xl bg-white/40 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800/50 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: `${item.color || '#10b981'}20`,
                                color: item.color || '#10b981',
                              }}
                            >
                              <DynamicIcon name={item.icon} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </div>
                            <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">
                              {item.name}
                            </span>
                          </div>

                          <div className="flex-shrink-0 text-right">
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono text-xs font-bold inline-flex items-center gap-1.5">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              <span>100% Flawless (0 Leaks)</span>
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </motion.div>
    </div>
  );
};

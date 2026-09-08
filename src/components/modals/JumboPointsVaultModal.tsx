import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gem,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Flame,
  Trophy,
  Zap,
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
  const [selectedDay, setSelectedDay] = useState<DayJumboStatus | null>(null);
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
    streakStats,
    deficitStats,
    bossHabit,
  } = useJumboAnalytics(habits, jumboDates, historyRange, weekOffset);

  // Diagnostic log for historical accomplishments inspection
  React.useEffect(() => {
    if (isOpen) {
      console.log('Jumbo Vault Data Map:', {
        storedJumboPoints: totalPoints,
        jumboDatesArray: jumboDates,
        pendingBacklogCount: pendingBacklog.length,
        sampleHabitKeys: habits.map((h) => ({
          name: h.name,
          recordedDates: Object.keys(h.history || {}),
        })),
      });
    }
  }, [isOpen, totalPoints, jumboDates, habits, pendingBacklog]);

  if (!isOpen) return null;

  const stepWeeks = historyRange === '90d' ? 13 : historyRange === '60d' ? 9 : 4;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in select-none">
      {/* Backdrop Click Dismiss */}
      <div className="fixed inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative z-10 max-w-2xl w-full mx-auto p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* 1. TOP ROW: PURE IDENTITY + CLOSE BUTTON */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 relative z-10">
          {/* Left: Jumbo Vault Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-xl drop-shadow-sm text-amber-500 flex-shrink-0">
              <Gem className="w-5 h-5 sm:w-5.5 sm:h-5.5 fill-amber-400 text-amber-500" />
            </div>

            <div className="flex items-baseline gap-1.5 sm:gap-2">
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
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
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
          <div className="overflow-y-auto max-h-[64vh] py-4 sm:py-6 px-1 space-y-5 scrollbar-thin">
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

              <div className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                Audited Score: <span className="text-amber-600 dark:text-amber-400">{totalPoints} JUMBO POINTS</span>
              </div>
            </div>

            {/* Interactive Action List (Fix-It Cards) */}
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-1">
                Unresolved Dates ({pendingBacklog.length})
              </div>

              {pendingBacklog.map((item) => (
                <div
                  key={item.dateKey}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-750/80 hover:border-amber-400/60 dark:hover:border-amber-500/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" />
                        {item.displayDate}
                      </span>
                    </div>

                    {/* Pending Habit Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {item.pendingHabits.map((h) => (
                        <span
                          key={h.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-[11px] font-mono font-semibold border border-amber-200/60 dark:border-amber-800/40"
                        >
                          <DynamicIcon name={h.icon} className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                          <span className="truncate max-w-[120px]">{h.name}</span>
                        </span>
                      ))}
                    </div>

                    <div className="text-[11px] font-mono font-bold text-rose-500 dark:text-rose-400">
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
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 active:scale-95 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs shadow-amber-500/20 cursor-pointer flex-shrink-0"
                    title={`Resolve check-ins for ${item.displayDate}`}
                  >
                    <span>👉 Resolve Date</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* FULL UNLOCKED 30D/60D/90D ANALYTICS VIEW */
          <>
            {/* 2. PINNED SUB-HEADER & CONTROL BAR (Sticky on Scroll) */}
            <div className="pt-2.5 pb-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 relative z-20 space-y-2">
              {/* Sub-Header Control Bar: Date Range (Left) + Inline Filter & Pagination (Right) */}
              <div className="flex items-center justify-between gap-2.5 w-full flex-wrap sm:flex-nowrap">
                {/* Left: Date Range */}
                <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-mono flex-shrink-0">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 flex-shrink-0" />
                  <span>{rangeTitle}</span>
                </div>

                {/* Right: Inline Filter + Pagination Group */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {/* Duration Segment Pill */}
                  <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                    {RANGE_OPTIONS.map((range) => {
                      const isActive = historyRange === range;
                      return (
                        <button
                          key={range}
                          type="button"
                          onClick={() => {
                            setHistoryRange(range);
                            setSelectedDay(null);
                          }}
                          className={`font-mono text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
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

                  {/* Pagination Arrows (< and >) */}
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDay(null);
                        setWeekOffset((prev) => prev - stepWeeks);
                      }}
                      className="p-1 sm:p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs active:scale-95"
                      title="View Earlier Period"
                      aria-label="Previous Period"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>

                    {weekOffset !== 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedDay(null);
                          setWeekOffset(0);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-[10px] font-mono font-bold transition-colors cursor-pointer border border-amber-500/20"
                      >
                        Current
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDay(null);
                        setWeekOffset((prev) => prev + stepWeeks);
                      }}
                      className="p-1 sm:p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-2xs active:scale-95"
                      title="View Later Period"
                      aria-label="Next Period"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* 7 Weekday Column Headers (MON - SUN) */}
              <div className="grid grid-cols-7 gap-x-2.5 sm:gap-x-3.5 text-center px-1">
                {WEEKDAYS.map((dayName) => (
                  <div
                    key={dayName}
                    className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-wider text-center uppercase"
                  >
                    {dayName}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. SCROLLABLE BODY (Calendar Grid + Legend + 3 Insight Modules) */}
            <div className="overflow-y-auto max-h-[60vh] pr-1 pt-3 pb-3 space-y-4 scrollbar-thin">
              {/* Calendar Day Tiles Grid */}
              <div className="grid grid-cols-7 gap-x-2.5 sm:gap-x-3.5 gap-y-3 sm:gap-y-3.5 px-1">
                {days.map((day) => {
                  const isConquered = day.isPerfect;
                  const isMissed = day.isBroken;
                  const isSelected = selectedDay?.dateKey === day.dateKey;

                  let tileStyle =
                    'bg-slate-50/40 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800 text-slate-400';

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
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`w-full max-w-[62px] sm:max-w-[70px] mx-auto aspect-[1.35/1] rounded-2xl border p-1 sm:p-1.5 flex flex-col justify-between items-center transition-all cursor-pointer select-none text-center hover:scale-[1.05] active:scale-95 ${tileStyle} ${
                        isSelected ? 'ring-2 ring-amber-500 scale-105 z-10 shadow-md' : ''
                      }`}
                      title={`${day.displayDate}: ${
                        isConquered
                          ? '💎 Jumbo Conquered (All Habits Conquered)'
                          : isMissed
                          ? `✕ Jumbo Failed (${day.failedHabits.length} Missed)`
                          : 'Unlogged / Rest Day'
                      }`}
                    >
                      {/* Top Day Number + Month Label */}
                      <div className="flex items-center justify-between w-full px-0.5 text-[8.5px] font-mono leading-none">
                        <span className="font-mono text-[10px] sm:text-[11px] font-black">{day.dayNum}</span>
                        <span className="text-[7px] sm:text-[7.5px] font-bold text-slate-400 uppercase opacity-75">
                          {day.monthShort}
                        </span>
                      </div>

                      {/* Center Badge Scale */}
                      <div className="my-auto flex items-center justify-center">
                        {isConquered ? (
                          <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-white flex items-center justify-center shadow-xs shadow-amber-500/40">
                            <Gem className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-white text-white drop-shadow-xs" />
                          </div>
                        ) : isMissed ? (
                          <div className="w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-xs shadow-rose-500/20">
                            <X className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
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
                    className="mt-3 p-3 rounded-2xl bg-amber-500/5 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-750 flex items-center justify-between text-xs font-mono"
                  >
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1 pr-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {selectedDay.displayDate}
                      </span>
                      <span className="text-slate-400">•</span>
                      {selectedDay.isPerfect ? (
                        <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                          <Gem className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          Conquered: All active habits completed flawlessly (+1 Jumbo Point 💎)
                        </span>
                      ) : selectedDay.failedHabits.length > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            Failed Habits:
                          </span>
                          {selectedDay.failedHabits.map((h) => (
                            <span
                              key={h.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-300 text-[11px] font-bold border border-rose-200 dark:border-rose-900/40"
                            >
                              <DynamicIcon name={h.icon} className="w-3 h-3" />
                              <span>{h.name}</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500 dark:text-slate-400 font-bold">
                          Unlogged: No check-in activity recorded
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedDay(null)}
                      className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex-shrink-0 cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Calendar Bottom Legend Summary */}
              <div className="pt-2 pb-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-8 text-xs font-mono text-slate-600 dark:text-slate-400 flex-wrap">
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

              {/* ═════════════════════════════════════════════════════════════════ */}
              {/* POST-CALENDAR VISUAL GAMIFIED INSIGHT MODULES                   */}
              {/* ═════════════════════════════════════════════════════════════════ */}

              {/* MODULE 1: CURRENT VS. BEST FLAWLESS RUN (Micro Rail) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-700/30 space-y-2">
                <div className="flex items-center justify-between font-mono font-bold text-xs">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                    <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 flex-shrink-0" />
                    <span>Current: {streakStats.currentStreak}d</span>
                    {streakStats.isNewRecord && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-amber-500 text-white animate-pulse shadow-xs ml-1">
                        👑 NEW RECORD
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                    <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span>Best: {streakStats.bestStreak}d</span>
                  </div>
                </div>

                <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 relative overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-700"
                    style={{ width: `${streakStats.progressRatio}%` }}
                  />
                </div>
              </div>

              {/* MODULE 2: THE "CLEAN SHEET" DEFICIT BAR (Single Slip-Up Reality) */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="h-3 rounded-full flex overflow-hidden gap-0.5 bg-slate-200 dark:bg-slate-800">
                  <div
                    className="bg-amber-400 h-full transition-all duration-500 rounded-l-full"
                    style={{ width: `${deficitStats.cleanPercent}%` }}
                    title={`Clean: ${deficitStats.cleanCount} days (${deficitStats.cleanPercent}%)`}
                  />
                  <div
                    className="bg-amber-200 dark:bg-amber-700 h-full transition-all duration-500"
                    style={{ width: `${deficitStats.nearMissPercent}%` }}
                    title={`Missed by 1: ${deficitStats.nearMissCount} days (${deficitStats.nearMissPercent}%)`}
                  />
                  <div
                    className="bg-rose-500 h-full transition-all duration-500 rounded-r-full"
                    style={{ width: `${deficitStats.collapsePercent}%` }}
                    title={`Collapsed: ${deficitStats.collapseCount} days (${deficitStats.collapsePercent}%)`}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono font-bold flex-wrap gap-2">
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Gem className="w-3 h-3 fill-amber-400 text-amber-500" />
                    <span>{deficitStats.cleanCount} Clean</span>
                  </span>
                  <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                    <span>{deficitStats.nearMissCount} Missed by 1</span>
                  </span>
                  <span className="text-rose-500 flex items-center gap-1">
                    <X className="w-3 h-3 stroke-[3]" />
                    <span>{deficitStats.collapseCount} Collapsed</span>
                  </span>
                </div>
              </div>

              {/* MODULE 3: HABIT BOSS FIGHT (The "Final Boss" Target) */}
              {bossHabit ? (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-transparent border border-rose-200/60 dark:border-rose-900/40 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="bg-rose-500 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-wider uppercase inline-flex items-center gap-1">
                      <Swords className="w-2.5 h-2.5" />
                      <span>ACTIVE BOSS</span>
                    </span>
                    <div className="flex items-center gap-2 mt-1.5 truncate">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${bossHabit.color || '#f43f5e'}25`, color: bossHabit.color || '#f43f5e' }}
                      >
                        <DynamicIcon name={bossHabit.icon} className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                        {bossHabit.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-right">
                    <div className="font-mono font-black text-rose-600 dark:text-rose-400 text-xs sm:text-sm">
                      💔 Ruined {bossHabit.fails} {bossHabit.fails === 1 ? 'Day' : 'Days'}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-tight mt-0.5">
                      {bossHabit.ruinShare}% of all leaks
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 dark:border-emerald-500/20 flex items-center justify-between gap-4">
                  <div>
                    <span className="bg-emerald-500 text-white font-black text-[9px] px-2 py-0.5 rounded tracking-wider uppercase inline-flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5" />
                      <span>BOSS DEFEATED</span>
                    </span>
                    <div className="text-xs sm:text-sm font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                      100% Realm Defense • Zero active saboteurs
                    </div>
                  </div>

                  <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                    <span>Flawless Victory</span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

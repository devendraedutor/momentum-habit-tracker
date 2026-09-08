import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Gem,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import type { Habit } from '../../types/habit';
import { DynamicIcon } from '../DynamicIcon';
import {
  useJumboAnalytics,
  type DayJumboStatus,
  type JumboHistoryRange,
} from '../../hooks/useJumboAnalytics';

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const RANGE_OPTIONS: JumboHistoryRange[] = ['30d', '60d', '90d'];

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
  const [historyRange, setHistoryRange] = useState<JumboHistoryRange>('30d');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const {
    days,
    conqueredCount,
    failedCount,
    totalPoints,
    rangeTitle,
  } = useJumboAnalytics(habits, jumboDates, historyRange, weekOffset);

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
        className="relative z-10 max-w-3xl w-full mx-auto p-6 sm:p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* TOP HEADER: JUMBO POINTS + DURATION FILTERS + CLOSE BUTTON */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800 relative z-10 flex-wrap gap-4">
          {/* Left: Jumbo Vault Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/50 flex items-center justify-center text-2xl drop-shadow-sm text-amber-500 flex-shrink-0">
              <Gem className="w-6 h-6 fill-amber-400 text-amber-500" />
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                {totalPoints}
              </span>
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 font-mono">
                Jumbo Points
              </span>
            </div>
          </div>

          {/* Right: Duration Segment Pill Filter + Close Tag */}
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
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
                    className={`font-mono text-xs px-3.5 py-1.5 rounded-xl transition-all cursor-pointer font-bold ${
                      isActive
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm shadow-amber-500/20'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {range === '30d' ? '30 D' : range === '60d' ? '60 D' : '90 D'}
                  </button>
                );
              })}
            </div>

            {/* Sticky Close Tag */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-colors cursor-pointer"
              title="Close Vault"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* SCROLLABLE CALENDAR BODY */}
        <div className="flex-1 overflow-y-auto pt-4 space-y-4 pr-1 -mr-1">
          {/* Sub-Header Navigation: Date Range & Pagination */}
          <div className="flex items-center justify-between px-1 text-xs font-mono">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm">
              <Calendar className="w-4 h-4 text-amber-500 flex-shrink-0" />
              <span>{rangeTitle}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setSelectedDay(null);
                  setWeekOffset((prev) => prev - stepWeeks);
                }}
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs active:scale-95"
                title="View Earlier Period"
                aria-label="Previous Period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDay(null);
                    setWeekOffset(0);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-mono font-bold transition-colors cursor-pointer border border-amber-500/20"
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
                className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shadow-xs active:scale-95"
                title="View Later Period"
                aria-label="Next Period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 7-Column Weekday Headers (MON - SUN) */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center px-0.5">
            {WEEKDAYS.map((dayName) => (
              <div
                key={dayName}
                className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-widest text-center uppercase pb-1"
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* 7-Column Day Tiles Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 px-0.5">
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
                  'bg-rose-500/10 border border-rose-200/60 dark:bg-rose-950/20 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 hover:border-rose-400';
              }

              if (day.isToday) {
                tileStyle += ' ring-2 ring-amber-500 dark:ring-amber-400 border-amber-500 shadow-xs';
              }

              return (
                <button
                  key={day.dateKey}
                  type="button"
                  onClick={() => setSelectedDay(isSelected ? null : day)}
                  className={`rounded-2xl border p-1.5 sm:p-2 flex flex-col justify-between aspect-square transition-all cursor-pointer select-none text-center hover:scale-[1.04] active:scale-95 ${tileStyle} ${
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
                  <div className="flex items-center justify-between w-full px-0.5 text-[9px] font-mono leading-none">
                    <span className="font-mono text-xs font-black">{day.dayNum}</span>
                    <span className="text-[8px] sm:text-[9px] font-bold tracking-wider uppercase opacity-70">
                      {day.monthShort}
                    </span>
                  </div>

                  {/* Center Badge */}
                  <div className="my-auto flex items-center justify-center">
                    {isConquered ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 text-white flex items-center justify-center shadow-sm shadow-amber-500/40">
                        <Gem className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-white text-white drop-shadow-xs" />
                      </div>
                    ) : isMissed ? (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-rose-500 text-white flex items-center justify-center text-xs font-black shadow-sm shadow-rose-500/20">
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
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
                className="mt-2.5 p-3 rounded-2xl bg-amber-500/5 dark:bg-slate-800/80 border border-amber-200/60 dark:border-slate-750 flex items-center justify-between text-xs font-mono"
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

          {/* Bottom Legend Summary (Centered) */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-8 text-xs font-mono text-slate-600 dark:text-slate-400 flex-wrap">
            <div className="flex items-center gap-2 font-bold">
              <span className="w-4 h-4 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 flex items-center justify-center text-white font-black text-[9px] shadow-xs shadow-amber-500/30">
                <Gem className="w-2.5 h-2.5 fill-white text-white" />
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                💎 Conquered ({conqueredCount})
              </span>
            </div>

            <div className="flex items-center gap-2 font-bold">
              <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-[9px] shadow-xs">
                <X className="w-2.5 h-2.5 stroke-[3]" />
              </span>
              <span className="text-slate-700 dark:text-slate-300">
                ✕ Failed ({failedCount})
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

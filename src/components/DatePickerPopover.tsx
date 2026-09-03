import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { getTodayString, parseDateString, formatDate } from '../lib/momentum';

interface DatePickerPopoverProps {
  activeDateStr: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectDate: (dateStr: string) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePickerPopover: React.FC<DatePickerPopoverProps> = ({
  activeDateStr,
  isOpen,
  onClose,
  onSelectDate,
}) => {
  const todayStr = getTodayString();
  const activeDate = useMemo(() => parseDateString(activeDateStr || todayStr), [activeDateStr, todayStr]);

  const [viewYear, setViewYear] = useState<number>(activeDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(activeDate.getMonth()); // 0-indexed

  // Synchronize view state with activeDate whenever popover opens
  useEffect(() => {
    if (isOpen) {
      const d = parseDateString(activeDateStr || todayStr);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [isOpen, activeDateStr, todayStr]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Compute days in view month
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0 (Sun) - 6 (Sat)
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const handleSelectDay = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    const dateStr = formatDate(selected);
    onSelectDate(dateStr);
    onClose();
  };

  const handleJumpToToday = () => {
    onSelectDate(todayStr);
    onClose();
  };

  const handleJumpToYesterday = () => {
    const today = parseDateString(todayStr);
    today.setDate(today.getDate() - 1);
    onSelectDate(formatDate(today));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full blur-2xl pointer-events-none opacity-20 bg-cyan-500" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3 relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                Jump to Date
              </h3>
              <p className="text-[10px] text-slate-400">Select any day to view or log habits</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-3 px-1 relative z-10">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="text-xs font-black font-mono text-slate-900 dark:text-white tracking-wide">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </div>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 mb-1 text-center relative z-10">
          {WEEK_DAYS.map((wd) => (
            <div key={wd} className="text-[10px] font-bold font-mono text-slate-400 dark:text-slate-500 py-1">
              {wd}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-1 mb-4 relative z-10">
          {/* Empty prefix slots */}
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="h-8" />
          ))}

          {/* Month Day Buttons */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const thisDateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isSelected = thisDateStr === activeDateStr;
            const isTodayDate = thisDateStr === todayStr;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => handleSelectDay(dayNum)}
                className={`h-8 rounded-xl font-mono text-xs flex items-center justify-center transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-black shadow-md shadow-cyan-500/25 scale-105 z-10'
                    : isTodayDate
                    ? 'border border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold hover:bg-emerald-500/20'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <span>{dayNum}</span>
                {isTodayDate && !isSelected && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Quick Jump Shortcuts */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 relative z-10">
          <button
            type="button"
            onClick={handleJumpToToday}
            className="flex-1 py-1.5 px-3 rounded-xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-800 dark:text-cyan-300 hover:text-slate-950 border border-cyan-500/30 text-xs font-bold font-mono transition-all cursor-pointer flex items-center justify-center gap-1"
          >
            <Sparkles className="w-3 h-3" />
            <span>Today</span>
          </button>

          <button
            type="button"
            onClick={handleJumpToYesterday}
            className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono transition-all cursor-pointer"
          >
            Yesterday
          </button>
        </div>
      </div>
    </div>
  );
};

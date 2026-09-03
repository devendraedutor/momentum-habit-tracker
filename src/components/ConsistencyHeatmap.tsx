import React, { useMemo } from 'react';
import type { Habit } from '../types/habit';
import { formatDate, formatDisplayDate } from '../lib/momentum';
import { Activity } from 'lucide-react';

interface ConsistencyHeatmapProps {
  habits: Habit[];
  theme?: 'dark' | 'light';
}

export const ConsistencyHeatmap: React.FC<ConsistencyHeatmapProps> = ({ habits, theme = 'dark' }) => {
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const isDark = theme === 'dark';

  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const days: { dateStr: string; date: Date; score: number; doneCount: number; missedCount: number }[] = [];

    const dayOfWeek = today.getDay();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - dayOfWeek));

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 111);

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = formatDate(current);
      let doneCount = 0;
      let missedCount = 0;

      activeHabits.forEach((h) => {
        const s = h.history[dateStr];
        if (s === 'done') doneCount++;
        if (s === 'missed') missedCount++;
      });

      const netScore = doneCount - missedCount;

      days.push({
        dateStr,
        date: new Date(current),
        score: netScore,
        doneCount,
        missedCount,
      });

      current.setDate(current.getDate() + 1);
    }

    const weeksArr: typeof days[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeksArr.push(days.slice(i, i + 7));
    }

    const labels: { name: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    weeksArr.forEach((w, idx) => {
      const firstDay = w[0].date;
      if (firstDay.getMonth() !== lastMonth) {
        lastMonth = firstDay.getMonth();
        labels.push({
          name: firstDay.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex: idx,
        });
      }
    });

    return { weeks: weeksArr, monthLabels: labels };
  }, [activeHabits]);

  const getColorClass = (doneCount: number, missedCount: number) => {
    if (doneCount === 0 && missedCount === 0) {
      return isDark ? 'bg-slate-900 border-slate-800/80' : 'bg-slate-100 border-slate-200';
    }
    if (doneCount > 0 && missedCount === 0) {
      if (doneCount >= 3) return 'bg-emerald-500 border-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
      if (doneCount === 2) return 'bg-emerald-600/80 border-emerald-500/50';
      return isDark ? 'bg-emerald-700/50 border-emerald-600/30' : 'bg-emerald-400/50 border-emerald-400';
    }
    if (missedCount > 0 && doneCount === 0) {
      return 'bg-rose-500/80 border-rose-500/50';
    }
    return 'bg-cyan-500/60 border-cyan-500/50';
  };

  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="glass-card rounded-2xl p-5 md:p-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daily Consistency Intensity Matrix</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">16-Week GitHub-style momentum heatmap</p>
          </div>
        </div>

        {/* Legend */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <span>Less</span>
          <span className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800" />
          <span className="w-3 h-3 rounded-sm bg-emerald-400/50 dark:bg-emerald-700/50 border border-emerald-400 dark:border-emerald-600/30" />
          <span className="w-3 h-3 rounded-sm bg-emerald-600/80 border border-emerald-500/50" />
          <span className="w-3 h-3 rounded-sm bg-emerald-500 border border-emerald-400" />
          <span className="w-3 h-3 rounded-sm bg-rose-500/80 border border-rose-500/50" />
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="min-w-[620px]">
          <div className="flex text-[10px] text-slate-400 dark:text-slate-500 font-mono mb-1 pl-6">
            {weeks.map((_, i) => {
              const label = monthLabels.find((m) => m.weekIndex === i);
              return (
                <div key={i} className="w-7 text-left flex-shrink-0">
                  {label ? label.name : ''}
                </div>
              );
            })}
          </div>

          <div className="flex gap-1">
            <div className="flex flex-col gap-1 pr-1.5 text-[9px] text-slate-400 dark:text-slate-500 font-mono select-none">
              {dayNames.map((d, i) => (
                <span key={i} className="h-4 flex items-center justify-center">
                  {i % 2 === 1 ? d : ''}
                </span>
              ))}
            </div>

            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="flex flex-col gap-1">
                {week.map((day) => {
                  const title = `${formatDisplayDate(day.dateStr, true)}: ${day.doneCount} Done (+), ${
                    day.missedCount
                  } Missed (-)`;

                  return (
                    <div
                      key={day.dateStr}
                      title={title}
                      className={`w-4 h-4 rounded-[4px] border transition-transform hover:scale-125 cursor-pointer ${getColorClass(
                        day.doneCount,
                        day.missedCount
                      )}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

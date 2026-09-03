import React, { useRef, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions, TooltipItem, ScriptableContext } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { Habit, ChartTimeRange } from '../types/habit';
import { calculateHabitTrajectory, calculateAggregateTrajectory, calculateHabitStats } from '../lib/momentum';
import { TrendingUp, BarChart2, LineChart, Layers, ArrowUpRight, ArrowDownRight, Check, X, Flame, Target } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface MomentumChartProps {
  habits: Habit[];
  selectedHabitId?: string | 'all';
  timeRange: ChartTimeRange;
  onTimeRangeChange: (range: ChartTimeRange) => void;
  floorAtZero?: boolean;
  theme?: 'dark' | 'light';
  onSelectDate?: (dateStr: string) => void;
}

export const MomentumChart: React.FC<MomentumChartProps> = ({
  habits,
  selectedHabitId = 'all',
  timeRange,
  onTimeRangeChange,
  floorAtZero = false,
  theme = 'dark',
  onSelectDate,
}) => {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const isDark = theme === 'dark';

  const [chartMode, setChartMode] = useState<'line' | 'bars'>('line');

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const currentHabit = selectedHabitId !== 'all' 
    ? activeHabits.find((h) => h.id === selectedHabitId)
    : null;

  // Trajectory points array with score and daily delta
  const rawPoints = useMemo(() => {
    if (activeHabits.length === 0) return [];
    if (selectedHabitId === 'all') {
      return calculateAggregateTrajectory(activeHabits, timeRange, floorAtZero);
    } else if (currentHabit) {
      return calculateHabitTrajectory(currentHabit, timeRange, floorAtZero);
    }
    return [];
  }, [activeHabits, selectedHabitId, currentHabit, timeRange, floorAtZero]);

  // Summary statistics for the active selection
  const selectionSummary = useMemo(() => {
    if (currentHabit) {
      const stats = calculateHabitStats(currentHabit, floorAtZero);
      return {
        totalXP: stats.currentScore,
        totalDone: stats.totalDone,
        totalMissed: stats.totalMissed,
        totalCheckedIn: stats.totalDone + stats.totalMissed,
        streak: stats.currentStreak,
        targetDays: stats.targetGoalDays || 21,
        targetDaysRemaining: stats.goalDaysRemaining,
      };
    } else {
      let totalXP = 0;
      let totalDone = 0;
      let totalMissed = 0;
      let maxStreak = 0;

      activeHabits.forEach((h) => {
        const stats = calculateHabitStats(h, floorAtZero);
        totalXP += stats.currentScore;
        totalDone += stats.totalDone;
        totalMissed += stats.totalMissed;
        if (stats.currentStreak > maxStreak) maxStreak = stats.currentStreak;
      });

      return {
        totalXP,
        totalDone,
        totalMissed,
        totalCheckedIn: totalDone + totalMissed,
        streak: maxStreak,
        targetDays: 21,
        targetDaysRemaining: 0,
      };
    }
  }, [currentHabit, activeHabits, floorAtZero]);

  // Line Chart Dataset
  const lineChartData = useMemo(() => {
    if (rawPoints.length === 0) return { labels: [], datasets: [] };

    const labels = rawPoints.map((p) => p.displayDate);
    const scores = rawPoints.map((p) => p.score);

    return {
      labels,
      datasets: [
        {
          label: selectedHabitId === 'all' ? 'Total XP' : `${currentHabit?.name || 'Habit'} XP`,
          data: scores,
          borderColor: isDark ? '#38bdf8' : '#0284c7',
          borderWidth: 2.5,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 240);
            if (isDark) {
              gradient.addColorStop(0, 'rgba(56, 189, 248, 0.22)');
              gradient.addColorStop(0.8, 'rgba(56, 189, 248, 0.02)');
              gradient.addColorStop(1, 'transparent');
            } else {
              gradient.addColorStop(0, 'rgba(2, 132, 199, 0.15)');
              gradient.addColorStop(0.8, 'rgba(2, 132, 199, 0.02)');
              gradient.addColorStop(1, 'transparent');
            }
            return gradient;
          },
          fill: true,
          tension: 0.35,
          pointRadius: (ctx: ScriptableContext<'line'>) => {
            const idx = ctx.dataIndex;
            const pt = rawPoints[idx];
            if (!pt) return 0;
            return pt.delta !== 0 ? 5.5 : 3;
          },
          pointHoverRadius: 7.5,
          pointBackgroundColor: (ctx: ScriptableContext<'line'>) => {
            const idx = ctx.dataIndex;
            const pt = rawPoints[idx];
            if (!pt) return '#94a3b8';
            if (pt.delta > 0) return '#10b981'; // Green for +1
            if (pt.delta < 0) return '#f43f5e'; // Red for -1
            return isDark ? '#475569' : '#cbd5e1';
          },
          pointBorderColor: isDark ? '#0f172a' : '#ffffff',
          pointBorderWidth: 2,
          pointHoverBackgroundColor: (ctx: ScriptableContext<'line'>) => {
            const idx = ctx.dataIndex;
            const pt = rawPoints[idx];
            if (pt?.delta && pt.delta > 0) return '#10b981';
            if (pt?.delta && pt.delta < 0) return '#f43f5e';
            return '#38bdf8';
          },
          pointHoverBorderColor: '#ffffff',
          pointHoverBorderWidth: 2.5,
        },
      ],
    };
  }, [rawPoints, selectedHabitId, currentHabit, isDark]);

  // Bar Chart Dataset
  const barChartData = useMemo(() => {
    if (rawPoints.length === 0) return { labels: [], datasets: [] };

    const labels = rawPoints.map((p) => p.displayDate);
    const deltas = rawPoints.map((p) => p.delta);

    return {
      labels,
      datasets: [
        {
          label: 'Daily XP Change',
          data: deltas,
          backgroundColor: deltas.map((d) =>
            d > 0 ? (isDark ? 'rgba(16, 185, 129, 0.85)' : '#10b981') : d < 0 ? (isDark ? 'rgba(244, 63, 94, 0.85)' : '#f43f5e') : 'rgba(148, 163, 184, 0.2)'
          ),
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  }, [rawPoints, isDark]);

  const options: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    animation: {
      duration: 350,
      easing: 'easeOutQuart',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: isDark ? '#0f172a' : '#ffffff',
        titleColor: isDark ? '#f8fafc' : '#0f172a',
        bodyColor: isDark ? '#cbd5e1' : '#334155',
        borderColor: isDark ? '#334155' : '#e2e8f0',
        borderWidth: 1.5,
        padding: 12,
        cornerRadius: 10,
        boxPadding: 6,
        titleFont: {
          family: 'Inter, sans-serif',
          size: 13,
          weight: 700,
        },
        bodyFont: {
          family: 'JetBrains Mono, monospace',
          size: 12,
        },
        callbacks: {
          label: (context: TooltipItem<'line' | 'bar'>) => {
            const idx = context.dataIndex;
            const pt = rawPoints[idx];
            if (!pt) return '';
            const scoreSign = pt.score > 0 ? '+' : '';
            return `  Total XP: ${scoreSign}${pt.score} XP`;
          },
          afterBody: (tooltipItems) => {
            if (tooltipItems.length > 0) {
              const idx = tooltipItems[0].dataIndex;
              const pt = rawPoints[idx];
              if (!pt) return '';
              if (pt.delta > 0) {
                return `\n🟢 Change: +${pt.delta} XP (Done)`;
              } else if (pt.delta < 0) {
                return `\n🔴 Change: ${pt.delta} XP (Missed / Skipped)`;
              } else {
                return `\n⚪ Change: 0 XP (Unlogged / Flat)`;
              }
            }
            return '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)',
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: {
            family: 'Inter, sans-serif',
            size: 10,
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: timeRange === '7d' ? 7 : timeRange === '30d' ? 8 : 10,
        },
      },
      y: {
        grid: {
          color: (context) => {
            if (context.tick.value === 0) {
              return isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
            }
            return isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.04)';
          },
          lineWidth: (context) => (context.tick.value === 0 ? 1.5 : 1),
        },
        ticks: {
          color: isDark ? '#94a3b8' : '#64748b',
          font: {
            family: 'JetBrains Mono, monospace',
            size: 10,
          },
          precision: 0,
        },
      },
    },
  };

  const rangeButtons: { id: ChartTimeRange; label: string }[] = [
    { id: '7d', label: '7D' },
    { id: '30d', label: '30D' },
    { id: '90d', label: '90D' },
    { id: 'all', label: 'All' },
  ];

  const recentDaysBreakdown = useMemo(() => {
    return rawPoints.slice(-7);
  }, [rawPoints]);

  return (
    <div className="app-card rounded-2xl p-4 sm:p-5 transition-all">
      {/* Header with Title, Mode Switcher, and Time Range Pills */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {selectedHabitId === 'all' ? 'All Habits Trajectory' : `${currentHabit?.name || 'Habit'}`}
            </h3>
          </div>

          {/* Quick Metrics Bar: Total Checked in, +1s, -1s, Streak, Target remaining */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
            <span className="font-bold text-slate-900 dark:text-white">
              XP: {selectionSummary.totalXP > 0 ? `+${selectionSummary.totalXP}` : selectionSummary.totalXP}
            </span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
              <Check className="w-3 h-3 stroke-[3]" /> {selectionSummary.totalDone} {currentHabit?.type === 'BREAK' ? 'Controlled (+1)' : 'Done (+1)'}
            </span>
            <span>•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-0.5">
              <X className="w-3 h-3 stroke-[3]" /> {selectionSummary.totalMissed} {currentHabit?.type === 'BREAK' ? 'Failed (-1)' : 'Missed (-1)'}
            </span>
            <span>•</span>
            <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
              <Flame className="w-3 h-3 fill-amber-500" /> {selectionSummary.streak}d {currentHabit?.type === 'BREAK' ? 'Clean Streak' : 'Streak'}
            </span>
            {currentHabit && (
              <>
                <span>•</span>
                <span className="text-cyan-600 dark:text-cyan-400 font-semibold flex items-center gap-0.5">
                  <Target className="w-3 h-3" /> {selectionSummary.targetDaysRemaining} {currentHabit?.type === 'BREAK' ? 'Clean Days left' : 'Target Days left'} (Aim: {selectionSummary.targetDays})
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Line vs Bar Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setChartMode('line')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                chartMode === 'line'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
              title="Running XP Curve"
            >
              <LineChart className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartMode('bars')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all ${
                chartMode === 'bars'
                  ? 'bg-white dark:bg-slate-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-white'
              }`}
              title="Daily Gain/Drop Bars (+/-)"
            >
              <BarChart2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Time Range Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-800">
            {rangeButtons.map((btn) => (
              <button
                key={btn.id}
                onClick={() => onTimeRangeChange(btn.id)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all cursor-pointer ${
                  timeRange === btn.id
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive Graph Canvas */}
      <div className="h-[210px] sm:h-[240px] w-full">
        {rawPoints.length > 0 ? (
          chartMode === 'line' ? (
            <Line ref={chartRef} data={lineChartData} options={options as ChartOptions<'line'>} />
          ) : (
            <Bar data={barChartData} options={options as ChartOptions<'bar'>} />
          )
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400">
            <Layers className="w-8 h-8 mb-1 opacity-50" />
            <p className="text-xs">No check-in history to display</p>
          </div>
        )}
      </div>

      {/* Clear Visual Color-Coded Legend */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+1 XP (Done)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
            <span className="text-rose-600 dark:text-rose-400 font-semibold">-1 XP (Missed)</span>
          </div>
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          {chartMode === 'line' ? 'Points indicate daily gains/drops' : 'Green bars = Gains, Red = Drops'}
        </span>
      </div>

      {/* Visual Daily Breakdown Timeline */}
      {recentDaysBreakdown.length > 0 && (
        <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>Daily Log Breakdown</span>
            <span>Click day to view</span>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
            {recentDaysBreakdown.map((pt) => {
              const isGain = pt.delta > 0;
              const isDrop = pt.delta < 0;

              return (
                <button
                  key={pt.date}
                  onClick={() => onSelectDate?.(pt.date)}
                  className={`p-2 rounded-xl border text-center transition-all flex flex-col items-center justify-center cursor-pointer ${
                    isGain
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                      : isDrop
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 hover:bg-rose-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                  }`}
                  title={`${pt.displayDate}: Total ${pt.score > 0 ? '+' : ''}${pt.score} XP (Delta: ${pt.delta > 0 ? '+' : ''}${pt.delta})`}
                >
                  <span className="text-[10px] font-mono opacity-80">{pt.displayDate}</span>
                  <div className="mt-0.5 flex items-center gap-0.5 font-mono font-bold text-xs">
                    {isGain ? (
                      <span className="flex items-center text-emerald-600 dark:text-emerald-400">
                        <ArrowUpRight className="w-3 h-3 stroke-[3]" /> +{pt.delta}
                      </span>
                    ) : isDrop ? (
                      <span className="flex items-center text-rose-600 dark:text-rose-400">
                        <ArrowDownRight className="w-3 h-3 stroke-[3]" /> {pt.delta}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-0.5">
                    {pt.score > 0 ? `+${pt.score}` : pt.score} XP
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

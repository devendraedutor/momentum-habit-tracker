import React, { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import type { ChartOptions, TooltipItem, ScriptableContext } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { Habit, ChartTimeRange, CheckInStatus } from '../types/habit';
import {
  calculateHabitStats,
  calculateHabitTrajectory,
  formatDisplayDate,
  getDateRange,
  parseDateString,
  formatDate,
  getEffectiveEndDate,
} from '../lib/momentum';
import { DynamicIcon } from './DynamicIcon';
import {
  X,
  Edit2,
  Flame,
  Zap,
  Crown,
  Target,
  ShieldAlert,
  Sprout,
  Calendar,
  TrendingUp,
  Award,
  Check,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface HabitDetailModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (habit: Habit) => void;
  onCheckInDate?: (habitId: string, dateStr: string, status: CheckInStatus) => void;
  onArchive?: (habitId: string) => void;
  onDelete?: (habitId: string) => void;
  activeDateStr?: string;
  floorAtZero?: boolean;
  theme?: 'dark' | 'light';
}

const WEEKDAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  isOpen,
  onClose,
  onEdit,
  onCheckInDate,
  activeDateStr,
  floorAtZero = false,
  theme = 'dark',
}) => {
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('30d');
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const stats = useMemo(() => {
    if (!habit) return null;
    return calculateHabitStats(habit, floorAtZero);
  }, [habit, floorAtZero]);

  const trajectory = useMemo(() => {
    if (!habit) return [];
    return calculateHabitTrajectory(habit, timeRange, floorAtZero);
  }, [habit, timeRange, floorAtZero]);

  // Today ISO string
  const todayIso = useMemo(() => {
    const today = new Date();
    return formatDate(today);
  }, []);

  // Effective anchor date (accommodates future dates if user checked in ahead)
  const effectiveAnchorDateStr = useMemo(() => {
    if (!habit) return todayIso;
    const latestLoggedDate = getEffectiveEndDate(habit);
    if (activeDateStr && activeDateStr > latestLoggedDate) return activeDateStr;
    return latestLoggedDate;
  }, [habit, todayIso, activeDateStr]);

  // Calendar days aligned to weekly matrix covering the full check-in window
  const { matrixDays, totalDone30d, totalMissed30d, winRate30d, rangeTitle } = useMemo(() => {
    if (!habit) {
      return { matrixDays: [], totalDone30d: 0, totalMissed30d: 0, winRate30d: 0, rangeTitle: '' };
    }

    const anchorDate = parseDateString(effectiveAnchorDateStr);
    anchorDate.setDate(anchorDate.getDate() + weekOffset * 7);

    const start = new Date(anchorDate);
    start.setDate(anchorDate.getDate() - 27); // 4 full weeks

    // Align start to the nearest Monday
    const startDayOfWeek = start.getDay();
    const diffToMonday = (startDayOfWeek + 6) % 7;
    start.setDate(start.getDate() - diffToMonday);

    // Align end date to the nearest Sunday
    const endDayOfWeek = anchorDate.getDay();
    const diffToSunday = (7 - endDayOfWeek) % 7;
    const alignedEnd = new Date(anchorDate);
    alignedEnd.setDate(alignedEnd.getDate() + diffToSunday);

    const dates = getDateRange(formatDate(start), formatDate(alignedEnd));
    let doneCount = 0;
    let missedCount = 0;

    const daysList = dates.map((dStr) => {
      const dateObj = parseDateString(dStr);
      const dayNum = dateObj.getDate();
      const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' });
      const weekdayShort = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const status: CheckInStatus = habit.history?.[dStr] || 'none';
      const isToday = dStr === todayIso;
      const isActiveDate = !!activeDateStr && dStr === activeDateStr;

      if (status === 'done') doneCount++;
      if (status === 'missed') missedCount++;

      return {
        dateStr: dStr,
        dayNum,
        monthShort,
        weekdayShort,
        status,
        isToday,
        isActiveDate,
        formatted: formatDisplayDate(dStr, true),
      };
    });

    const totalLogged = doneCount + missedCount;
    const winRate = totalLogged > 0 ? Math.round((doneCount / totalLogged) * 100) : 0;
    const startFormatted = formatDisplayDate(formatDate(start));
    const endFormatted = formatDisplayDate(formatDate(alignedEnd), true);

    return {
      matrixDays: daysList,
      totalDone30d: doneCount,
      totalMissed30d: missedCount,
      winRate30d: winRate,
      rangeTitle: `${startFormatted} – ${endFormatted}`,
    };
  }, [habit, effectiveAnchorDateStr, weekOffset, todayIso, activeDateStr]);

  // Selected Day Details
  const selectedDayInfo = useMemo(() => {
    if (!selectedDayStr || !habit) return null;
    const dateObj = parseDateString(selectedDayStr);
    const status: CheckInStatus = habit.history?.[selectedDayStr] || 'none';
    return {
      dateStr: selectedDayStr,
      formatted: formatDisplayDate(selectedDayStr, true),
      weekday: dateObj.toLocaleDateString('en-US', { weekday: 'long' }),
      status,
      isToday: selectedDayStr === todayIso,
    };
  }, [selectedDayStr, habit, todayIso]);

  // Chart configuration
  const isDark = theme === 'dark';
  const habitColor = habit?.color || '#10b981';

  const chartData = useMemo(() => {
    const labels = trajectory.map((p) => p.displayDate);
    const dataPoints = trajectory.map((p) => p.score);

    return {
      labels,
      datasets: [
        {
          label: habit?.name || 'Momentum XP',
          data: dataPoints,
          borderColor: habitColor,
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: trajectory.length > 40 ? 0 : 3.5,
          pointHoverRadius: 6,
          pointBackgroundColor: habitColor,
          pointBorderColor: isDark ? '#0f172a' : '#ffffff',
          pointBorderWidth: 2,
          fill: true,
          backgroundColor: (context: ScriptableContext<'line'>) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 220);
            gradient.addColorStop(0, `${habitColor}35`);
            gradient.addColorStop(1, `${habitColor}00`);
            return gradient;
          },
        },
      ],
    };
  }, [trajectory, habit, habitColor, isDark]);

  const chartOptions: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : 'rgba(255, 255, 255, 0.96)',
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#94a3b8' : '#475569',
          borderColor: isDark ? 'rgba(51, 65, 85, 0.6)' : 'rgba(226, 232, 240, 0.9)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 12,
          displayColors: false,
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => {
              const item = items[0];
              const point = trajectory[item.dataIndex];
              return point ? formatDisplayDate(point.date, true) : item.label;
            },
            label: (item: TooltipItem<'line'>) => {
              const point = trajectory[item.dataIndex];
              const statusLabel =
                point?.status === 'done'
                  ? '✓ Done (+1 XP)'
                  : point?.status === 'missed'
                  ? '✕ Missed (-1 XP)'
                  : '— Untracked';
              return [`Net Score: ${item.formattedValue} XP`, `Daily Status: ${statusLabel}`];
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: isDark ? '#64748b' : '#94a3b8',
            font: {
              size: 10,
              family: 'monospace',
            },
            maxTicksLimit: 7,
          },
        },
        y: {
          grid: {
            color: isDark ? 'rgba(51, 65, 85, 0.25)' : 'rgba(226, 232, 240, 0.6)',
          },
          ticks: {
            color: isDark ? '#64748b' : '#94a3b8',
            font: {
              size: 10,
              family: 'monospace',
            },
            stepSize: 1,
          },
        },
      },
    };
  }, [isDark, trajectory]);

  if (!isOpen || !habit || !stats) return null;

  const isBreak = habit.type === 'BREAK';
  const targetDays = habit.targetGoalDays || 21;
  const startDateFormatted = formatDisplayDate(habit.startDate || habit.createdAt, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: habitColor }}
        />

        {/* 1. Header Identity Strip */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md transition-transform"
              style={{
                backgroundColor: `${habitColor}22`,
                color: habitColor,
                border: `1.5px solid ${habitColor}45`,
              }}
            >
              <DynamicIcon name={habit.icon} className="w-6 h-6" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight truncate">
                  {habit.name}
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-mono flex items-center gap-1 border ${
                    isBreak
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {isBreak ? <ShieldAlert className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
                  <span>{isBreak ? 'Break Habit' : 'Build Habit'}</span>
                </span>
                {habit.currentTier && habit.currentTier > 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold font-mono flex items-center gap-1 shadow-xs">
                    <Crown className="w-3 h-3 fill-amber-500" />
                    <span>Tier {habit.currentTier}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans flex-wrap">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{habit.category}</span>
                <span>•</span>
                <span className="font-mono text-[11px] flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-500" /> Started {startDateFormatted}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onEdit(habit)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Edit Habit"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 relative z-10">
          {/* 2. 4-Pillar Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. Current Streak */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Streak
                </span>
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-amber-500 font-mono tracking-tight flex items-baseline gap-1">
                  <span>{stats.currentStreak}</span>
                  <span className="text-xs font-bold font-mono text-slate-400">days</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Best: {stats.bestStreak}d
                </div>
              </div>
            </div>

            {/* 2. Lifetime XP */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Lifetime XP
                </span>
                <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500">
                  <Zap className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-emerald-500 font-mono tracking-tight flex items-baseline gap-1">
                  <span>{stats.currentScore}</span>
                  <span className="text-xs font-bold font-mono text-slate-400">XP</span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Total Momentum
                </div>
              </div>
            </div>

            {/* 3. Mastery Level */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Mastery
                </span>
                <div className="p-1 rounded-lg bg-amber-500/10 text-amber-400">
                  <Crown className="w-3.5 h-3.5 fill-amber-400" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                  Tier {habit.currentTier || 1}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {habit.milestonesCompleted || (habit.currentTier ? habit.currentTier - 1 : 0)} Cleared
                </div>
              </div>
            </div>

            {/* 4. Target Goal */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                  Target Goal
                </span>
                <div className="p-1 rounded-lg bg-cyan-500/10 text-cyan-500">
                  <Target className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-xl sm:text-2xl font-black text-cyan-500 font-mono tracking-tight flex items-baseline gap-1">
                  <span>{stats.currentGoalStreak}</span>
                  <span className="text-xs font-normal text-slate-400">/{targetDays}d</span>
                </div>
                {/* Micro Progress Bar */}
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stats.goalProgressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Growth & Momentum Curve Chart */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                    Growth & Momentum Curve
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Trajectory over time (+1 XP on Done • -1 XP on Missed)
                  </p>
                </div>
              </div>

              {/* Range Filter Pills */}
              <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800 border border-slate-300/60 dark:border-slate-700 font-mono text-[11px]">
                {(['7d', '30d', 'all'] as ChartTimeRange[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setTimeRange(r)}
                    className={`px-3 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                      timeRange === r
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r === 'all' ? 'All' : r.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Chart Canvas */}
            <div className="h-52 w-full">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>

          {/* 4. High-Utility Tactile Calendar Matrix & Streak Matrix */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750">
            {/* Header with High-Impact Metric Chips */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                    Performance Matrix
                  </h3>
                  <p className="text-[10px] text-slate-400 font-mono">
                    Daily consistency record • Tap any day to inspect
                  </p>
                </div>
              </div>

              {/* Insight Badges */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                <span className="px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[3]" /> {totalDone30d} Done
                </span>
                {totalMissed30d > 0 && (
                  <span className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30 flex items-center gap-1">
                    <X className="w-3 h-3 stroke-[3]" /> {totalMissed30d} Missed
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-xl bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 font-bold border border-cyan-500/30">
                  {winRate30d}% Win Rate
                </span>
              </div>
            </div>

            {/* Timeline Range & Navigation Row */}
            <div className="flex items-center justify-between px-1 mb-3 text-xs font-mono">
              <span className="text-slate-600 dark:text-slate-300 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                <span>{rangeTitle}</span>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="View Earlier Weeks"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {weekOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Current
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                  title="View Later Weeks"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekday Column Headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-1.5 text-center">
              {WEEKDAY_NAMES.map((name) => (
                <div key={name} className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider py-1">
                  {name}
                </div>
              ))}
            </div>

            {/* Weekly Calendar Tiles Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {matrixDays.map((d) => {
                const isDone = d.status === 'done';
                const isMissed = d.status === 'missed';
                const isSelected = selectedDayStr === d.dateStr;

                let cardStyle =
                  'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800 text-slate-400 hover:border-slate-400';

                if (isDone) {
                  cardStyle =
                    'bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 shadow-xs hover:border-emerald-400';
                } else if (isMissed) {
                  cardStyle =
                    'bg-rose-500/15 dark:bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-300 hover:border-rose-400';
                }

                if (d.isToday) {
                  cardStyle += ' ring-2 ring-cyan-500/60 border-cyan-500 font-black';
                }

                if (isSelected) {
                  cardStyle += ' ring-2 ring-amber-400 shadow-md scale-105 z-10';
                }

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDayStr(isSelected ? null : d.dateStr)}
                    className={`p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-between min-h-[52px] sm:min-h-[58px] transition-all cursor-pointer select-none text-center ${cardStyle}`}
                    title={`${d.formatted}: ${isDone ? (isBreak ? 'Controlled ✓' : 'Done ✓') : isMissed ? (isBreak ? 'Failed ✕' : 'Missed ✕') : 'Untracked'}`}
                  >
                    {/* Top Day / Month Tag */}
                    <div className="flex items-center justify-between w-full px-0.5 text-[9px] font-mono leading-none">
                      <span className="font-bold opacity-80">{d.dayNum}</span>
                      <span className="text-[8px] opacity-60 uppercase font-semibold">{d.monthShort}</span>
                    </div>

                    {/* Center Icon Badge */}
                    <div className="my-1 flex items-center justify-center">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isMissed ? (
                        <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-300 dark:text-slate-600 font-bold">•</span>
                      )}
                    </div>

                    {/* Bottom Status / Today Pill */}
                    <div className="text-[8px] font-mono font-bold leading-none">
                      {d.isToday ? (
                        <span className="text-cyan-500">TODAY</span>
                      ) : isDone ? (
                        <span className="text-emerald-600 dark:text-emerald-400">+1 XP</span>
                      ) : isMissed ? (
                        <span className="text-rose-600 dark:text-rose-400">-1 XP</span>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-600">—</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Day Interactive Quick Action Drawer */}
            {selectedDayInfo && (
              <div className="mt-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-400/40 shadow-lg flex items-center justify-between gap-3 animate-scale-in flex-wrap">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-500" />
                    <span>{selectedDayInfo.weekday}, {selectedDayInfo.formatted}</span>
                    {selectedDayInfo.isToday && (
                      <span className="px-1.5 py-0.5 rounded-full bg-cyan-500 text-slate-950 text-[9px] font-black font-mono">
                        TODAY
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Status: <strong className={selectedDayInfo.status === 'done' ? 'text-emerald-500' : selectedDayInfo.status === 'missed' ? 'text-rose-500' : 'text-slate-400'}>
                      {selectedDayInfo.status === 'done' ? (isBreak ? 'Controlled (+1 XP)' : 'Done (+1 XP)') : selectedDayInfo.status === 'missed' ? (isBreak ? 'Failed (-1 XP)' : 'Missed (-1 XP)') : 'Untracked'}
                    </strong>
                  </div>
                </div>

                {/* Direct 1-Tap Toggle Action Buttons if onCheckInDate is supplied */}
                {onCheckInDate && (
                  <div className="flex items-center gap-1.5 font-mono text-xs">
                    <button
                      type="button"
                      onClick={() => onCheckInDate(habit.id, selectedDayInfo.dateStr, 'done')}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        selectedDayInfo.status === 'done'
                          ? 'bg-emerald-500 text-slate-950 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-500/20'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{isBreak ? 'Controlled' : 'Done'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onCheckInDate(habit.id, selectedDayInfo.dateStr, 'missed')}
                      className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition-all ${
                        selectedDayInfo.status === 'missed'
                          ? 'bg-rose-500 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-500/20'
                      }`}
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                      <span>{isBreak ? 'Failed' : 'Missed'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onCheckInDate(habit.id, selectedDayInfo.dateStr, 'none')}
                      className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                      title="Clear log for this day"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Minimalist Legend */}
            <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-center gap-4 text-[11px] font-mono text-slate-500 dark:text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-[8px]">
                  ✓
                </span>
                <span>Success ({isBreak ? 'Controlled' : 'Done'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-[8px]">
                  ✕
                </span>
                <span>Missed ({isBreak ? 'Failed' : 'Missed'})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3.5 h-3.5 rounded-lg border-2 border-cyan-500 text-[8px] font-bold flex items-center justify-center text-cyan-500">
                  •
                </span>
                <span>Today Indicator</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

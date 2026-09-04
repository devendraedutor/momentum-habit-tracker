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
  Flame,
  Zap,
  Crown,
  Target,
  ShieldAlert,
  Sprout,
  Calendar,
  TrendingUp,
  Check,
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
  onEdit?: (habit: Habit) => void;
  onCheckInDate?: (habitId: string, dateStr: string, status: CheckInStatus) => void;
  onSelectDate?: (dateStr: string) => void;
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
  onCheckInDate: _onCheckInDate,
  onSelectDate,
  activeDateStr,
  floorAtZero = false,
  theme = 'dark',
}) => {
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('30d');
  const [historyRange, setHistoryRange] = useState<'30d' | '60d' | '90d'>('30d');
  const [weekOffset, setWeekOffset] = useState<number>(0);

  const stats = useMemo(() => {
    if (!habit) return null;
    return calculateHabitStats(habit, floorAtZero);
  }, [habit, floorAtZero]);

  const trajectory = useMemo(() => {
    if (!habit) return [];
    const full = calculateHabitTrajectory(habit, timeRange, floorAtZero);
    // Strict start date alignment: Trajectory strictly begins on the exact date tracking started
    const resolvedStartDate = (habit.startDate || habit.createdAt || '').split('T')[0];
    if (!resolvedStartDate) return full;

    // Filter out fake historical dates prior to habit's creation
    const filtered = full.filter((p) => p.date >= resolvedStartDate);
    return filtered.length > 0 ? filtered : full;
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
  const { matrixDays, totalDoneCount, totalMissedCount, rangeTitle } = useMemo(() => {
    if (!habit) {
      return { matrixDays: [], totalDoneCount: 0, totalMissedCount: 0, rangeTitle: '' };
    }

    const anchorDate = parseDateString(effectiveAnchorDateStr);
    anchorDate.setDate(anchorDate.getDate() + weekOffset * 7);

    const daysSpan = historyRange === '90d' ? 91 : historyRange === '60d' ? 63 : 28;

    const start = new Date(anchorDate);
    start.setDate(anchorDate.getDate() - (daysSpan - 1));

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

    const startFormatted = formatDisplayDate(formatDate(start));
    const endFormatted = formatDisplayDate(formatDate(alignedEnd), true);

    return {
      matrixDays: daysList,
      totalDoneCount: doneCount,
      totalMissedCount: missedCount,
      rangeTitle: `${startFormatted} – ${endFormatted}`,
    };
  }, [habit, effectiveAnchorDateStr, weekOffset, historyRange, todayIso, activeDateStr]);

  // Chart configuration
  const isDark = theme === 'dark';
  const habitColor = habit?.color || '#10b981';

  const chartData = useMemo(() => {
    const labels = trajectory.map((p) => p.displayDate);
    const dataPoints = trajectory.map((p) => p.score);

    // Dynamic point nodes: Emerald on climb/done (+1 XP), Crimson on drop/missed (-1 XP)
    const pointBgColors = trajectory.map((p) => {
      if (p.status === 'done') return '#10b981';
      if (p.status === 'missed') return '#f43f5e';
      return isDark ? '#334155' : '#cbd5e1';
    });

    const pointBorderColors = trajectory.map((p) => {
      if (p.status === 'done') return isDark ? '#064e3b' : '#a7f3d0';
      if (p.status === 'missed') return isDark ? '#881337' : '#fecdd3';
      return isDark ? '#0f172a' : '#ffffff';
    });

    return {
      labels,
      datasets: [
        {
          label: `${habit?.name || 'Habit'} Growth`,
          data: dataPoints,
          borderColor: habitColor,
          borderWidth: 2.5,
          tension: 0.35,
          pointRadius: trajectory.length > 40 ? 2 : 4.5,
          pointHoverRadius: 7,
          pointBackgroundColor: pointBgColors,
          pointBorderColor: pointBorderColors,
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
          backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.98)',
          titleColor: isDark ? '#f8fafc' : '#0f172a',
          bodyColor: isDark ? '#94a3b8' : '#475569',
          borderColor: isDark ? 'rgba(51, 65, 85, 0.7)' : 'rgba(226, 232, 240, 0.9)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 14,
          displayColors: false,
          callbacks: {
            title: (items: TooltipItem<'line'>[]) => {
              const item = items[0];
              const point = trajectory[item.dataIndex];
              return point ? formatDisplayDate(point.date, true) : item.label;
            },
            label: (item: TooltipItem<'line'>) => {
              const point = trajectory[item.dataIndex];
              const isBreak = habit?.type === 'BREAK';
              const statusLabel =
                point?.status === 'done'
                  ? (isBreak ? '✓ Controlled (+1 XP)' : '✓ Done (+1 XP)')
                  : point?.status === 'missed'
                  ? (isBreak ? '✕ Slipped (-1 XP)' : '✕ Missed (-1 XP)')
                  : '— Untracked';
              return [
                `Status: ${statusLabel}`,
                `Score: ${item.formattedValue} XP`,
              ];
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
  }, [isDark, trajectory, habit]);

  if (!isOpen || !habit || !stats) return null;

  const isBreak = habit.type === 'BREAK';
  const targetDays = habit.targetGoalDays || 21;
  const startDateFormatted = formatDisplayDate(habit.startDate || habit.createdAt, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-750 shadow-2xl flex flex-col overflow-hidden animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: habitColor }}
        />

        {/* 1. Header Identity Strip (Sticky with permanent accessibility) */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-750 flex items-center justify-between gap-3 sm:gap-4 flex-shrink-0 relative z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md">
          {/* Left Side: Icon + Top: Habit Name, Down: Build/Break Tag */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform bg-slate-100 dark:bg-slate-850"
              style={{
                backgroundColor: `${habitColor}22`,
                color: habitColor,
                border: `1.5px solid ${habitColor}45`,
              }}
            >
              <DynamicIcon name={habit.icon} className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              {/* Top: Habit Name */}
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight truncate leading-tight">
                {habit.name}
              </h2>

              {/* Down: Build/Break Habit Tag */}
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase font-mono flex items-center gap-1 border ${
                    isBreak
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:bg-rose-500/20 dark:border-rose-500/40'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/20 dark:border-emerald-500/40'
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
            </div>
          </div>

          {/* Right Side: Top: Category, Down: Started Date + Sticky Cross Tag */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right flex flex-col items-end justify-center">
              {/* Top: Habit Category */}
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-sans leading-tight">
                {habit.category}
              </span>

              {/* Down: Started Date */}
              <span className="font-mono text-[10px] text-slate-400 dark:text-slate-400 flex items-center gap-1 mt-1 leading-tight">
                <Calendar className="w-3 h-3 text-cyan-500" />
                <span>Started {startDateFormatted}</span>
              </span>
            </div>

            {/* Sticky Tag Cross Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 transition-all active:scale-90 cursor-pointer shadow-xs"
              title="Close"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 relative z-10">
          {/* 2. Redesigned Decluttered 4-Pillar Stat Grid (Ultra-Minimalist Game Stats) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. Streak Tile: 🔥 [Streak] (Universal flame icon for all habits) */}
            <div
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-center items-center text-center transition-all hover:border-amber-500/40 select-none shadow-xs dark:shadow-md dark:shadow-black/20 group min-h-[64px]"
              title={`Current Streak: ${stats.currentStreak} Days (Best: ${stats.bestStreak}d)`}
            >
              <div className="flex items-center justify-center gap-1.5 py-0.5">
                <Flame className="w-5 h-5 fill-amber-500 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-500">
                  {stats.currentStreak}
                </span>
              </div>
            </div>

            {/* 2. Habit XP Tile: ⚡ [XP] */}
            <div
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-center items-center text-center transition-all hover:border-emerald-500/40 select-none shadow-xs dark:shadow-md dark:shadow-black/20 group min-h-[64px]"
              title={`Net Lifetime Score: ${stats.currentScore} XP`}
            >
              <div className="flex items-center justify-center gap-1.5 py-0.5">
                <Zap className="w-5 h-5 text-emerald-500 fill-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-emerald-500">
                  {stats.currentScore}
                </span>
              </div>
            </div>

            {/* 3. Mastery Level Tile: 👑 [Tier] (No Lv. text) */}
            <div
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-center items-center text-center transition-all hover:border-amber-400/40 select-none shadow-xs dark:shadow-md dark:shadow-black/20 group min-h-[64px]"
              title={`Mastery Tier ${habit.currentTier || 1} • Milestones Conquered: ${habit.milestonesCompleted || (habit.currentTier ? habit.currentTier - 1 : 0)}`}
            >
              <div className="flex items-center justify-center gap-1.5 py-0.5">
                <Crown className="w-5 h-5 fill-amber-400 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
                  {habit.currentTier || 1}
                </span>
              </div>
            </div>

            {/* 4. Target Goal Tile: 🎯 [current]/[target]d + micro-bar */}
            <div
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between items-center text-center transition-all hover:border-cyan-500/40 select-none shadow-xs dark:shadow-md dark:shadow-black/20 group min-h-[64px]"
              title={`Target Goal: ${stats.currentGoalStreak} of ${targetDays} days (${stats.goalProgressPercent}%)`}
            >
              <div className="flex items-center justify-center gap-1.5 py-0.5">
                <Target className="w-5 h-5 text-cyan-500 group-hover:scale-110 transition-transform" />
                <div className="flex items-baseline font-mono tracking-tight">
                  <span className="text-xl sm:text-2xl font-black text-cyan-500">
                    {stats.currentGoalStreak}
                  </span>
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-400 ml-0.5">
                    /{targetDays} D
                  </span>
                </div>
              </div>

              {/* 3px Micro Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-[3px] rounded-full overflow-hidden mt-1">
                <div
                  className="bg-cyan-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${stats.goalProgressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* 3. Growth & Momentum Curve Chart */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs dark:shadow-md dark:shadow-black/20">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-500 flex-shrink-0">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 font-mono tracking-tight truncate">
                  {habit.name} : Growth
                </h3>
              </div>

              {/* Range Filter Pills */}
              <div className="flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-850 border border-slate-300/60 dark:border-slate-700 font-mono text-[11px]">
                {(['7d', '30d', 'all'] as ChartTimeRange[]).map((r) => (
                  <button
                    key={r}
                    type="button"
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

          {/* 4. History Overview Calendar Grid */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs dark:shadow-md dark:shadow-black/20">
            {/* Header with Title & Filter Pills */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white font-mono">
                  History Overview
                </h3>
              </div>

              {/* History Range Filter Pills (30 D, 60 D, 90 D) */}
              <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-slate-850 p-1 rounded-xl text-xs font-mono border border-slate-300/60 dark:border-slate-700">
                {(['30d', '60d', '90d'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setHistoryRange(r);
                      setWeekOffset(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                      historyRange === r
                        ? 'bg-cyan-500 text-slate-950 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {r === '30d' ? '30 D' : r === '60d' ? '60 D' : '90 D'}
                  </button>
                ))}
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
                  className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700 transition-colors cursor-pointer"
                  title="View Earlier Weeks"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {weekOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="px-2 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/20 text-[10px] font-bold transition-colors cursor-pointer border border-cyan-500/20"
                  >
                    Current
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  className="p-1.5 rounded-lg bg-slate-200/80 dark:bg-slate-850 hover:bg-slate-300 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 border border-slate-300/60 dark:border-slate-700 transition-colors cursor-pointer"
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

                let cardStyle =
                  'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-700 text-slate-400 hover:border-cyan-500/60 dark:hover:border-cyan-500/60';

                if (isDone) {
                  cardStyle =
                    'bg-emerald-500/15 dark:bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-300 shadow-xs hover:border-emerald-400';
                } else if (isMissed) {
                  cardStyle =
                    'bg-rose-500/15 dark:bg-rose-500/20 border-rose-500/40 text-rose-600 dark:text-rose-300 hover:border-rose-400';
                }

                if (d.isToday) {
                  cardStyle += ' ring-2 ring-cyan-500 border-cyan-500 shadow-xs';
                }

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => {
                      if (onSelectDate) {
                        onSelectDate(d.dateStr);
                      }
                      onClose();
                    }}
                    className={`p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-between min-h-[48px] sm:min-h-[52px] transition-all cursor-pointer select-none text-center hover:scale-[1.03] active:scale-95 ${cardStyle}`}
                    title={`${d.formatted}: ${isDone ? (isBreak ? 'Controlled ✓' : 'Done ✓') : isMissed ? (isBreak ? 'Failed ✕' : 'Missed ✕') : 'Untracked'} (Click to jump to date)`}
                  >
                    {/* Top Day / Month Tag */}
                    <div className="flex items-center justify-between w-full px-0.5 text-[9px] font-mono leading-none">
                      <span className="font-bold opacity-80">{d.dayNum}</span>
                      <span className="text-[8px] opacity-60 uppercase font-semibold">{d.monthShort}</span>
                    </div>

                    {/* Center Icon Badge */}
                    <div className="my-auto flex items-center justify-center">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : isMissed ? (
                        <div className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                          <X className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Dynamic Legend based on Habit Type with Counts */}
            <div className="mt-3.5 pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-center gap-6 text-[11px] font-mono text-slate-600 dark:text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-[9px] shadow-xs">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {isBreak ? `Controlled (${totalDoneCount})` : `Done (${totalDoneCount})`}
                </span>
              </div>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-white font-black text-[9px] shadow-xs">
                  <X className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span className="text-slate-700 dark:text-slate-300">
                  {isBreak ? `Failed (${totalMissedCount})` : `Missed (${totalMissedCount})`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

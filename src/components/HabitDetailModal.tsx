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
import type { ChartOptions, ScriptableContext } from 'chart.js';
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
import { getTierByLevel } from '../config/progression';
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
  isReadOnly?: boolean;
  sharedByBuddyName?: string;
  onToggleShare?: (habitId: string, shared: boolean) => void;
  reflections?: Record<string, string>;
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
  isReadOnly = false,
  sharedByBuddyName,
  onToggleShare,
  reflections,
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
    if (timeRange !== 'all') {
      return full;
    }
    // Strict start date alignment for 'all' range: Trajectory begins on earliest start date or check-in history
    const historyKeys = Object.keys(habit.history || {}).sort();
    const earliestHistory = historyKeys.length > 0 ? historyKeys[0] : undefined;
    let resolvedStartDate = (habit.startDate || habit.createdAt || earliestHistory || '').split('T')[0];
    if (earliestHistory && earliestHistory < resolvedStartDate) {
      resolvedStartDate = earliestHistory;
    }
    if (!resolvedStartDate) return full;

    // Filter out fake historical dates prior to habit's true inception
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

      if (status === 'done' || status === 'controlled') doneCount++;
      if (status === 'missed' || status === 'failed') missedCount++;

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

    // Dynamic point nodes: Emerald on climb/done/controlled (+1 XP), Crimson on drop/missed/failed (-1 XP)
    const pointBgColors = trajectory.map((p) => {
      if (p.status === 'done' || p.status === 'controlled') return '#10b981';
      if (p.status === 'missed' || p.status === 'failed') return '#f43f5e';
      return isDark ? '#334155' : '#cbd5e1';
    });

    const pointBorderColors = trajectory.map((p) => {
      if (p.status === 'done' || p.status === 'controlled') return isDark ? '#064e3b' : '#a7f3d0';
      if (p.status === 'missed' || p.status === 'failed') return isDark ? '#881337' : '#fecdd3';
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
          enabled: false,
          external: (context) => {
            const { chart, tooltip } = context;
            const parent = chart.canvas.parentNode;
            if (!parent) return;

            let tooltipEl = parent.querySelector('.chartjs-custom-tooltip') as HTMLDivElement | null;
            if (!tooltipEl) {
              tooltipEl = document.createElement('div');
              tooltipEl.className =
                'chartjs-custom-tooltip pointer-events-none absolute transition-all duration-75 ease-out z-50';
              parent.appendChild(tooltipEl);
            }

            if (tooltip.opacity === 0) {
              tooltipEl.style.opacity = '0';
              return;
            }

            const dataIndex = tooltip.dataPoints?.[0]?.dataIndex;
            const point = dataIndex !== undefined ? trajectory[dataIndex] : null;
            if (!point) {
              tooltipEl.style.opacity = '0';
              return;
            }

            const habitNote = point.date ? (habit?.notes?.[point.date] || reflections?.[point.date]) : undefined;
            const dateFormatted = formatDisplayDate(point.date, true);

            tooltipEl.innerHTML = `
              <div class="bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-750 shadow-xl rounded-2xl p-2.5 sm:p-3 text-left min-w-[120px] max-w-[220px]">
                <div class="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono leading-tight">
                  ${dateFormatted}
                </div>
                ${
                  habitNote
                    ? `<div class="text-xs text-slate-600 dark:text-slate-300 mt-1.5 font-sans italic flex items-start gap-1">
                        <span class="leading-snug">📝 “${habitNote}”</span>
                      </div>`
                    : ''
                }
              </div>
              <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-slate-200 dark:border-t-slate-750"></div>
              <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-[2px] border-4 border-transparent border-t-white dark:border-t-slate-900"></div>
            `;

            const { offsetLeft: positionX, offsetTop: positionY } = chart.canvas;

            tooltipEl.style.opacity = '1';
            tooltipEl.style.left = positionX + tooltip.caretX + 'px';
            tooltipEl.style.top = positionY + tooltip.caretY - 10 + 'px';
            tooltipEl.style.transform = 'translate(-50%, -100%)';
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
  }, [isDark, trajectory, habit, reflections]);

  if (!isOpen || !habit || !stats) return null;

  const isBreak = habit.type === 'BREAK';
  const activeTier = getTierByLevel(stats.activeTierLevel);
  const targetDays = stats.targetGoalDays;
  const historyDates = Object.keys(habit.history || {}).sort();
  const earliestHistDate = historyDates.length > 0 ? historyDates[0] : undefined;
  let effectiveStartDate = habit.startDate || habit.createdAt || earliestHistDate || todayIso;
  if (earliestHistDate && effectiveStartDate && earliestHistDate < effectiveStartDate) {
    effectiveStartDate = earliestHistDate;
  }
  const startDateFormatted = formatDisplayDate(effectiveStartDate, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-3xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-750 shadow-2xl flex flex-col animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Mac-style Close Button on Top-Right Corner */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition active:scale-90 hover:scale-105 cursor-pointer z-30"
          title="Close"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Ambient Top Glow */}
        <div
          className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: habitColor }}
        />

        {/* 1. Header Identity Strip (Sticky with permanent accessibility) */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 sm:gap-4 flex-shrink-0 relative z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-t-3xl">
          {/* Left Side: Icon + Top: Habit Name, Down: Build/Break Tag */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm transition-transform bg-slate-100 dark:bg-slate-850"
              style={{
                backgroundColor: `${habitColor}22`,
                color: habitColor,
                border: `1.5px solid ${habitColor}45`,
              }}
            >
              <DynamicIcon name={habit.icon} className="w-6 h-6" />
            </div>

            <div className="min-w-0 flex flex-col justify-center">
              {/* Top: Habit Name */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight truncate leading-tight">
                  {habit.name}
                </h2>
                {isReadOnly && (
                  <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 font-sans">
                    ({sharedByBuddyName ? `${sharedByBuddyName.split(' ')[0]}'s Habit` : "Partner's Habit"})
                  </span>
                )}
              </div>

              {/* Down: Build/Break Habit Tag */}
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span
                  className={`text-[11px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold uppercase font-mono flex items-center gap-1 border ${
                    isBreak
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 dark:bg-rose-500/20 dark:border-rose-500/40'
                      : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 dark:bg-emerald-500/20 dark:border-emerald-500/40'
                  }`}
                >
                  {isBreak ? <ShieldAlert className="w-3.5 h-3.5" /> : <Sprout className="w-3.5 h-3.5" />}
                  <span>{isBreak ? 'Break Habit' : 'Build Habit'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right Side: Top: Category, Down: Started Date */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right flex flex-col items-end justify-center">
              {/* Top: Habit Category */}
              <span className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-200 font-sans leading-tight">
                {habit.category}
              </span>

              {/* Down: Started Date */}
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1 leading-tight">
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                <span>Started {startDateFormatted}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Optional Accountability Partner Sharing Toggle (Owner Only) */}
        {!isReadOnly && onToggleShare ? (
          <div className="px-4 sm:px-5 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Accountability Partner Sharing:
            </span>
            <button
              type="button"
              onClick={() => onToggleShare(habit.id, !habit.sharedWithBuddy)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all cursor-pointer ${
                habit.sharedWithBuddy
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {habit.sharedWithBuddy ? '✓ Shared with Partner' : '+ Share with Partner'}
            </button>
          </div>
        ) : null}

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 relative z-10">
          {/* 2. Redesigned Decluttered 4-Pillar Stat Grid (Ultra-Minimalist Game Stats) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {/* 1. Streak Tile: 🔥 [Streak] (Universal flame icon for all habits) */}
            <div
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-center items-center text-center transition-all hover:border-amber-500/40 select-none shadow-xs dark:shadow-md dark:shadow-black/20 group min-h-[64px]"
              title={`Lifetime Streak: ${stats.currentStreak} Days (Best: ${stats.bestStreak}d)`}
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
              title={`Mastery Level ${stats.achievedLevel} • Sprinting for Level ${activeTier.level} (${activeTier.days}d)`}
            >
              <div className="flex items-center justify-center gap-1.5 py-0.5">
                <Crown className="w-5 h-5 fill-amber-400 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-slate-900 dark:text-slate-100">
                  {stats.achievedLevel}
                </span>
              </div>
            </div>

            {/* 4. Target Goal Tile: 🎯 [current]/[target]d + micro-bar */}
            <div
              className="p-3 sm:p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-700 flex flex-col justify-between items-center text-center transition-all hover:border-cyan-500/40 select-none shadow-xs dark:shadow-md dark:shadow-black/20 group min-h-[64px]"
              title={`Sprint Progress: ${stats.currentGoalStreak} of ${targetDays} days (${stats.goalProgressPercent}%)`}
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
            <div className="h-52 w-full relative">
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
                const isDone = d.status === 'done' || d.status === 'controlled';
                const isMissed = d.status === 'missed' || d.status === 'failed';

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

                const habitNote = habit.notes?.[d.dateStr] || reflections?.[d.dateStr];
                const shouldShowTooltip = isMissed && !!habitNote;

                return (
                  <div key={d.dateStr} className="relative group/tile flex flex-col">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isReadOnly && onSelectDate) {
                          onSelectDate(d.dateStr);
                          onClose();
                        }
                      }}
                      className={`w-full p-1.5 sm:p-2 rounded-2xl border flex flex-col items-center justify-between min-h-[48px] sm:min-h-[52px] transition-all select-none text-center relative ${
                        isReadOnly ? 'cursor-default' : 'cursor-pointer hover:scale-[1.03] active:scale-95'
                      } ${cardStyle}`}
                    >
                      {/* Top Day / Month Tag + Reflection Dot */}
                      <div className="flex items-center justify-between w-full px-0.5 text-[9px] font-mono leading-none">
                        <span className="font-bold opacity-80">{d.dayNum}</span>
                        <div className="flex items-center gap-1">
                          {habitNote && (
                            <span
                              className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_5px_rgba(244,63,94,0.9)] inline-block"
                            />
                          )}
                          <span className="text-[8px] opacity-60 uppercase font-semibold">{d.monthShort}</span>
                        </div>
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

                    {/* Instant Custom Hover Tooltip (Only on failed/missed days with user notes) */}
                    {shouldShowTooltip && (
                      <div
                        className={`pointer-events-none absolute bottom-full mb-2 w-max max-w-[200px] sm:max-w-[240px] opacity-0 group-hover/tile:opacity-100 group-hover/tile:scale-100 scale-95 transition-all duration-75 ease-out z-50 origin-bottom bg-white/98 dark:bg-slate-900/98 backdrop-blur-md border border-slate-200 dark:border-slate-750 shadow-xl rounded-2xl p-2.5 sm:p-3 text-left ${
                          d.weekdayShort === 'Mon'
                            ? 'left-0'
                            : d.weekdayShort === 'Sun'
                            ? 'right-0'
                            : 'left-1/2 -translate-x-1/2'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono leading-tight">
                          {d.formatted}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-sans italic flex items-start gap-1">
                          <span className="leading-snug">📝 “{habitNote}”</span>
                        </div>
                        {/* Caret Triangle */}
                        <div
                          className={`absolute top-full -mt-px border-4 border-transparent border-t-slate-200 dark:border-t-slate-750 ${
                            d.weekdayShort === 'Mon'
                              ? 'left-4'
                              : d.weekdayShort === 'Sun'
                              ? 'right-4'
                              : 'left-1/2 -translate-x-1/2'
                          }`}
                        />
                        <div
                          className={`absolute top-full -mt-[2px] border-4 border-transparent border-t-white dark:border-t-slate-900 ${
                            d.weekdayShort === 'Mon'
                              ? 'left-4'
                              : d.weekdayShort === 'Sun'
                              ? 'right-4'
                              : 'left-1/2 -translate-x-1/2'
                          }`}
                        />
                      </div>
                    )}
                  </div>
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

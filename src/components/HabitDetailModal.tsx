import React, { useState, useMemo } from 'react';
import type { Habit, ChartTimeRange, CheckInStatus } from '../types/habit';
import { calculateHabitStats, getDateRange, getTodayString, formatDisplayDate } from '../lib/momentum';
import { MomentumChart } from './MomentumChart';
import { DynamicIcon } from './DynamicIcon';
import { X, Calendar, Check, RotateCcw, AlertTriangle, Trash2, Edit2, TrendingUp, TrendingDown, Target, Shield, Flame, ShieldAlert, Sprout, Crown } from 'lucide-react';

interface HabitDetailModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onCheckInDate: (habitId: string, dateStr: string, status: CheckInStatus) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habitId: string) => void;
  onDelete: (habitId: string) => void;
  activeDateStr?: string;
  floorAtZero?: boolean;
  theme?: 'dark' | 'light';
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  isOpen,
  onClose,
  onCheckInDate,
  onEdit,
  onArchive,
  onDelete,
  activeDateStr,
  floorAtZero = false,
  theme = 'dark',
}) => {
  const todayStr = getTodayString();
  const currentActiveDate = activeDateStr || todayStr;
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('30d');
  const [selectedDay, setSelectedDay] = useState<string>(currentActiveDate);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync selectedDay whenever modal opens or activeDateStr changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedDay(activeDateStr || todayStr);
    }
  }, [isOpen, activeDateStr, todayStr]);

  const stats = useMemo(() => {
    if (!habit) return null;
    return calculateHabitStats(habit, floorAtZero);
  }, [habit, floorAtZero]);

  const past60Days = useMemo(() => {
    const effectiveEnd = activeDateStr && activeDateStr > todayStr ? activeDateStr : todayStr;
    const [y, m, d] = effectiveEnd.split('-').map(Number);
    const endDate = new Date(y, m - 1, d);
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 59);
    const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
    return getDateRange(startStr, effectiveEnd);
  }, [todayStr, activeDateStr]);

  if (!isOpen || !habit || !stats) return null;

  const isBreak = habit.type === 'BREAK';
  const targetGoalDays = habit.targetGoalDays || 21;
  const daysLeft = Math.max(0, targetGoalDays - stats.currentGoalStreak);
  const progressPercent = Math.min(100, Math.round((stats.currentGoalStreak / targetGoalDays) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-8 relative border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[92vh]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center p-2.5 text-white shadow-md flex-shrink-0"
              style={{
                backgroundColor: `${habit.color}25`,
                border: `2px solid ${habit.color}`,
                color: habit.color,
              }}
            >
              <DynamicIcon name={habit.icon} className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                  isBreak
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30'
                    : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                }`}>
                  {isBreak ? <ShieldAlert className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
                  <span>{isBreak ? 'Break Habit' : 'Build Habit'}</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {habit.category}
                </span>
                {habit.currentTier && habit.currentTier > 1 && (
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 flex items-center gap-1 shadow-xs">
                    <Crown className="w-3 h-3 fill-amber-500" />
                    <span>Tier {habit.currentTier}</span>
                  </span>
                )}
                <span className="text-xs text-slate-500 font-mono">
                  Started {formatDisplayDate(habit.createdAt, true)}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5">{habit.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => onEdit(habit)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-amber-500" /> Edit
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {habit.description && (
          <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80 my-3 leading-relaxed">
            {habit.description}
          </p>
        )}

        {/* Target Goal Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 my-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {targetGoalDays}-Day {isBreak ? 'Clean Goal' : 'Target Goal'}
              </span>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Day {stats.currentGoalStreak} / {targetGoalDays}
            </span>
          </div>

          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-600 dark:text-slate-300">
              {daysLeft === 0 ? 'Goal Achieved!' : `${daysLeft} ${isBreak ? 'clean days' : 'target days'} remaining`}
            </span>
            <span className="text-rose-500 text-[11px] font-medium">
              {isBreak ? 'Failed resets clean streak to Day 0' : 'Missed resets streak to Day 0'}
            </span>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 my-4">
          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Total XP</div>
            <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.currentScore > 0 ? `+${stats.currentScore}` : stats.currentScore} <span className="text-xs">XP</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 font-mono">
              {stats.weeklyVelocity >= 0 ? (
                <span className="text-emerald-600 dark:text-emerald-400 flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> +{stats.weeklyVelocity} XP 7d
                </span>
              ) : (
                <span className="text-rose-600 dark:text-rose-400 flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> {stats.weeklyVelocity} XP 7d
                </span>
              )}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">
              {isBreak ? 'Clean Streak' : 'Streak'}
            </div>
            <div className="text-2xl font-black font-mono text-amber-500 dark:text-amber-400 mt-1 flex items-center gap-1.5">
              <Flame className="w-4.5 h-4.5 fill-amber-500 text-amber-500" />
              <span>{stats.currentStreak} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">days</span></span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Best: <strong className="text-slate-800 dark:text-white font-mono">{stats.bestStreak}d</strong>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Win Rate</div>
            <div className="text-2xl font-black font-mono text-cyan-600 dark:text-cyan-400 mt-1">
              {stats.completionRate}%
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
              +{stats.totalDone} {isBreak ? 'Ctrl' : 'XP'} / -{stats.totalMissed} {isBreak ? 'Fail' : 'Miss'}
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="text-[10px] uppercase font-mono text-slate-500 dark:text-slate-400">Peak XP</div>
            <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
              +{stats.highestScore}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Floor: {stats.lowestScore} XP
            </div>
          </div>
        </div>

        <div className="my-5">
          <MomentumChart
            habits={[habit]}
            selectedHabitId={habit.id}
            timeRange={timeRange}
            onTimeRangeChange={setTimeRange}
            floorAtZero={floorAtZero}
            theme={theme}
          />
        </div>

        {/* 60-Day Activity History */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">60-Day History</h3>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Tap date to modify</span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
            {past60Days.map((dateStr) => {
              const status = habit.history[dateStr] || 'none';
              const isToday = dateStr === todayStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDay(dateStr)}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center transition-all text-center relative border cursor-pointer ${
                    selectedDay === dateStr ? 'ring-2 ring-cyan-500 scale-105 z-10' : ''
                  } ${
                    status === 'done'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                      : status === 'missed'
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-700 dark:text-rose-300'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 hover:border-slate-300'
                  }`}
                  title={`${formatDisplayDate(dateStr, true)}: ${status.toUpperCase()}`}
                >
                  <span className="text-[10px] font-mono opacity-80">{dateStr.slice(8)}</span>
                  <div className="mt-1">
                    {status === 'done' ? (
                      isBreak ? <Shield className="w-3 h-3 text-emerald-500 fill-emerald-500" /> : <Check className="w-3 h-3 stroke-[3]" />
                    ) : status === 'missed' ? (
                      <X className="w-3 h-3 stroke-[3]" />
                    ) : (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700 block my-1" />
                    )}
                  </div>
                  {isToday && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-500 shadow-[0_0_6px_#06b6d4]" />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-3.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2.5 animate-fade-in shadow-sm">
              <div className="text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-mono">{formatDisplayDate(selectedDay, true)}:</span>{' '}
                <strong className="text-slate-900 dark:text-white uppercase font-mono">
                  {habit.history[selectedDay] === 'done'
                    ? (isBreak ? '+1 XP (Controlled)' : '+1 XP (Done)')
                    : habit.history[selectedDay] === 'missed'
                    ? (isBreak ? '-1 XP (Failed)' : '-1 XP (Missed)')
                    : 'Unlogged'}
                </strong>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onCheckInDate(habit.id, selectedDay, 'done')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    habit.history[selectedDay] === 'done'
                      ? 'bg-emerald-500 text-slate-950 shadow-xs'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white'
                  }`}
                >
                  <Check className="w-3 h-3 stroke-[3]" /> {isBreak ? 'Controlled (+1)' : 'Done (+1)'}
                </button>

                <button
                  onClick={() => onCheckInDate(habit.id, selectedDay, 'missed')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                    habit.history[selectedDay] === 'missed'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-400 hover:bg-rose-500 hover:text-white'
                  }`}
                >
                  <X className="w-3 h-3 stroke-[3]" /> {isBreak ? 'Failed (-1)' : 'Missed (-1)'}
                </button>

                <button
                  onClick={() => onCheckInDate(habit.id, selectedDay, 'none')}
                  className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Clear check-in"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onArchive(habit.id)}
              className="px-3 py-1.5 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {habit.archived ? 'Unarchive Habit' : 'Archive Habit'}
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Habit
              </button>
            ) : (
              <div className="flex items-center gap-1.5 p-1 bg-rose-500/10 rounded-xl border border-rose-500/20 animate-fade-in">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-500 ml-1" />
                <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px]">Delete permanently?</span>
                <button
                  onClick={() => onDelete(habit.id)}
                  className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2 py-0.5 text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold hover:opacity-90 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import type { Habit } from '../types/habit';
import { calculateHabitStats, getTodayString } from '../lib/momentum';
import { Flame, Award, Zap, TrendingUp, TrendingDown, Star } from 'lucide-react';

interface DashboardStatsProps {
  habits: Habit[];
  jumboPointsCount?: number;
  floorAtZero?: boolean;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  habits,
  jumboPointsCount = 0,
  floorAtZero = false,
}) => {
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const todayStr = getTodayString();

  const metrics = useMemo(() => {
    if (activeHabits.length === 0) {
      return {
        totalScore: 0,
        weeklyChange: 0,
        todayCompleted: 0,
        todayTotal: 0,
        longestCurrentStreak: 0,
        overallWinRate: 0,
      };
    }

    let totalScore = 0;
    let weeklyChange = 0;
    let todayCompleted = 0;
    let longestCurrentStreak = 0;
    let totalDoneAllTime = 0;
    let totalMissedAllTime = 0;

    activeHabits.forEach((habit) => {
      const stats = calculateHabitStats(habit, floorAtZero);
      totalScore += stats.currentScore;
      weeklyChange += stats.weeklyVelocity;

      if (stats.currentStreak > longestCurrentStreak) {
        longestCurrentStreak = stats.currentStreak;
      }

      totalDoneAllTime += stats.totalDone;
      totalMissedAllTime += stats.totalMissed;

      if (habit.history[todayStr] === 'done') todayCompleted++;
    });

    const totalLogged = totalDoneAllTime + totalMissedAllTime;
    const overallWinRate = totalLogged > 0 ? Math.round((totalDoneAllTime / totalLogged) * 100) : 0;

    return {
      totalScore,
      weeklyChange,
      todayCompleted,
      todayTotal: activeHabits.length,
      longestCurrentStreak,
      overallWinRate,
    };
  }, [activeHabits, todayStr, floorAtZero]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
      {/* 1. Total Habit XP */}
      <div className="app-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total XP
          </span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Zap className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {metrics.totalScore > 0 ? `+${metrics.totalScore}` : metrics.totalScore}
          </span>
          <span className="text-[10px] text-slate-400 font-bold font-mono">XP</span>
        </div>
        <div className="mt-1 text-[11px] font-medium">
          {metrics.weeklyChange >= 0 ? (
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center font-mono">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +{metrics.weeklyChange} 7d
            </span>
          ) : (
            <span className="text-rose-600 dark:text-rose-400 flex items-center font-mono">
              <TrendingDown className="w-3 h-3 mr-0.5" /> {metrics.weeklyChange} 7d
            </span>
          )}
        </div>
      </div>

      {/* 2. Jumbo Points (🌟 100% Perfect Days) */}
      <div className="app-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between bg-gradient-to-br from-amber-500/5 via-transparent to-yellow-500/5 border-amber-500/20">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
            Jumbo Points
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-500">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono tracking-tight">
            {jumboPointsCount}
          </span>
          <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 font-bold font-mono">PTS</span>
        </div>
        <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-mono font-medium">
          🌟 100% Perfect Days
        </div>
      </div>

      {/* 3. Streak */}
      <div className="app-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Streak
          </span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Flame className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {metrics.longestCurrentStreak}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">days</span>
        </div>
        <div className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
          🔥 Active streak
        </div>
      </div>

      {/* 4. Win Rate */}
      <div className="app-card rounded-2xl p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Win Rate
          </span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
            <Award className="w-3.5 h-3.5" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
            {metrics.overallWinRate}%
          </span>
        </div>
        <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
          Completed ratio
        </div>
      </div>
    </div>
  );
};

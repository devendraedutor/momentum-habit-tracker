import { useMemo } from 'react';
import type { Habit } from '../types/habit';
import { getTodayString, parseDateString, formatDate, formatDisplayDate } from '../lib/momentum';

export interface DayJumboStatus {
  dateKey: string;      // YYYY-MM-DD
  displayDate: string;  // "Sep 7"
  isPerfect: boolean;
  isFuture: boolean;
  isLogged: boolean;
  completedCount: number;
  totalActiveCount: number;
  failedHabits: { id: string; name: string; icon: string; color?: string; status: string }[];
}

export interface SaboteurHabitMetric {
  habit: Habit;
  count: number;
  isTopSaboteur: boolean;
}

export interface JumboMilestone {
  currentPoints: number;
  targetPoints: number;
  progressPercent: number;
  rewardTitle: string;
  rewardIcon: string;
}

export interface JumboAnalytics {
  days: DayJumboStatus[];
  cleanRate: number;
  perfectDaysCount: number;
  evaluatedDaysCount: number;
  rankedSaboteurs: SaboteurHabitMetric[];
  maxBreaks: number;
  totalPoints: number;
  nextMilestone: JumboMilestone;
}

const MILESTONE_TIERS = [
  { target: 7, title: 'Starter Gem Vault', icon: '💎' },
  { target: 14, title: 'Silver Constellation', icon: '🌟' },
  { target: 30, title: 'Golden Vault Crown', icon: '👑' },
  { target: 60, title: 'Prestige Diamond Theme', icon: '💠' },
  { target: 100, title: 'Unbreakable Legend Badge', icon: '🏆' },
];

export const useJumboAnalytics = (
  habits: Habit[],
  jumboDates: string[] = []
): JumboAnalytics => {
  return useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived);
    const days: DayJumboStatus[] = [];
    const saboteurCount: Record<string, { habit: Habit; count: number }> = {};

    // Initialize saboteur dictionary
    activeHabits.forEach((h) => {
      saboteurCount[h.id] = { habit: h, count: 0 };
    });

    const todayStr = getTodayString();
    const todayDate = parseDateString(todayStr);
    const jumboSet = new Set(jumboDates);

    for (let i = 27; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(todayDate.getDate() - i);
      const dateKey = formatDate(d); // Accurate local YYYY-MM-DD
      const displayDate = formatDisplayDate(dateKey);
      const isFuture = dateKey > todayStr;

      // Active habits on or before this day
      const activeHabitsForDay = activeHabits.filter((h) => {
        const start = h.startDate || (h.createdAt ? h.createdAt.split('T')[0] : '2000-01-01');
        return start <= dateKey;
      });

      const failedHabits: { id: string; name: string; icon: string; color?: string; status: string }[] = [];
      let completedCount = 0;
      let loggedCount = 0;

      activeHabitsForDay.forEach((habit) => {
        const rawStatus = habit.history?.[dateKey];
        const status = rawStatus as string | undefined;
        if (status === 'done' || status === 'controlled') {
          completedCount++;
          loggedCount++;
        } else if (status === 'failed' || status === 'missed') {
          loggedCount++;
          failedHabits.push({
            id: habit.id,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            status: 'Failed',
          });
          if (saboteurCount[habit.id]) {
            saboteurCount[habit.id].count += 1;
          }
        } else {
          // Unlogged past day
          if (!isFuture && activeHabitsForDay.length > 0) {
            failedHabits.push({
              id: habit.id,
              name: habit.name,
              icon: habit.icon,
              color: habit.color,
              status: 'Missed',
            });
          }
        }
      });

      // A day is perfect ONLY if all active habits were successfully checked OR recorded in jumboSet
      const isPerfect =
        jumboSet.has(dateKey) ||
        (activeHabitsForDay.length > 0 && completedCount === activeHabitsForDay.length);

      days.push({
        dateKey,
        displayDate,
        isPerfect,
        isFuture,
        isLogged: loggedCount > 0,
        completedCount,
        totalActiveCount: activeHabitsForDay.length,
        failedHabits,
      });
    }

    // Calculate actual clean rate over recorded past days
    const evaluatedDays = days.filter((d) => !d.isFuture && d.totalActiveCount > 0);
    const perfectDaysCount = evaluatedDays.filter((d) => d.isPerfect).length;
    const cleanRate = evaluatedDays.length > 0 ? Math.round((perfectDaysCount / evaluatedDays.length) * 100) : 0;

    const totalPoints = Math.max(jumboDates.length, days.filter((d) => d.isPerfect).length);

    // Sort saboteurs by frequency
    const rankedSaboteurs: SaboteurHabitMetric[] = Object.values(saboteurCount)
      .map(({ habit, count }) => ({
        habit,
        count,
        isTopSaboteur: false,
      }))
      .sort((a, b) => b.count - a.count);

    const maxBreaks = rankedSaboteurs.length > 0 ? Math.max(...rankedSaboteurs.map((s) => s.count), 1) : 1;

    if (rankedSaboteurs.length > 0 && rankedSaboteurs[0].count > 0) {
      rankedSaboteurs[0].isTopSaboteur = true;
    }

    // Next Milestone Reward Calculation
    const foundTier = MILESTONE_TIERS.find((t) => totalPoints < t.target) || {
      target: totalPoints + 50,
      title: 'Diamond Master Legend',
      icon: '👑',
    };

    const nextMilestone: JumboMilestone = {
      currentPoints: totalPoints,
      targetPoints: foundTier.target,
      progressPercent: Math.min(100, Math.round((totalPoints / foundTier.target) * 100)),
      rewardTitle: foundTier.title,
      rewardIcon: foundTier.icon,
    };

    return {
      days,
      cleanRate,
      perfectDaysCount,
      evaluatedDaysCount: evaluatedDays.length,
      rankedSaboteurs,
      maxBreaks,
      totalPoints,
      nextMilestone,
    };
  }, [habits, jumboDates]);
};

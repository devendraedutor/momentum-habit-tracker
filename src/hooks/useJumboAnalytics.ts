import { useMemo } from 'react';
import type { Habit } from '../types/habit';
import { getTodayString, parseDateString, formatDate, formatDisplayDate } from '../lib/momentum';

export interface DayConstellationPoint {
  dateStr: string;
  formattedDate: string;
  dayOfWeek: string;
  dayNumber: number;
  isToday: boolean;
  isFuture: boolean;
  isPerfectDay: boolean;
  isLogged: boolean;
  brokenHabits: {
    habit: Habit;
    status: string;
  }[];
  completedHabitsCount: number;
  totalActiveHabitsCount: number;
}

export interface SaboteurHabitMetric {
  habit: Habit;
  breakCount: number;
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
  totalJumboPoints: number;
  perfectDayRate: number;
  constellationDays: DayConstellationPoint[];
  saboteurRanking: SaboteurHabitMetric[];
  maxBreaks: number;
  nextMilestone: JumboMilestone;
}

const MILESTONE_TIERS = [
  { target: 7, title: 'Starter Gem Vault', icon: '💎' },
  { target: 14, title: 'Silver Constellation', icon: '🌟' },
  { target: 30, title: 'Golden Vault Crown', icon: '👑' },
  { target: 60, title: 'Prestige Diamond Theme', icon: '💠' },
  { target: 100, title: 'Unbreakable Legend Badge', icon: '🏆' },
];

export function useJumboAnalytics(
  habits: Habit[],
  jumboDates: string[] = []
): JumboAnalytics {
  return useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived);
    const todayStr = getTodayString();
    const todayDate = parseDateString(todayStr);

    // 1. Generate Last 28 Days (4x7 Grid)
    const constellationDays: DayConstellationPoint[] = [];
    const jumboSet = new Set(jumboDates);

    for (let i = 27; i >= 0; i--) {
      const d = new Date(todayDate);
      d.setDate(d.getDate() - i);
      const dateStr = formatDate(d);
      const isToday = dateStr === todayStr;
      const isFuture = dateStr > todayStr;

      // Active habits on this specific day
      const activeOnDay = activeHabits.filter((h) => {
        const start = h.startDate || (h.createdAt ? h.createdAt.split('T')[0] : '2000-01-01');
        return start <= dateStr;
      });

      let completedCount = 0;
      let loggedCount = 0;
      const brokenHabits: { habit: Habit; status: string }[] = [];

      activeOnDay.forEach((h) => {
        const st = h.history?.[dateStr];
        if (st === 'done') {
          completedCount++;
          loggedCount++;
        } else if (st === 'missed') {
          loggedCount++;
          brokenHabits.push({ habit: h, status: 'Failed' });
        } else {
          // Unlogged or pending
          if (!isFuture && activeOnDay.length > 0) {
            brokenHabits.push({ habit: h, status: 'Missed' });
          }
        }
      });

      const isPerfect =
        jumboSet.has(dateStr) ||
        (activeOnDay.length >= 1 && completedCount === activeOnDay.length);

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayOfWeek = dayNames[d.getDay()];

      constellationDays.push({
        dateStr,
        formattedDate: formatDisplayDate(dateStr),
        dayOfWeek,
        dayNumber: d.getDate(),
        isToday,
        isFuture,
        isPerfectDay: isPerfect,
        isLogged: loggedCount > 0,
        brokenHabits,
        completedHabitsCount: completedCount,
        totalActiveHabitsCount: activeOnDay.length,
      });
    }

    // 2. Compute Total Jumbo Points and 28-day Clean Rate
    const totalJumboPoints = Math.max(jumboDates.length, constellationDays.filter((d) => d.isPerfectDay).length);
    
    const pastDays = constellationDays.filter((d) => !d.isFuture && d.totalActiveHabitsCount > 0);
    const perfectPastCount = pastDays.filter((d) => d.isPerfectDay).length;
    const perfectDayRate = pastDays.length > 0 ? Math.round((perfectPastCount / pastDays.length) * 100) : 0;

    // 3. Compute Saboteur Ranking (which habits prevented 100% completion in the 28-day window)
    const habitBreakMap = new Map<string, number>();
    activeHabits.forEach((h) => habitBreakMap.set(h.id, 0));

    constellationDays.forEach((day) => {
      if (day.isFuture || day.isPerfectDay) return;
      
      // On days where the user had at least one activity, count the habits that failed
      day.brokenHabits.forEach(({ habit }) => {
        const currentCount = habitBreakMap.get(habit.id) || 0;
        habitBreakMap.set(habit.id, currentCount + 1);
      });
    });

    const saboteurRanking: SaboteurHabitMetric[] = activeHabits
      .map((h) => ({
        habit: h,
        breakCount: habitBreakMap.get(h.id) || 0,
        isTopSaboteur: false,
      }))
      .sort((a, b) => b.breakCount - a.breakCount);

    const maxBreaks = saboteurRanking.length > 0 ? Math.max(...saboteurRanking.map((s) => s.breakCount), 1) : 1;

    if (saboteurRanking.length > 0 && saboteurRanking[0].breakCount > 0) {
      saboteurRanking[0].isTopSaboteur = true;
    }

    // 4. Next Milestone Reward Calculation
    const foundTier = MILESTONE_TIERS.find((t) => totalJumboPoints < t.target) || {
      target: totalJumboPoints + 50,
      title: 'Diamond Master Legend',
      icon: '👑',
    };

    const nextMilestone: JumboMilestone = {
      currentPoints: totalJumboPoints,
      targetPoints: foundTier.target,
      progressPercent: Math.min(100, Math.round((totalJumboPoints / foundTier.target) * 100)),
      rewardTitle: foundTier.title,
      rewardIcon: foundTier.icon,
    };

    return {
      totalJumboPoints,
      perfectDayRate,
      constellationDays,
      saboteurRanking,
      maxBreaks,
      nextMilestone,
    };
  }, [habits, jumboDates]);
}

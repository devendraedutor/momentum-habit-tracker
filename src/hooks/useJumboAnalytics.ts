import { useMemo } from 'react';
import type { Habit } from '../types/habit';
import { getTodayString, parseDateString, formatDate, formatDisplayDate } from '../lib/momentum';

export interface DayJumboStatus {
  dateKey: string;      // YYYY-MM-DD
  displayDate: string;  // "Sep 7"
  isPerfect: boolean;
  isFuture: boolean;
  isLogged: boolean;
  isBroken: boolean;
  isIncomplete: boolean;
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
  longestFlawlessStreak: number;
  rankedSaboteurs: SaboteurHabitMetric[];
  maxBreaks: number;
  totalPoints: number;
  nextMilestone: JumboMilestone;
  windowStartDate: string;
  windowEndDate: string;
}

const MILESTONE_TIERS = [
  { target: 7, title: 'Starter Gem Vault', icon: '💎' },
  { target: 14, title: 'Silver Constellation', icon: '🌟' },
  { target: 30, title: 'Golden Vault Crown', icon: '👑' },
  { target: 60, title: 'Prestige Diamond Theme', icon: '💠' },
  { target: 100, title: 'Unbreakable Legend Badge', icon: '🏆' },
];

export type JumboWindowMode = 'smart' | 'recent' | 'streak';

function computeLongestFlawlessStreak(dates: string[]): { streak: number; endDate: string | null } {
  if (!dates || dates.length === 0) return { streak: 0, endDate: null };
  const sorted = Array.from(new Set(dates)).sort();
  let maxStreak = 1;
  let currentStreak = 1;
  let bestEnd = sorted[0];

  for (let i = 0; i < sorted.length - 1; i++) {
    const d1 = parseDateString(sorted[i]);
    const d2 = parseDateString(sorted[i + 1]);
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
        bestEnd = sorted[i + 1];
      }
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return { streak: maxStreak, endDate: bestEnd };
}

export const useJumboAnalytics = (
  habits: Habit[],
  jumboDates: string[] = [],
  windowMode: JumboWindowMode = 'smart'
): JumboAnalytics => {
  return useMemo(() => {
    const activeHabits = habits.filter((h) => !h.archived);
    const todayStr = getTodayString();

    // 1. Gather all recorded dates across habits and jumbo wallet
    const allRecordedDates: string[] = [...jumboDates];
    activeHabits.forEach((h) => {
      if (h.history) {
        Object.keys(h.history).forEach((d) => allRecordedDates.push(d));
      }
    });
    allRecordedDates.sort();

    // All-time Flawless Streak
    const streakResult = computeLongestFlawlessStreak(jumboDates);
    const longestFlawlessStreak = streakResult.streak;

    // Determine Anchor Date based on windowMode
    let anchorDateStr = todayStr;
    const latestRecordedDate = allRecordedDates.length > 0 ? allRecordedDates[allRecordedDates.length - 1] : todayStr;

    if (windowMode === 'streak' && streakResult.endDate) {
      anchorDateStr = streakResult.endDate;
    } else if (windowMode === 'smart') {
      anchorDateStr = latestRecordedDate;
    } else {
      anchorDateStr = todayStr;
    }

    const anchorDate = parseDateString(anchorDateStr);

    // 2. Build 28-day Window ending at anchorDate
    const days: DayJumboStatus[] = [];
    const saboteurCount: Record<string, { habit: Habit; count: number }> = {};
    activeHabits.forEach((h) => {
      saboteurCount[h.id] = { habit: h, count: 0 };
    });

    const jumboSet = new Set(jumboDates);

    for (let i = 27; i >= 0; i--) {
      const d = new Date(anchorDate);
      d.setDate(anchorDate.getDate() - i);
      const dateKey = formatDate(d);
      const displayDate = formatDisplayDate(dateKey);
      const isFuture = dateKey > todayStr;

      const failedHabits: { id: string; name: string; icon: string; color?: string; status: string }[] = [];
      let completedCount = 0;
      let loggedCount = 0;

      activeHabits.forEach((habit) => {
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
        }
      });

      // A day is perfect if recorded in jumboDates OR all active habits were successfully checked without any failures
      const isPerfect =
        jumboSet.has(dateKey) ||
        (activeHabits.length > 0 && completedCount === activeHabits.length && failedHabits.length === 0);

      const isBroken = !isPerfect && failedHabits.length > 0;
      const isIncomplete = !isPerfect && !isBroken && !isFuture;

      days.push({
        dateKey,
        displayDate,
        isPerfect,
        isFuture,
        isLogged: loggedCount > 0 || isPerfect,
        isBroken,
        isIncomplete,
        failedHabits,
      });
    }

    // 4. Metrics & Clean Rate
    const evaluatedDays = days.filter((d) => !d.isFuture && (d.isLogged || d.isPerfect || d.failedHabits.length > 0));
    const perfectDaysCount = days.filter((d) => d.isPerfect).length;
    
    // Clean rate based on logged activity in the 28-day window (or total evaluated)
    const cleanRate =
      evaluatedDays.length > 0
        ? Math.round((perfectDaysCount / evaluatedDays.length) * 100)
        : perfectDaysCount > 0
        ? Math.round((perfectDaysCount / 28) * 100)
        : 0;

    const totalPoints = Math.max(jumboDates.length, days.filter((d) => d.isPerfect).length);

    // 5. Ranked Saboteurs
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

    // 6. Next Milestone Reward Calculation
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

    const windowStartDate = days.length > 0 ? days[0].displayDate : '';
    const windowEndDate = days.length > 0 ? days[days.length - 1].displayDate : '';

    return {
      days,
      cleanRate,
      perfectDaysCount,
      evaluatedDaysCount: evaluatedDays.length || 28,
      longestFlawlessStreak,
      rankedSaboteurs,
      maxBreaks,
      totalPoints,
      nextMilestone,
      windowStartDate,
      windowEndDate,
    };
  }, [habits, jumboDates, windowMode]);
};

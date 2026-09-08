import { useMemo } from 'react';
import type { Habit } from '../types/habit';
import { getTodayString, parseDateString, formatDate, formatDisplayDate, getDateRange } from '../lib/momentum';

export interface DayJumboStatus {
  dateKey: string;      // YYYY-MM-DD
  dayNum: number;       // 28
  monthShort: string;   // "SEP"
  weekdayShort: string; // "Mon"
  displayDate: string;  // "Sep 28"
  isPerfect: boolean;
  isBroken: boolean;
  isIncomplete: boolean;
  isFuture: boolean;
  isToday: boolean;
  failedHabits: { id: string; name: string; icon: string; color?: string; status: string }[];
  completedHabitsCount: number;
  totalActiveHabitsCount: number;
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
  conqueredCount: number;
  interruptedCount: number;
  unloggedCount: number;
  longestFlawlessStreak: number;
  rankedSaboteurs: SaboteurHabitMetric[];
  maxBreaks: number;
  totalPoints: number;
  nextMilestone: JumboMilestone;
  rangeTitle: string;
  canGoForward: boolean;
  canGoBackward: boolean;
}

const MILESTONE_TIERS = [
  { target: 7, title: 'Starter Gem Vault', icon: '💎' },
  { target: 14, title: 'Silver Constellation', icon: '🌟' },
  { target: 30, title: 'Golden Vault Crown', icon: '👑' },
  { target: 60, title: 'Prestige Diamond Theme', icon: '💠' },
  { target: 100, title: 'Unbreakable Legend Badge', icon: '🏆' },
];

function computeLongestFlawlessStreak(dates: string[]): number {
  if (!dates || dates.length === 0) return 0;
  const sorted = Array.from(new Set(dates)).sort();
  let maxStreak = 1;
  let currentStreak = 1;

  for (let i = 0; i < sorted.length - 1; i++) {
    const d1 = parseDateString(sorted[i]);
    const d2 = parseDateString(sorted[i + 1]);
    const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      if (currentStreak > maxStreak) {
        maxStreak = currentStreak;
      }
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

export const useJumboAnalytics = (
  habits: Habit[],
  jumboDates: string[] = [],
  pageOffset: number = 0
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

    // Find smart base anchor date: latest date with user activity or today
    const latestRecordedDate = allRecordedDates.length > 0 ? allRecordedDates[allRecordedDates.length - 1] : todayStr;
    const baseAnchor = parseDateString(latestRecordedDate);

    // Apply 28-day block pagination
    baseAnchor.setDate(baseAnchor.getDate() + pageOffset * 28);

    // Align 28-day window to Monday – Sunday (4 full weeks = exactly 28 days)
    const endDayOfWeek = baseAnchor.getDay();
    const diffToSunday = (7 - endDayOfWeek) % 7;
    const alignedEnd = new Date(baseAnchor);
    alignedEnd.setDate(baseAnchor.getDate() + diffToSunday);

    const alignedStart = new Date(alignedEnd);
    alignedStart.setDate(alignedEnd.getDate() - 27);

    const startStr = formatDate(alignedStart);
    const endStr = formatDate(alignedEnd);
    const dateRangeList = getDateRange(startStr, endStr);

    const jumboSet = new Set(jumboDates);
    const saboteurCount: Record<string, { habit: Habit; count: number }> = {};
    activeHabits.forEach((h) => {
      saboteurCount[h.id] = { habit: h, count: 0 };
    });

    let conqueredCount = 0;
    let interruptedCount = 0;
    let unloggedCount = 0;

    const days: DayJumboStatus[] = dateRangeList.map((dateKey) => {
      const dateObj = parseDateString(dateKey);
      const dayNum = dateObj.getDate();
      const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const weekdayShort = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = formatDisplayDate(dateKey);
      const isToday = dateKey === todayStr;
      const isFuture = dateKey > todayStr;

      const failedHabits: { id: string; name: string; icon: string; color?: string; status: string }[] = [];
      let completedHabitsCount = 0;
      let loggedHabitsCount = 0;

      activeHabits.forEach((habit) => {
        const rawStatus = habit.history?.[dateKey];
        const status = rawStatus as string | undefined;

        if (status === 'done' || status === 'controlled') {
          completedHabitsCount++;
          loggedHabitsCount++;
        } else if (status === 'failed' || status === 'missed') {
          loggedHabitsCount++;
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

      const isPerfect =
        jumboSet.has(dateKey) ||
        (activeHabits.length > 0 && completedHabitsCount === activeHabits.length && failedHabits.length === 0);

      const isBroken = !isPerfect && failedHabits.length > 0;
      const isIncomplete = !isPerfect && !isBroken && !isFuture;

      if (isPerfect) conqueredCount++;
      else if (isBroken) interruptedCount++;
      else if (isIncomplete) unloggedCount++;

      return {
        dateKey,
        dayNum,
        monthShort,
        weekdayShort,
        displayDate,
        isPerfect,
        isBroken,
        isIncomplete,
        isFuture,
        isToday,
        failedHabits,
        completedHabitsCount,
        totalActiveHabitsCount: activeHabits.length,
      };
    });

    // All-time Flawless Streak
    const longestFlawlessStreak = computeLongestFlawlessStreak(jumboDates);

    // Total points (wallet points or max conquered)
    const totalPoints = Math.max(jumboDates.length, conqueredCount);

    // Clean rate calculation for current window
    const evaluatedTotal = conqueredCount + interruptedCount;
    const cleanRate =
      evaluatedTotal > 0
        ? Math.round((conqueredCount / evaluatedTotal) * 100)
        : conqueredCount > 0
        ? Math.round((conqueredCount / 28) * 100)
        : 0;

    // Ranked Saboteurs
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

    // Milestone Reward Track
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

    // Range display string (e.g. "Sep 28 – Oct 25, 2026")
    const startFormatted = formatDisplayDate(startStr);
    const endFormatted = formatDisplayDate(endStr, true);
    const rangeTitle = `${startFormatted} – ${endFormatted}`;

    return {
      days,
      cleanRate,
      conqueredCount,
      interruptedCount,
      unloggedCount,
      longestFlawlessStreak,
      rankedSaboteurs,
      maxBreaks,
      totalPoints,
      nextMilestone,
      rangeTitle,
      canGoForward: pageOffset < 0 || endStr < todayStr,
      canGoBackward: true,
    };
  }, [habits, jumboDates, pageOffset]);
};

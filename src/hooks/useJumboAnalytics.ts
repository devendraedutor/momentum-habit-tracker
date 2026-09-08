import { useMemo } from 'react';
import type { Habit } from '../types/habit';
import { getTodayString, parseDateString, formatDate, formatDisplayDate, getDateRange } from '../lib/momentum';

export type JumboHistoryRange = '30d' | '60d' | '90d';

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

export interface BossHabitInfo {
  id: string;
  name: string;
  icon: string;
  color?: string;
  fails: number;
  ruinShare: number;
}

export interface DeficitStats {
  cleanCount: number;
  cleanPercent: number;
  nearMissCount: number;
  nearMissPercent: number;
  collapseCount: number;
  collapsePercent: number;
}

export interface StreakRaceStats {
  currentStreak: number;
  bestStreak: number;
  progressRatio: number;
  isNewRecord: boolean;
}

export interface JumboAnalytics {
  days: DayJumboStatus[];
  conqueredCount: number;
  failedCount: number;
  unloggedCount: number;
  totalPoints: number;
  rangeTitle: string;
  streakStats: StreakRaceStats;
  deficitStats: DeficitStats;
  bossHabit: BossHabitInfo | null;
}

function computeCurrentStreak(dates: string[]): number {
  if (!dates || dates.length === 0) return 0;
  const set = new Set(dates);
  const today = parseDateString(getTodayString());
  const todayKey = formatDate(today);

  let streak = 0;
  const curr = new Date(today);

  if (set.has(todayKey)) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  } else {
    curr.setDate(curr.getDate() - 1);
    if (!set.has(formatDate(curr))) {
      return 0;
    }
  }

  while (set.has(formatDate(curr))) {
    streak++;
    curr.setDate(curr.getDate() - 1);
  }

  return streak;
}

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
  historyRange: JumboHistoryRange = '30d',
  weekOffset: number = 0
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
    const anchorDate = parseDateString(latestRecordedDate);

    // Apply week offset pagination
    anchorDate.setDate(anchorDate.getDate() + weekOffset * 7);

    // Determine calendar span based on range filter
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

    const startStr = formatDate(start);
    const endStr = formatDate(alignedEnd);
    const dateRangeList = getDateRange(startStr, endStr);

    const jumboSet = new Set(jumboDates);

    let conqueredCount = 0;
    let failedCount = 0;
    let unloggedCount = 0;

    const habitFailCounts: Record<string, { habit: Habit; fails: number }> = {};
    activeHabits.forEach((h) => {
      habitFailCounts[h.id] = { habit: h, fails: 0 };
    });

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

      activeHabits.forEach((habit) => {
        const rawStatus = habit.history?.[dateKey];
        const status = rawStatus as string | undefined;

        if (status === 'done' || status === 'controlled') {
          completedHabitsCount++;
        } else if (status === 'failed' || status === 'missed') {
          failedHabits.push({
            id: habit.id,
            name: habit.name,
            icon: habit.icon,
            color: habit.color,
            status: 'Failed',
          });
          if (habitFailCounts[habit.id]) {
            habitFailCounts[habit.id].fails += 1;
          }
        }
      });

      const isPerfect =
        jumboSet.has(dateKey) ||
        (activeHabits.length > 0 && completedHabitsCount === activeHabits.length && failedHabits.length === 0);

      const isBroken = !isPerfect && failedHabits.length > 0;
      const isIncomplete = !isPerfect && !isBroken && !isFuture;

      if (isPerfect) conqueredCount++;
      else if (isBroken) failedCount++;
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

    const totalPoints = Math.max(jumboDates.length, conqueredCount);

    // Range display string (e.g. "Sep 28 – Oct 25, 2026")
    const startFormatted = formatDisplayDate(startStr);
    const endFormatted = formatDisplayDate(endStr, true);
    const rangeTitle = `${startFormatted} – ${endFormatted}`;

    // 1. Streak Race Stats
    const currentStreak = computeCurrentStreak(jumboDates);
    const bestStreak = computeLongestFlawlessStreak(jumboDates);
    const progressRatio = Math.min(100, Math.round((currentStreak / Math.max(bestStreak, 1)) * 100));
    const isNewRecord = currentStreak >= bestStreak && currentStreak > 0;

    const streakStats: StreakRaceStats = {
      currentStreak,
      bestStreak,
      progressRatio,
      isNewRecord,
    };

    // 2. Clean Sheet Deficit Stats (Single Slip-Up Reality)
    let cleanDays = 0;
    let nearMissDays = 0;
    let collapseDays = 0;

    days.forEach((day) => {
      if (day.isPerfect) {
        cleanDays++;
      } else if (day.failedHabits.length === 1) {
        nearMissDays++;
      } else if (day.failedHabits.length >= 2) {
        collapseDays++;
      }
    });

    const totalTracked = cleanDays + nearMissDays + collapseDays;
    const deficitStats: DeficitStats = {
      cleanCount: cleanDays,
      cleanPercent: totalTracked > 0 ? Math.round((cleanDays / totalTracked) * 100) : 0,
      nearMissCount: nearMissDays,
      nearMissPercent: totalTracked > 0 ? Math.round((nearMissDays / totalTracked) * 100) : 0,
      collapseCount: collapseDays,
      collapsePercent: totalTracked > 0 ? Math.round((collapseDays / totalTracked) * 100) : 0,
    };

    // 3. Habit Boss Fight (Highest failure count habit)
    const rankedBosses = Object.values(habitFailCounts)
      .filter((b) => b.fails > 0)
      .sort((a, b) => b.fails - a.fails);

    let bossHabit: BossHabitInfo | null = null;
    if (rankedBosses.length > 0) {
      const topBoss = rankedBosses[0];
      const totalFails = failedCount || 1;
      const ruinShare = Math.round((topBoss.fails / totalFails) * 100);
      bossHabit = {
        id: topBoss.habit.id,
        name: topBoss.habit.name,
        icon: topBoss.habit.icon,
        color: topBoss.habit.color,
        fails: topBoss.fails,
        ruinShare: Math.min(100, Math.max(1, ruinShare)),
      };
    }

    return {
      days,
      conqueredCount,
      failedCount,
      unloggedCount,
      totalPoints,
      rangeTitle,
      streakStats,
      deficitStats,
      bossHabit,
    };
  }, [habits, jumboDates, historyRange, weekOffset]);
};

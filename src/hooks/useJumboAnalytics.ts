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

export interface HabitSaboteurItem {
  id: string;
  name: string;
  icon: string;
  color?: string;
  ruinedCount: number;
  leakPercentage: number;
  isTopBoss: boolean;
}

export interface JumboAnalytics {
  days: DayJumboStatus[];
  conqueredCount: number;
  failedCount: number;
  unloggedCount: number;
  totalPoints: number;
  rangeTitle: string;
  saboteurRanking: HabitSaboteurItem[];
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

    const habitFailCounts: Record<string, number> = {};
    activeHabits.forEach((h) => {
      habitFailCounts[h.id] = 0;
    });

    const days: DayJumboStatus[] = dateRangeList.map((dateKey) => {
      const dateObj = parseDateString(dateKey);
      const dayNum = dateObj.getDate();
      const monthShort = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
      const weekdayShort = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const displayDate = formatDisplayDate(dateKey);
      const isToday = dateKey === todayStr;
      const isFuture = dateKey > todayStr;

      const habitsActiveOnDate = activeHabits.filter((h) => {
        const sDate = h.startDate || (h.createdAt ? h.createdAt.split('T')[0] : todayStr);
        return sDate <= dateKey;
      });

      const failedHabits: { id: string; name: string; icon: string; color?: string; status: string }[] = [];
      let completedHabitsCount = 0;

      habitsActiveOnDate.forEach((habit) => {
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
          habitFailCounts[habit.id] = (habitFailCounts[habit.id] || 0) + 1;
        }
      });

      const isPerfect =
        jumboSet.has(dateKey) ||
        (habitsActiveOnDate.length > 0 &&
          completedHabitsCount === habitsActiveOnDate.length &&
          failedHabits.length === 0);

      const isBroken = !isPerfect && failedHabits.length > 0;
      const isIncomplete =
        !isPerfect &&
        !isBroken &&
        !isFuture &&
        habitsActiveOnDate.length > 0 &&
        completedHabitsCount < habitsActiveOnDate.length;

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
        totalActiveHabitsCount: habitsActiveOnDate.length,
      };
    });

    const totalPoints = jumboDates.length;

    // Range display string (e.g. "Sep 28 – Oct 25, 2026")
    const startFormatted = formatDisplayDate(startStr);
    const endFormatted = formatDisplayDate(endStr, true);
    const rangeTitle = `${startFormatted} – ${endFormatted}`;

    // Expanded Habit Saboteur Ranking
    const totalJumboFailedDaysInWindow = failedCount;
    const saboteurRanking: HabitSaboteurItem[] = activeHabits
      .map((habit) => {
        const ruinedCount = habitFailCounts[habit.id] || 0;
        const leakPercentage =
          totalJumboFailedDaysInWindow > 0
            ? Math.min(100, Math.round((ruinedCount / totalJumboFailedDaysInWindow) * 100))
            : 0;

        return {
          id: habit.id,
          name: habit.name,
          icon: habit.icon,
          color: habit.color,
          ruinedCount,
          leakPercentage,
          isTopBoss: false,
        };
      })
      .sort((a, b) => b.ruinedCount - a.ruinedCount || a.name.localeCompare(b.name));

    // Mark top boss if ruinedCount > 0
    if (saboteurRanking.length > 0 && saboteurRanking[0].ruinedCount > 0) {
      saboteurRanking[0].isTopBoss = true;
    }

    return {
      days,
      conqueredCount,
      failedCount,
      unloggedCount,
      totalPoints,
      rangeTitle,
      saboteurRanking,
    };
  }, [habits, jumboDates, historyRange, weekOffset]);
};

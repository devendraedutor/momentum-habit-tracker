import type { Habit, DailyMomentumPoint, HabitStats, ChartTimeRange, CheckInStatus } from '../types/habit';

export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayString(): string {
  return formatDate(new Date());
}

export function parseDateString(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDisplayDate(dateStr: string, includeYear = false): string {
  const date = parseDateString(dateStr);
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    ...(includeYear ? { year: 'numeric' } : {})
  };
  return date.toLocaleDateString('en-US', options);
}

export function getDateRange(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  const current = parseDateString(startDateStr);
  const end = parseDateString(endDateStr);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

export function getEffectiveEndDate(habits: Habit[] | Habit): string {
  const todayStr = getTodayString();
  const habitList = Array.isArray(habits) ? habits : [habits];
  
  let latestDate = todayStr;
  habitList.forEach((h) => {
    const dates = Object.keys(h.history || {});
    dates.forEach((d) => {
      if (d > latestDate) latestDate = d;
    });
  });

  return latestDate;
}

export function getEffectiveStartDate(habits: Habit[] | Habit): string {
  const todayStr = getTodayString();
  const habitList = Array.isArray(habits) ? habits : [habits];
  
  let earliestDate = todayStr;
  habitList.forEach((h) => {
    if (h.createdAt && h.createdAt < earliestDate) earliestDate = h.createdAt;
    const dates = Object.keys(h.history || {});
    dates.forEach((d) => {
      if (d < earliestDate) earliestDate = d;
    });
  });

  return earliestDate;
}

export function getStartDateForRange(
  range: ChartTimeRange,
  endDateStr: string,
  earliestCreatedOrLogged?: string
): string {
  const endDate = parseDateString(endDateStr);
  const target = new Date(endDate);

  switch (range) {
    case '7d':
      target.setDate(endDate.getDate() - 6);
      return formatDate(target);
    case '30d':
      target.setDate(endDate.getDate() - 29);
      return formatDate(target);
    case '90d':
      target.setDate(endDate.getDate() - 89);
      return formatDate(target);
    case 'all': {
      if (earliestCreatedOrLogged) {
        const earliestDate = parseDateString(earliestCreatedOrLogged);
        const daysDiff = Math.ceil((endDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
          target.setDate(endDate.getDate() - 6);
          return formatDate(target);
        }
        return earliestCreatedOrLogged;
      }
      target.setDate(endDate.getDate() - 29);
      return formatDate(target);
    }
  }
}

export function calculateHabitTrajectory(
  habit: Habit,
  range: ChartTimeRange = '30d',
  floorAtZero = false
): DailyMomentumPoint[] {
  const endDateStr = getEffectiveEndDate(habit);
  const earliestCreatedOrLogged = getEffectiveStartDate(habit);
  const startDateStr = getStartDateForRange(range, endDateStr, earliestCreatedOrLogged);

  // Simulation begins at earliest date in history or start date
  const simulationStart = earliestCreatedOrLogged < startDateStr ? earliestCreatedOrLogged : startDateStr;
  const allSimulationDates = getDateRange(simulationStart, endDateStr);

  let runningScore = 0;
  const fullTimeSeries = new Map<string, { score: number; delta: number; status: CheckInStatus }>();

  for (const date of allSimulationDates) {
    const status = habit.history[date] || 'none';
    let delta = 0;

    if (status === 'done') {
      delta = 1;
    } else if (status === 'missed') {
      delta = -1;
    }

    runningScore += delta;
    if (floorAtZero && runningScore < 0) {
      runningScore = 0;
    }

    fullTimeSeries.set(date, {
      score: runningScore,
      delta,
      status,
    });
  }

  const visibleDates = getDateRange(startDateStr, endDateStr);
  return visibleDates.map((date) => {
    const point = fullTimeSeries.get(date) || {
      score: runningScore,
      delta: 0,
      status: 'none' as CheckInStatus,
    };
    return {
      date,
      displayDate: formatDisplayDate(date),
      score: point.score,
      delta: point.delta,
      status: point.status,
    };
  });
}

export function calculateAggregateTrajectory(
  habits: Habit[],
  range: ChartTimeRange = '30d',
  floorAtZero = false
): DailyMomentumPoint[] {
  if (habits.length === 0) return [];

  const activeHabits = habits.filter((h) => !h.archived);
  if (activeHabits.length === 0) return [];

  const endDateStr = getEffectiveEndDate(activeHabits);
  const earliestCreatedOrLogged = getEffectiveStartDate(activeHabits);
  const startDateStr = getStartDateForRange(range, endDateStr, earliestCreatedOrLogged);
  const visibleDates = getDateRange(startDateStr, endDateStr);

  const trajectories = activeHabits.map((h) => calculateHabitTrajectory(h, range, floorAtZero));

  return visibleDates.map((date, idx) => {
    let totalScore = 0;
    let totalDelta = 0;

    trajectories.forEach((traj) => {
      const point = traj[idx];
      if (point) {
        totalScore += point.score;
        totalDelta += point.delta;
      }
    });

    return {
      date,
      displayDate: formatDisplayDate(date),
      score: totalScore,
      delta: totalDelta,
      status: totalDelta > 0 ? 'done' : totalDelta < 0 ? 'missed' : 'none',
    };
  });
}

export function calculateHabitStats(habit: Habit, floorAtZero = false): HabitStats {
  const endDateStr = getEffectiveEndDate(habit);
  const trajectory = calculateHabitTrajectory(habit, 'all', floorAtZero);

  let totalDone = 0;
  let totalMissed = 0;
  let highestScore = 0;
  let lowestScore = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  trajectory.forEach((pt) => {
    if (pt.score > highestScore) highestScore = pt.score;
    if (pt.score < lowestScore) lowestScore = pt.score;
    if (pt.status === 'done') {
      totalDone++;
      tempStreak++;
      if (tempStreak > bestStreak) bestStreak = tempStreak;
    } else if (pt.status === 'missed') {
      totalMissed++;
      tempStreak = 0;
    }
  });

  const baseScore = trajectory.length > 0 ? trajectory[trajectory.length - 1].score : 0;
  const currentScore = baseScore + (habit.bonusXP || 0);
  if (currentScore > highestScore) highestScore = currentScore;

  // Calculate current active streak backwards from the latest effective date
  let currentStreak = 0;
  const allDatesDesc = getDateRange(getEffectiveStartDate(habit), endDateStr).reverse();

  for (let i = 0; i < allDatesDesc.length; i++) {
    const d = allDatesDesc[i];
    const status = habit.history[d];

    // If today is not logged yet at index 0, check from yesterday
    if (i === 0 && (!status || status === 'none')) {
      continue;
    }

    if (status === 'done') {
      currentStreak++;
    } else if (status === 'missed') {
      break; // missed breaks streak
    } else {
      break; // unlogged past day breaks streak
    }
  }

  const totalLogged = totalDone + totalMissed;
  const completionRate = totalLogged > 0 ? Math.round((totalDone / totalLogged) * 100) : 0;

  const last7Days = trajectory.slice(-7);
  const weeklyVelocity = last7Days.reduce((acc, curr) => acc + curr.delta, 0);

  // Target Days calculation (handles both continuous ascension and restarted streaks)
  const targetGoalDays = habit.targetGoalDays || 21;
  const tierStartStreak = habit.tierStartStreak || 0;
  let currentGoalStreak = 0;
  if (currentStreak === 0) {
    currentGoalStreak = 0;
  } else if (tierStartStreak > 0 && currentStreak >= tierStartStreak) {
    currentGoalStreak = currentStreak - tierStartStreak;
  } else {
    // If streak was broken and restarted below tierStartStreak, progress counts up with current active streak
    currentGoalStreak = currentStreak;
  }
  const goalDaysRemaining = Math.max(0, targetGoalDays - currentGoalStreak);
  const goalProgressPercent = Math.min(100, Math.round((currentGoalStreak / targetGoalDays) * 100));
  const goalAchieved = currentGoalStreak >= targetGoalDays && currentStreak > 0;

  return {
    currentScore,
    highestScore,
    lowestScore,
    currentStreak,
    bestStreak,
    totalDone,
    totalMissed,
    completionRate,
    weeklyVelocity,
    targetGoalDays,
    currentGoalStreak,
    goalDaysRemaining,
    goalProgressPercent,
    goalAchieved,
  };
}

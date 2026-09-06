import type { Habit, CheckInStatus } from '../types/habit';

export interface StreakTier {
  level: number;
  days: number;
  name: string;
  tag: string;
}

export const LEVEL_REQUIREMENTS: Record<number, number> = {
  1: 3,    // Level 0 -> Level 1 requires 3 clean days
  2: 7,    // Level 1 -> Level 2 requires 7 clean days
  3: 14,   // Level 2 -> Level 3 requires 14 clean days
  4: 30,   // Level 3 -> Level 4 requires 30 clean days
  5: 60,   // Level 4 -> Level 5 requires 60 clean days
  6: 120,  // Level 5 -> Level 6 requires 120 clean days
  7: 365,  // Level 6 -> Level 7 requires 365 clean days
};

export const STREAK_TIERS: StreakTier[] = [
  { level: 1, days: 3, name: 'Spark', tag: 'Spark' },
  { level: 2, days: 7, name: 'Momentum', tag: 'Momentum' },
  { level: 3, days: 14, name: 'Consistency', tag: 'Consistency' },
  { level: 4, days: 30, name: 'Discipline', tag: 'Discipline' },
  { level: 5, days: 60, name: 'Master', tag: 'Master' },
  { level: 6, days: 120, name: 'Iron Will', tag: 'Iron Will' },
  { level: 7, days: 365, name: 'Unbreakable', tag: 'Unbreakable' },
];

export const DEFAULT_START_TARGET_DAYS = LEVEL_REQUIREMENTS[1]; // 3 Days

export function getRequiredDaysForLevel(targetLevel: number): number {
  const safeLevel = Math.max(1, Math.min(7, targetLevel));
  return LEVEL_REQUIREMENTS[safeLevel] || 365;
}

export function getTargetGoalForHabit(currentLevel: number = 0): number {
  const nextLevel = Math.min(7, (currentLevel || 0) + 1);
  return getRequiredDaysForLevel(nextLevel);
}

export function getTierByLevel(level: number): StreakTier {
  const safeLevel = Math.max(1, Math.min(7, level));
  const found = STREAK_TIERS.find((t) => t.level === safeLevel);
  return found || STREAK_TIERS[0];
}

export function getTierByDays(days: number): StreakTier {
  const found = STREAK_TIERS.find((t) => t.days === days);
  if (found) return found;
  for (let i = STREAK_TIERS.length - 1; i >= 0; i--) {
    if (days >= STREAK_TIERS[i].days) {
      return STREAK_TIERS[i];
    }
  }
  return STREAK_TIERS[0];
}

export type HabitCheckStatus = CheckInStatus | 'controlled' | 'failed' | 'pending';

function isStatusSuccess(status?: string): boolean {
  return status === 'done' || status === 'controlled';
}

function isStatusFailure(status?: string): boolean {
  return status === 'missed' || status === 'failed';
}

/**
 * Pure Progression & Failure State Engine for Habit Check-Ins:
 * 
 * 1. Levels are permanent checkpoints (No Level Downgrade, unless flipping the exact day the level was unlocked).
 * 2. Current Level Progress is an ALL-OR-NOTHING Sprint:
 *    - If at ANY point a day is marked as Missed or Failed, levelProgress WIPES TO 0.
 * 3. Reset to Pending (Unchecking a Done):
 *    - Decrements levelProgress by 1, or rolls back level if just achieved.
 */
export const updateHabitStatus = (
  habit: Habit,
  newStatus: HabitCheckStatus,
  previousStatus: HabitCheckStatus = 'none'
): Habit => {
  const currentLevel = Math.max(0, Math.min(7, habit.currentLevel ?? 0));
  const currentProgress = Math.max(0, habit.levelProgress ?? 0);
  const wasJustLeveledUpOnThisDay = isStatusSuccess(previousStatus) && currentProgress === 0 && currentLevel > 0;

  const isSuccess = isStatusSuccess(newStatus);
  const isFailure = isStatusFailure(newStatus);

  // CASE 1: USER FAILS OR MISSES A DAY -> COMPLETE SPRINT WIPE TO 0
  if (isFailure) {
    if (wasJustLeveledUpOnThisDay && currentLevel > 0) {
      const rolledLevel = currentLevel - 1;
      return {
        ...habit,
        currentLevel: rolledLevel,
        levelProgress: 0, // Wipe progress completely back to zero
        targetGoalDays: getTargetGoalForHabit(rolledLevel),
        currentTier: rolledLevel + 1,
        milestonesCompleted: rolledLevel,
      };
    }

    // Normal miss mid-sprint: Keep achieved checkpoint, but completely wipe running sprint to 0
    return {
      ...habit,
      currentLevel,
      levelProgress: 0, // MUST BE ZERO (all-or-nothing sprint)
      targetGoalDays: getTargetGoalForHabit(currentLevel),
    };
  }

  // CASE 2: USER MARKS DAY AS DONE / CONTROLLED
  if (isSuccess) {
    if (isStatusSuccess(previousStatus)) {
      return habit; // No change
    }

    const nextLevel = Math.min(7, currentLevel + 1);
    const requiredDays = getRequiredDaysForLevel(nextLevel);
    const nextProgress = currentProgress + 1;

    if (nextProgress >= requiredDays) {
      // Milestone Achieved -> Level Up!
      const newLevel = nextLevel;
      return {
        ...habit,
        currentLevel: newLevel,
        levelProgress: 0, // Fresh start for next level sprint
        targetGoalDays: getTargetGoalForHabit(newLevel),
        currentTier: newLevel + 1,
        milestonesCompleted: newLevel,
      };
    }

    return {
      ...habit,
      levelProgress: nextProgress,
      targetGoalDays: requiredDays,
    };
  }

  // CASE 3: RESET TO PENDING / NONE / SKIPPED (UNCHECKED)
  if (!isSuccess && !isFailure) {
    if (isStatusSuccess(previousStatus)) {
      if (wasJustLeveledUpOnThisDay && currentLevel > 0) {
        const rolledLevel = currentLevel - 1;
        const prevTarget = LEVEL_REQUIREMENTS[currentLevel] || 3;
        return {
          ...habit,
          currentLevel: rolledLevel,
          levelProgress: Math.max(0, prevTarget - 1),
          targetGoalDays: getTargetGoalForHabit(rolledLevel),
          currentTier: rolledLevel + 1,
          milestonesCompleted: rolledLevel,
        };
      }
      return {
        ...habit,
        levelProgress: Math.max(0, currentProgress - 1),
      };
    }
    return habit;
  }

  return habit;
};

/**
 * Pure Progression Evaluator for Check-In Events with Two-Way Synchronization
 */
export function evaluateCheckInProgression(
  habit: { currentLevel?: number; levelProgress?: number; overallStreak?: number },
  newStatus: HabitCheckStatus,
  previousStatus?: HabitCheckStatus
): {
  newCurrentLevel: number;
  newLevelProgress: number;
  targetDays: number;
  leveledUp: boolean;
  unlockedLevel: number | null;
} {
  const currentLevel = Math.max(0, Math.min(7, habit.currentLevel ?? 0));
  const currentProgress = Math.max(0, habit.levelProgress ?? 0);
  const nextLevel = Math.min(7, currentLevel + 1);
  const requiredDays = getRequiredDaysForLevel(nextLevel);

  const prev = previousStatus || 'none';
  const next = newStatus || 'none';

  // No change in status
  if (prev === next) {
    return {
      newCurrentLevel: currentLevel,
      newLevelProgress: currentProgress,
      targetDays: requiredDays,
      leveledUp: false,
      unlockedLevel: null,
    };
  }

  // 1. CASE: USER FAILS OR MISSES A DAY -> COMPLETE SPRINT WIPE TO 0
  if (isStatusFailure(next)) {
    const wasJustLeveledUp = isStatusSuccess(prev) && currentProgress === 0 && currentLevel > 0;
    if (wasJustLeveledUp) {
      const rolledLevel = currentLevel - 1;
      return {
        newCurrentLevel: rolledLevel,
        newLevelProgress: 0, // MUST BE ZERO
        targetDays: getTargetGoalForHabit(rolledLevel),
        leveledUp: false,
        unlockedLevel: null,
      };
    }

    return {
      newCurrentLevel: currentLevel,
      newLevelProgress: 0, // MUST BE ZERO (complete sprint reset)
      targetDays: requiredDays,
      leveledUp: false,
      unlockedLevel: null,
    };
  }

  // 2. CASE: USER MARKS DAY AS DONE / CONTROLLED
  if (isStatusSuccess(next)) {
    const nextProg = currentProgress + 1;
    if (nextProg >= requiredDays) {
      // Milestone Achieved -> Level Up!
      const newLevel = nextLevel;
      const nextTargetDays = getTargetGoalForHabit(newLevel);
      return {
        newCurrentLevel: newLevel,
        newLevelProgress: 0, // Fresh start for next sprint
        targetDays: nextTargetDays,
        leveledUp: true,
        unlockedLevel: newLevel,
      };
    } else {
      return {
        newCurrentLevel: currentLevel,
        newLevelProgress: nextProg,
        targetDays: requiredDays,
        leveledUp: false,
        unlockedLevel: null,
      };
    }
  }

  // 3. CASE: RESET TO PENDING / NONE / SKIPPED (UNCHECKING)
  if (!isStatusSuccess(next) && !isStatusFailure(next)) {
    if (isStatusSuccess(prev)) {
      const wasJustLeveledUp = currentProgress === 0 && currentLevel > 0;
      if (wasJustLeveledUp) {
        const rolledLevel = currentLevel - 1;
        const prevTarget = LEVEL_REQUIREMENTS[currentLevel] || 3;
        return {
          newCurrentLevel: rolledLevel,
          newLevelProgress: Math.max(0, prevTarget - 1),
          targetDays: getTargetGoalForHabit(rolledLevel),
          leveledUp: false,
          unlockedLevel: null,
        };
      }
      return {
        newCurrentLevel: currentLevel,
        newLevelProgress: Math.max(0, currentProgress - 1),
        targetDays: requiredDays,
        leveledUp: false,
        unlockedLevel: null,
      };
    }
  }

  // Fallback
  return {
    newCurrentLevel: currentLevel,
    newLevelProgress: currentProgress,
    targetDays: requiredDays,
    leveledUp: false,
    unlockedLevel: null,
  };
}

/**
 * Central rollback helper:
 * When moving from a successful state (Done/Controlled) to an unsuccessful state (Missed/Failed/Pending/None)
 */
export const rollbackHabitProgress = (
  habit: Habit,
  previousStatus?: string,
  newStatus?: string
): Habit => {
  return updateHabitStatus(
    habit,
    (newStatus || 'none') as HabitCheckStatus,
    (previousStatus || 'none') as HabitCheckStatus
  );
};

/**
 * Recomputes clean progression deterministically from a habit's full chronological history.
 */
export function recalculateHabitProgressionFromHistory(
  habit: Habit
): {
  currentLevel: number;
  levelProgress: number;
  targetGoalDays: number;
} {
  const dates = Object.keys(habit.history || {}).sort();
  let currentLevel = 0;
  let levelProgress = 0;

  for (const dateStr of dates) {
    const status = habit.history[dateStr];
    if (isStatusSuccess(status)) {
      const nextLevel = Math.min(7, currentLevel + 1);
      const required = getRequiredDaysForLevel(nextLevel);
      const nextProg = levelProgress + 1;
      if (nextProg >= required) {
        currentLevel = nextLevel;
        levelProgress = 0;
      } else {
        levelProgress = nextProg;
      }
    } else if (isStatusFailure(status)) {
      levelProgress = 0; // Completely wiped back to 0 on any miss
    }
  }

  const targetDays = getTargetGoalForHabit(currentLevel);
  return {
    currentLevel,
    levelProgress,
    targetGoalDays: targetDays,
  };
}

/**
 * Computes UI metrics for a habit's active level and sprint progress.
 */
export function getSprintStats(
  currentStreak: number,
  habitCurrentLevel: number = 0,
  habitLevelProgress?: number,
  _milestonesCompleted?: number
) {
  const currentLevel = Math.max(0, Math.min(7, habitCurrentLevel ?? 0));
  const nextLevel = Math.min(7, currentLevel + 1);
  const targetDays = getRequiredDaysForLevel(nextLevel);
  const nextTier = getTierByLevel(nextLevel);

  // Use explicit levelProgress if defined, otherwise derive from currentStreak
  const effectiveProgress = habitLevelProgress !== undefined
    ? habitLevelProgress
    : Math.min(targetDays, currentStreak);

  const currentGoalStreak = Math.max(0, Math.min(targetDays, effectiveProgress));
  const goalDaysRemaining = Math.max(0, targetDays - currentGoalStreak);
  const goalProgressPercent = Math.min(100, Math.round((currentGoalStreak / targetDays) * 100));
  const goalAchieved = currentGoalStreak >= targetDays && targetDays > 0;

  return {
    activeTier: nextTier,
    activeTierLevel: nextLevel,
    targetGoalDays: targetDays,
    currentGoalStreak,
    goalDaysRemaining,
    goalProgressPercent,
    goalAchieved,
    achievedLevel: currentLevel,
    currentLevel,
  };
}

/**
 * Backward compatibility helpers
 */
export function getActiveTier(habit: { currentLevel?: number; currentTier?: number }): StreakTier {
  const currentLevel = habit.currentLevel ?? (habit.currentTier ? habit.currentTier - 1 : 0);
  const nextLevel = Math.min(7, currentLevel + 1);
  return getTierByLevel(nextLevel);
}

export function getNextTier(habit: { currentLevel?: number; currentTier?: number }): StreakTier {
  const currentLevel = habit.currentLevel ?? (habit.currentTier ? habit.currentTier - 1 : 0);
  const nextLevel = Math.min(7, currentLevel + 1);
  return getTierByLevel(Math.min(7, nextLevel + 1));
}

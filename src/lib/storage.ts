import type { Habit, UserSettings, ExportData } from '../types/habit';
import { getActiveSessionUserId } from '../config/testers';
import { getTargetGoalForHabit, recalculateHabitProgressionFromHistory } from '../config/progression';
import {
  formatDate,
  getTodayString,
  parseDateString,
  formatDisplayDate,
  getDateRange,
} from './momentum';

export const DEFAULT_SETTINGS: UserSettings = {
  soundEffects: true,
  confetti: true,
  floorAtZero: false,
  autoMarkMissedPastDays: false,
  theme: 'light',
};

export const DEFAULT_CATEGORIES: string[] = [
  'Productivity',
  'Health & Fitness',
  'Learning',
  'Mindset',
  'Lifestyle',
];

const DUMMY_HABIT_NAMES = [
  'Deep Work & Coding',
  'Morning Workout & Cardio',
  'Read 20 Pages Non-Fiction',
  'Evening Screen-Free Wind Down',
];

/**
 * Resolves namespaced localStorage key for the given domain and active tester.
 */
export function getStorageKey(domain: 'habits' | 'settings' | 'categories' | 'jumbo_wallet' | 'checkins', userId?: string): string {
  const activeUser = userId || getActiveSessionUserId() || 'guest';
  return `${activeUser}__${domain}`;
}

/**
 * Load user habits strictly from namespaced storage.
 */
export function loadHabitsFromStorage(userId?: string): Habit[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getStorageKey('habits', userId);
    let raw = localStorage.getItem(key);
    
    // Check legacy key for migration if namespaced key is empty
    if (!raw) {
      const legacyRaw = localStorage.getItem('momentum_habits_v1');
      if (legacyRaw) {
        raw = legacyRaw;
        // Seed the namespaced key with existing legacy habits
        localStorage.setItem(key, legacyRaw);
      }
    }

    if (!raw) return [];
    
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Filter out dummy/demo habits
    const userHabits: Habit[] = parsed
      .filter((h: Habit) => {
        if (!h || !h.id) return false;
        if (h.id.startsWith('demo-habit-')) return false;
        if (DUMMY_HABIT_NAMES.includes(h.name) && Object.keys(h.history || {}).length > 10) return false;
        return true;
      })
      .map((h: Habit) => {
        const historyDates = Object.keys(h.history || {}).sort();
        const earliestHistory = historyDates.length > 0 ? historyDates[0] : undefined;
        const createdDate = h.createdAt ? h.createdAt.split('T')[0] : undefined;
        const resolvedStartDate = h.startDate || earliestHistory || createdDate || new Date().toISOString().split('T')[0];

        // Smart progression migration for existing / live users:
        // Evaluates clean consecutive completion history to instantly award Level 1+ (3+ clean days)
        const historyProg = recalculateHabitProgressionFromHistory(h);
        let resolvedCurrentLevel = h.currentLevel ?? (h.currentTier ? Math.max(0, h.currentTier - 1) : 0);
        let resolvedProgress = h.levelProgress ?? 0;

        if (resolvedCurrentLevel === 0 && historyProg.currentLevel > 0) {
          resolvedCurrentLevel = historyProg.currentLevel;
          resolvedProgress = historyProg.levelProgress;
        } else if (h.currentLevel === undefined && h.levelProgress === undefined) {
          resolvedCurrentLevel = historyProg.currentLevel;
          resolvedProgress = historyProg.levelProgress;
        }

        const resolvedTarget = getTargetGoalForHabit(resolvedCurrentLevel);

        return {
          ...h,
          currentLevel: resolvedCurrentLevel,
          levelProgress: resolvedProgress,
          currentTier: resolvedCurrentLevel + 1,
          targetGoalDays: resolvedTarget,
          startDate: resolvedStartDate,
          type: (h.type === 'BREAK' || (h.name && h.name.toLowerCase() === 'porn watching') ? 'BREAK' : 'BUILD') as 'BUILD' | 'BREAK',
          archived: Boolean(h.archived),
        };
      });

    return userHabits;
  } catch (err) {
    console.error('Failed to load habits from storage:', err);
    return [];
  }
}

export function saveHabitsToStorage(habits: Habit[], userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey('habits', userId);
    localStorage.setItem(key, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits to storage:', err);
  }
}

export function loadCategoriesFromStorage(userId?: string): string[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const key = getStorageKey('categories', userId);
    const raw = localStorage.getItem(key);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategoriesToStorage(categories: string[], userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey('categories', userId);
    localStorage.setItem(key, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

export function loadSettingsFromStorage(userId?: string): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const key = getStorageKey('settings', userId);
    let raw = localStorage.getItem(key);
    if (!raw) {
      const legacyRaw = localStorage.getItem('momentum_settings_v1');
      if (legacyRaw) {
        raw = legacyRaw;
        localStorage.setItem(key, legacyRaw);
      }
    }
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: UserSettings, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey('settings', userId);
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * Load list of dates where a Jumbo Point was awarded (100% habit completion).
 */
export function loadJumboDatesFromStorage(userId?: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getStorageKey('jumbo_wallet', userId);
    let raw = localStorage.getItem(key);
    if (!raw) {
      const legacyRaw = localStorage.getItem('momentum_jumbo_wallet');
      if (legacyRaw) {
        raw = legacyRaw;
        localStorage.setItem(key, legacyRaw);
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJumboDatesToStorage(dates: string[], userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getStorageKey('jumbo_wallet', userId);
    localStorage.setItem(key, JSON.stringify(dates));
  } catch (err) {
    console.error('Failed to save jumbo dates:', err);
  }
}

export interface PendingAuditItem {
  dateKey: string;      // YYYY-MM-DD
  displayDate: string;  // e.g. "Sep 5, 2026"
  pendingHabits: { id: string; name: string; icon: string; color?: string }[];
}

/**
 * Collects all historical dates up to yesterday where active habits remain unlogged or pending.
 */
export function getHistoricalPendingBacklog(habits: Habit[]): PendingAuditItem[] {
  const backlog: PendingAuditItem[] = [];
  const todayKey = getTodayString();
  const today = parseDateString(todayKey);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yesterdayKey = formatDate(yesterday);

  const activeHabits = habits.filter((h) => !h.archived);
  if (activeHabits.length === 0) return [];

  let earliestDate = todayKey;
  activeHabits.forEach((h) => {
    const sDate = h.startDate || (h.createdAt ? h.createdAt.split('T')[0] : todayKey);
    if (sDate < earliestDate) earliestDate = sDate;
    Object.keys(h.history || {}).forEach((d) => {
      if (d < earliestDate) earliestDate = d;
    });
  });

  if (earliestDate > yesterdayKey) return [];

  const allDates = getDateRange(earliestDate, yesterdayKey);

  allDates.forEach((dateKey) => {
    const habitsActiveOnDate = activeHabits.filter((h) => {
      const sDate = h.startDate || (h.createdAt ? h.createdAt.split('T')[0] : todayKey);
      return sDate <= dateKey;
    });

    if (habitsActiveOnDate.length === 0) return;

    const pendingHabitsOnDate: { id: string; name: string; icon: string; color?: string }[] = [];

    habitsActiveOnDate.forEach((h) => {
      const st = h.history?.[dateKey];
      if (!st || st === 'none') {
        pendingHabitsOnDate.push({
          id: h.id,
          name: h.name,
          icon: h.icon,
          color: h.color,
        });
      }
    });

    if (pendingHabitsOnDate.length > 0) {
      backlog.push({
        dateKey,
        displayDate: formatDisplayDate(dateKey, true),
        pendingHabits: pendingHabitsOnDate,
      });
    }
  });

  return backlog;
}

/**
 * Pure mathematical recalculation of all valid Jumbo Points across full recorded history.
 * Rule: A date earns a Jumbo Point iff >= 1 habit was active AND every active habit is 'done' or 'controlled'.
 */
export function recalculateAllJumboPoints(habits: Habit[]): string[] {
  const activeHabits = habits.filter((h) => !h.archived);
  if (activeHabits.length === 0) return [];

  const todayKey = getTodayString();
  let earliestDate = todayKey;
  let latestDate = todayKey;

  activeHabits.forEach((h) => {
    const sDate = h.startDate || (h.createdAt ? h.createdAt.split('T')[0] : todayKey);
    if (sDate < earliestDate) earliestDate = sDate;
    Object.keys(h.history || {}).forEach((d) => {
      if (d < earliestDate) earliestDate = d;
      if (d > latestDate) latestDate = d;
    });
  });

  const allDates = getDateRange(earliestDate, latestDate);
  const validJumboDates: string[] = [];

  allDates.forEach((dateKey) => {
    const habitsActiveOnDate = activeHabits.filter((h) => {
      const sDate = h.startDate || (h.createdAt ? h.createdAt.split('T')[0] : todayKey);
      return sDate <= dateKey;
    });

    if (habitsActiveOnDate.length === 0) return;

    const allPassed = habitsActiveOnDate.every((h) => {
      const st = h.history?.[dateKey];
      return st === 'done' || st === 'controlled';
    });

    if (allPassed) {
      validJumboDates.push(dateKey);
    }
  });

  return validJumboDates;
}

/**
 * Reconciles Jumbo Points for a given date based on current active habits.
 */
export function reconcileJumboDate(
  dateStr: string,
  activeHabits: Habit[],
  existingJumboDates: string[]
): { updatedJumboDates: string[]; isJumboNow: boolean; wasAwarded: boolean } {
  const applicableHabits = activeHabits.filter(
    (h) => !h.archived && (!h.startDate || h.startDate <= dateStr)
  );

  if (applicableHabits.length === 0) {
    const updatedJumboDates = existingJumboDates.filter((d) => d !== dateStr);
    return { updatedJumboDates, isJumboNow: false, wasAwarded: false };
  }

  const allDone = applicableHabits.every((h) => {
    const st = h.history[dateStr];
    return st === 'done' || st === 'controlled';
  });
  const alreadyHad = existingJumboDates.includes(dateStr);

  let updatedJumboDates = [...existingJumboDates];
  let wasAwarded = false;

  if (allDone && !alreadyHad) {
    updatedJumboDates.push(dateStr);
    wasAwarded = true;
  } else if (!allDone && alreadyHad) {
    updatedJumboDates = updatedJumboDates.filter((d) => d !== dateStr);
  }

  return {
    updatedJumboDates,
    isJumboNow: allDone,
    wasAwarded,
  };
}

export function exportBackupData(habits: Habit[], settings: UserSettings, jumboDates: string[] = [], userId?: string): string {
  const activeUser = userId || getActiveSessionUserId() || 'user';
  const exportData: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    habits,
    settings,
    jumboDates,
  };

  const jsonStr = JSON.stringify(exportData, null, 2);
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flux_${activeUser}_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return jsonStr;
}

export function generateDemoHabits(userId?: string): Habit[] {
  return loadHabitsFromStorage(userId);
}

export function importBackupData(jsonString: string): ExportData | null {
  try {
    const data = JSON.parse(jsonString);
    if (data && Array.isArray(data.habits)) {
      return data as ExportData;
    }
    return null;
  } catch (err) {
    console.error('Failed to parse import backup:', err);
    return null;
  }
}

/**
 * Clears all namespaced data for a specific user.
 */
export function clearUserStorage(userId?: string): void {
  if (typeof window === 'undefined') return;
  const activeUser = userId || getActiveSessionUserId() || 'guest';
  localStorage.removeItem(`${activeUser}__habits`);
  localStorage.removeItem(`${activeUser}__settings`);
  localStorage.removeItem(`${activeUser}__jumbo_wallet`);
  localStorage.removeItem(`${activeUser}__categories`);
  localStorage.removeItem(`${activeUser}__checkins`);
}

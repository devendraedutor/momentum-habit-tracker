import type { Habit, UserSettings, ExportData } from '../types/habit';
import { getActiveSessionUserId } from '../config/testers';

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

        return {
          ...h,
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

/**
 * Reconciles Jumbo Points for a given date based on current active habits.
 */
export function reconcileJumboDate(
  dateStr: string,
  activeHabits: Habit[],
  existingJumboDates: string[]
): { updatedJumboDates: string[]; isJumboNow: boolean; wasAwarded: boolean } {
  const applicableHabits = activeHabits.filter((h) => !h.archived && (!h.startDate || h.startDate <= dateStr));

  if (applicableHabits.length < 3) {
    const updatedJumboDates = existingJumboDates.filter((d) => d !== dateStr);
    return { updatedJumboDates, isJumboNow: false, wasAwarded: false };
  }

  const allDone = applicableHabits.every((h) => h.history[dateStr] === 'done');
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

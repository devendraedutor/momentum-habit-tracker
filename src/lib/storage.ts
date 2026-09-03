import type { Habit, UserSettings, ExportData } from '../types/habit';

const HABITS_STORAGE_KEY = 'momentum_habits_v1';
const SETTINGS_STORAGE_KEY = 'momentum_settings_v1';
const CATEGORIES_STORAGE_KEY = 'momentum_categories_v1';
const JUMBO_DATES_STORAGE_KEY = 'momentum_jumbo_dates_v1';

export const DEFAULT_SETTINGS: UserSettings = {
  soundEffects: true,
  confetti: true,
  floorAtZero: false,
  autoMarkMissedPastDays: false,
  theme: 'dark',
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
 * Load user habits strictly from storage without hardcoded overrides.
 */
export function loadHabitsFromStorage(): Habit[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HABITS_STORAGE_KEY);
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
      .map((h: Habit) => ({
        ...h,
        type: (h.type === 'BREAK' || (h.name && h.name.toLowerCase() === 'porn watching') ? 'BREAK' : 'BUILD') as 'BUILD' | 'BREAK',
        archived: Boolean(h.archived),
      }));

    return userHabits;
  } catch (err) {
    console.error('Failed to load habits from storage:', err);
    return [];
  }
}

export function saveHabitsToStorage(habits: Habit[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(habits));
  } catch (err) {
    console.error('Failed to save habits to storage:', err);
  }
}

export function loadCategoriesFromStorage(): string[] {
  if (typeof window === 'undefined') return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) return DEFAULT_CATEGORIES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES;
  } catch {
    return DEFAULT_CATEGORIES;
  }
}

export function saveCategoriesToStorage(categories: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (err) {
    console.error('Failed to save categories:', err);
  }
}

export function loadSettingsFromStorage(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettingsToStorage(settings: UserSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * Load list of dates where a Jumbo Point was awarded (100% habit completion).
 */
export function loadJumboDatesFromStorage(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(JUMBO_DATES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJumboDatesToStorage(dates: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(JUMBO_DATES_STORAGE_KEY, JSON.stringify(dates));
  } catch (err) {
    console.error('Failed to save jumbo dates:', err);
  }
}

/**
 * Reconciles Jumbo Points for a given date based on current active habits.
 * - If all active habits on dateStr are 'done' (count >= 1), award 1 Jumbo Point for dateStr.
 * - If any active habit on dateStr is 'missed' or 'none', remove dateStr from jumbo dates.
 * - Jumbo Points for past dates are preserved even if habits are deleted in the future.
 */
export function reconcileJumboDate(
  dateStr: string,
  activeHabits: Habit[],
  existingJumboDates: string[]
): { updatedJumboDates: string[]; isJumboNow: boolean; wasAwarded: boolean } {
  if (activeHabits.length === 0) {
    return { updatedJumboDates: existingJumboDates, isJumboNow: false, wasAwarded: false };
  }

  const allDone = activeHabits.every((h) => h.history[dateStr] === 'done');
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

export function exportBackupData(habits: Habit[], settings: UserSettings, jumboDates: string[] = []): string {
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
    a.download = `momentum_habits_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  return jsonStr;
}

export function generateDemoHabits(): Habit[] {
  return loadHabitsFromStorage();
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

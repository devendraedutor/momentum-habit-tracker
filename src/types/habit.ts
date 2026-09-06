export type CheckInStatus = 'done' | 'missed' | 'skipped' | 'none';

export type HabitType = 'BUILD' | 'BREAK';

export interface CheckInRecord {
  date: string; // YYYY-MM-DD
  status: CheckInStatus;
  note?: string;
  timestamp: number;
}

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: string;
  icon: string;
  color: string;
  type?: HabitType; // 'BUILD' (positive habit) or 'BREAK' (quitting/abstaining habit)
  currentLevel?: number; // Starts at 0 (unlocked). Level 1 is achieved after 3 days.
  levelProgress?: number; // Days completed toward NEXT level (e.g., 0, 1, 2, 3)
  overallStreak?: number; // Total continuous unbroken days across the habit
  targetGoalDays?: number; // e.g. 3, 7, 14, 30, 60, 120, 365 days
  currentTier?: number; // Legacy compatibility
  tierStartStreak?: number; // Legacy compatibility
  milestonesCompleted?: number; // Number of conquered milestones
  previousTargets?: number[]; // History of conquered targets
  bonusXP?: number; // Accumulated milestone clear bonus XP
  startDate?: string; // Date (YYYY-MM-DD) from which tracking begins
  createdAt: string;
  archived?: boolean;
  history: Record<string, CheckInStatus>;
}

export type ChartTimeRange = '7d' | '30d' | '90d' | 'all';

export interface DailyMomentumPoint {
  date: string;
  displayDate: string;
  score: number;
  delta: number;
  status: CheckInStatus;
  isJumboDay?: boolean;
}

export interface HabitStats {
  currentScore: number;
  highestScore: number;
  lowestScore: number;
  currentStreak: number;
  bestStreak: number;
  totalDone: number;
  totalMissed: number;
  completionRate: number;
  weeklyVelocity: number;
  targetGoalDays: number;
  currentGoalStreak: number;
  goalDaysRemaining: number;
  goalProgressPercent: number;
  goalAchieved: boolean;
  activeTierLevel: number;
  achievedLevel: number;
}

export interface UserSettings {
  soundEffects: boolean;
  confetti: boolean;
  floorAtZero: boolean;
  autoMarkMissedPastDays: boolean;
  theme: 'dark' | 'light';
}

export interface ExportData {
  version: number;
  exportedAt: string;
  habits: Habit[];
  settings: UserSettings;
  jumboDates?: string[];
}

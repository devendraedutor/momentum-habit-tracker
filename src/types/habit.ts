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
  targetGoalDays?: number; // e.g. 7, 21, 30 days strict consecutive streak goal
  currentTier?: number; // Tier / Level (e.g. 1, 2, 3...)
  tierStartStreak?: number; // Streak at which current tier began (e.g. 7)
  milestonesCompleted?: number; // Number of conquered milestones (e.g. 0, 1, 2...)
  previousTargets?: number[]; // History of conquered targets e.g. [7, 14]
  bonusXP?: number; // Accumulated milestone clear bonus XP
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
  targetGoalDays?: number;
  currentGoalStreak: number;
  goalDaysRemaining: number;
  goalProgressPercent: number;
  goalAchieved: boolean;
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

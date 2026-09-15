import type { Habit } from './habit';

export type NotificationType = 'buddy_invite' | 'buddy_accepted' | 'buddy_nudge';
export type NotificationStatus = 'pending' | 'actioned';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  senderUid: string;
  senderName: string;
  senderEmail: string;
  senderPhoto?: string;
  inviteId?: string;
  status?: NotificationStatus;
  read: boolean;
  createdAt: string; // ISO string
}

export type BuddyInviteStatus = 'pending' | 'accepted' | 'declined';

export interface BuddyInvite {
  id: string;
  fromUid: string;
  fromName: string;
  fromEmail: string;
  fromPhoto?: string;
  toUid: string;
  toEmail: string;
  status: BuddyInviteStatus;
  createdAt: string;
}

export interface BuddyPartnerData {
  displayName: string;
  email: string;
  photoURL?: string;
}

export interface Friendship {
  id: string;
  members: [string, string] | string[];
  memberDetails: Record<string, BuddyPartnerData>;
  status: 'active';
  createdAt: string;
}

export interface SharedHabitRecord {
  id: string; // `${habitId}_${targetBuddyUid}`
  habitId: string;
  ownerUid: string;
  ownerName: string;
  ownerPhoto?: string;
  targetBuddyUid: string;
  habitTitle: string;
  habitIcon: string;
  habitColor: string;
  habitCategory: string;
  streak: number;
  completedToday: boolean;
  cadence: string;
  currentLevel?: number;
  history?: Record<string, string>;
  updatedAt: string;
}

export interface BuddyMemberSummary {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  friendshipId: string;
  sharedWithMeCount: number;
  sharedByMeCount: number;
}

// Legacy compatibility
export interface BuddyPartnership {
  id: string;
  members: string[];
  users: Record<string, BuddyPartnerData>;
  createdAt: string;
}

export interface BuddyProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  activeBuddyUid?: string | null;
  totalHabitsCount: number;
  completedTodayCount: number;
  completionPercentage: number;
  sharedHabits: Habit[];
  totalSharedCount: number;
  completedSharedTodayCount: number;
  isNudgeOnCooldown?: boolean;
}

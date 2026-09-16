import { useState, useEffect, useCallback, useMemo } from 'react';
import type { User } from '../lib/firebase';
import type {
  Friendship,
  BuddyMemberSummary,
  SharedHabitRecord,
} from '../types/buddy';
import type { Habit } from '../types/habit';
import {
  searchUserByEmail,
  sendBuddyInvite,
  sendBuddyNudge,
  unfriendBuddy,
  subscribeToFriendships,
  subscribeToAllSharedHabitsForUser,
  shareHabitsWithBuddies,
  revokeSharedHabit,
  type SearchedUser,
} from '../lib/firestoreService';

interface UseBuddySystemProps {
  user: User | null;
}

const NUDGE_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

export function useBuddySystem({ user }: UseBuddySystemProps) {
  // Friendships & active buddies
  const [friendships, setFriendships] = useState<Friendship[]>([]);
  const [allIncomingHabits, setAllIncomingHabits] = useState<SharedHabitRecord[]>([]);
  const [allOutgoingHabits, setAllOutgoingHabits] = useState<SharedHabitRecord[]>([]);

  // Search state
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchedUser | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isInviteSending, setIsInviteSending] = useState(false);
  const [inviteSuccessToast, setInviteSuccessToast] = useState<string | null>(null);

  // Nudge cooldown timers map: { [buddyUid]: remainingSeconds }
  const [nudgeCooldowns, setNudgeCooldowns] = useState<Record<string, number>>({});

  // 1. Subscribe to real-time Friendships
  useEffect(() => {
    if (!user) {
      setFriendships([]);
      return;
    }

    const unsub = subscribeToFriendships(user.uid, (incoming) => {
      setFriendships(incoming);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // 2. Subscribe to all shared habits for summary counts
  useEffect(() => {
    if (!user) {
      setAllIncomingHabits([]);
      setAllOutgoingHabits([]);
      return;
    }

    const unsub = subscribeToAllSharedHabitsForUser(user.uid, ({ incoming, outgoing }) => {
      setAllIncomingHabits(incoming);
      setAllOutgoingHabits(outgoing);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // 3. Compute structured BuddyMemberSummary list
  const buddies: BuddyMemberSummary[] = useMemo(() => {
    if (!user) return [];

    return friendships.map((f) => {
      const partnerUid = f.members.find((m) => m !== user.uid) || '';
      const details = f.memberDetails?.[partnerUid] || {
        displayName: 'Flux Buddy',
        email: '',
        photoURL: '',
      };

      const sharedWithMe = allIncomingHabits.filter((h) => h.ownerUid === partnerUid).length;
      const sharedByMe = allOutgoingHabits.filter((h) => h.targetBuddyUid === partnerUid).length;

      return {
        uid: partnerUid,
        displayName: details.displayName || 'Flux Buddy',
        email: details.email || '',
        photoURL: details.photoURL || undefined,
        friendshipId: f.id,
        sharedWithMeCount: sharedWithMe,
        sharedByMeCount: sharedByMe,
      };
    });
  }, [friendships, allIncomingHabits, allOutgoingHabits, user]);

  // 4. Update Nudge Cooldowns timer interval
  useEffect(() => {
    if (buddies.length === 0) return;

    const checkCooldowns = () => {
      const now = Date.now();
      const updated: Record<string, number> = {};

      for (const b of buddies) {
        const storageKey = `flux_nudge_${b.uid}`;
        const lastNudgeTime = parseInt(localStorage.getItem(storageKey) || '0', 10);
        const diff = lastNudgeTime + NUDGE_COOLDOWN_MS - now;
        if (diff > 0) {
          updated[b.uid] = Math.ceil(diff / 1000);
        } else {
          updated[b.uid] = 0;
        }
      }

      setNudgeCooldowns(updated);
    };

    checkCooldowns();
    const interval = setInterval(checkCooldowns, 1000);
    return () => clearInterval(interval);
  }, [buddies]);

  // Search user by email
  const searchBuddy = useCallback(
    async (email: string) => {
      if (!user) return;
      setIsSearching(true);
      setSearchError(null);
      setSearchResult(null);

      const cleanedEmail = email.trim().toLowerCase();
      if (!cleanedEmail) {
        setSearchError('Please enter an email address.');
        setIsSearching(false);
        return;
      }

      if (cleanedEmail === (user.email || '').toLowerCase()) {
        setSearchError('You cannot pair with yourself! Search for a friend or partner.');
        setIsSearching(false);
        return;
      }

      try {
        const found = await searchUserByEmail(cleanedEmail, user.uid);
        if (!found) {
          setSearchError('No user found with this email. Have them sign in to Flux once first!');
        } else if (found.uid === user.uid) {
          setSearchError('You cannot pair with yourself!');
        } else {
          setSearchResult(found);
        }
      } catch (err: any) {
        console.error('Search error:', err);
        if (err?.code === 'permission-denied') {
          setSearchError('Firestore permission denied. Please update your Firestore Security Rules in Firebase Console to allow reading users.');
        } else {
          setSearchError(err?.message || 'Error searching for user. Please try again.');
        }
      } finally {
        setIsSearching(false);
      }
    },
    [user]
  );

  // Dispatch buddy invite
  const sendInvite = useCallback(
    async (targetUser: SearchedUser) => {
      if (!user) return false;
      setIsInviteSending(true);

      try {
        await sendBuddyInvite(
          {
            uid: user.uid,
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          },
          targetUser
        );

        setInviteSuccessToast(`Invite sent to ${targetUser.displayName}!`);
        setTimeout(() => setInviteSuccessToast(null), 5000);
        setSearchResult(null);
        return true;
      } catch (err: any) {
        console.error('Send invite error:', err);
        if (err?.code === 'permission-denied') {
          setSearchError('Firestore permission denied. Please update your Firestore Security Rules to allow sending invites/notifications.');
        } else {
          setSearchError(err?.message || 'Unable to send invite. Please try again.');
        }
        return false;
      } finally {
        setIsInviteSending(false);
      }
    },
    [user]
  );

  // Unfriend buddy
  const unfriend = useCallback(
    async (friendshipId: string, partnerUid: string) => {
      if (!user) return;
      // Optimistically update local friendships state for instant feedback
      setFriendships((prev) =>
        prev.filter(
          (f) =>
            f.id !== friendshipId &&
            !(f.members || []).includes(partnerUid)
        )
      );
      await unfriendBuddy(friendshipId, user.uid, partnerUid);
    },
    [user]
  );

  // Share multiple habits with multiple buddies
  const shareHabits = useCallback(
    async (habitsToShare: Habit[], targetBuddyUids: string[]) => {
      if (!user) return false;
      return await shareHabitsWithBuddies(habitsToShare, targetBuddyUids, user);
    },
    [user]
  );

  // Revoke single shared habit record
  const revokeHabit = useCallback(
    async (sharedHabitDocId: string) => {
      return await revokeSharedHabit(sharedHabitDocId);
    },
    []
  );

  // Send Nudge to specific buddy
  const nudgeBuddy = useCallback(
    async (buddyUid: string) => {
      if (!user || (nudgeCooldowns[buddyUid] || 0) > 0) return false;
      const success = await sendBuddyNudge(user, buddyUid);
      if (success) {
        localStorage.setItem(`flux_nudge_${buddyUid}`, Date.now().toString());
        setNudgeCooldowns((prev) => ({
          ...prev,
          [buddyUid]: Math.ceil(NUDGE_COOLDOWN_MS / 1000),
        }));
      }
      return success;
    },
    [user, nudgeCooldowns]
  );

  const clearSearch = useCallback(() => {
    setSearchResult(null);
    setSearchError(null);
  }, []);

  return {
    friendships,
    buddies,
    allIncomingHabits,
    allOutgoingHabits,
    isSearching,
    searchResult,
    searchError,
    isInviteSending,
    inviteSuccessToast,
    nudgeCooldowns,
    searchBuddy,
    sendInvite,
    unfriend,
    shareHabits,
    revokeHabit,
    nudgeBuddy,
    clearSearch,
  };
}

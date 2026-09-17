import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  writeBatch,
  deleteDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Habit, UserSettings, CheckInStatus } from '../types/habit';
import type {
  AppNotification,
  Friendship,
  SharedHabitRecord,
} from '../types/buddy';
import { getTodayString } from './momentum';

export interface UserCloudData {
  uid?: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  activeBuddyUid?: string | null;
  habits: Habit[];
  jumboDates: string[];
  settings?: UserSettings;
  updatedAt?: string;
}

const COLLECTION_USERS = 'users';
const COLLECTION_INVITES = 'buddy_invites';
const COLLECTION_FRIENDSHIPS = 'friendships';
const COLLECTION_SHARED_HABITS = 'shared_habits';
const SUBCOLLECTION_NOTIFICATIONS = 'notifications';

/**
 * Strips all `undefined` fields recursively so Firestore never throws
 * "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  return JSON.parse(JSON.stringify(data));
}

/**
 * Fetches user profile, habits, jumboDates, and settings from Firestore
 */
export async function fetchUserCloudData(uid: string): Promise<UserCloudData | null> {
  if (!db || !uid) return null;

  console.log(`[Sync] Reading from Firestore for UID: ${uid}`);
  try {
    const userDocRef = doc(db, COLLECTION_USERS, uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserCloudData;
      return {
        uid: data.uid || uid,
        email: data.email ?? '',
        displayName: data.displayName ?? '',
        photoURL: data.photoURL ?? '',
        activeBuddyUid: data.activeBuddyUid ?? null,
        habits: Array.isArray(data.habits) ? data.habits : [],
        jumboDates: Array.isArray(data.jumboDates) ? data.jumboDates : [],
        settings: data.settings || ({} as UserSettings),
        updatedAt: data.updatedAt,
      };
    }
    return null;
  } catch (error) {
    console.error('[Sync] Error fetching user cloud data from Firestore:', error);
    return null;
  }
}

/**
 * Saves or updates user profile, habits, and settings in Firestore with merge
 */
export async function saveUserCloudData(
  uid: string,
  data: Partial<UserCloudData>
): Promise<boolean> {
  if (!db || !uid) {
    console.warn('[Sync] Firestore is not connected or UID is missing');
    return false;
  }

  try {
    const userDocRef = doc(db, COLLECTION_USERS, uid);
    const timestamp = new Date().toISOString();
    const rawPayload = {
      ...data,
      updatedAt: timestamp,
    };
    const cleanPayload = sanitizeForFirestore(rawPayload);

    await setDoc(userDocRef, cleanPayload, { merge: true });
    return true;
  } catch (error) {
    console.error('[Sync] Error saving user cloud data to Firestore:', error);
    return false;
  }
}

/**
 * Subscribes to real-time updates for a user document across devices/tabs
 */
export function subscribeToUserCloudData(
  uid: string,
  onUpdate: (data: UserCloudData) => void
): Unsubscribe | null {
  if (!db || !uid) return null;

  try {
    const userDocRef = doc(db, COLLECTION_USERS, uid);
    return onSnapshot(
      userDocRef,
      (docSnap) => {
        // Ignore uncommitted local writes to avoid race conditions with local state
        if (docSnap.metadata.hasPendingWrites) {
          return;
        }
        if (docSnap.exists()) {
          const data = docSnap.data() as UserCloudData;
          onUpdate({
            uid: data.uid || uid,
            email: data.email ?? '',
            displayName: data.displayName ?? '',
            photoURL: data.photoURL ?? '',
            activeBuddyUid: data.activeBuddyUid ?? null,
            habits: Array.isArray(data.habits) ? data.habits : [],
            jumboDates: Array.isArray(data.jumboDates) ? data.jumboDates : [],
            settings: data.settings || ({} as UserSettings),
            updatedAt: data.updatedAt,
          });
        }
      },
      (error) => {
        console.warn('[Sync] Snapshot listener error:', error);
      }
    );
  } catch (error) {
    console.warn('[Sync] Error establishing snapshot listener:', error);
    return null;
  }
}

/**
 * Deletes all shared habit records for a specific habit owned by a user
 */
export async function deleteSharedHabitsForHabit(ownerUid: string, habitId: string): Promise<void> {
  if (!db || !ownerUid || !habitId) return;
  try {
    const sharedHabitsRef = collection(db, COLLECTION_SHARED_HABITS);
    const q = query(
      sharedHabitsRef,
      where('ownerUid', '==', ownerUid),
      where('habitId', '==', habitId)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`✅ [SharedHabits] Cleaned up shared habit records for habit: ${habitId}`);
  } catch (err) {
    console.warn('[SharedHabits] Error deleting shared habits for habit:', err);
  }
}

/**
 * Deletes all shared habit records owned by a user (used for factory reset)
 */
export async function deleteAllSharedHabitsForUser(ownerUid: string): Promise<void> {
  if (!db || !ownerUid) return;
  try {
    const sharedHabitsRef = collection(db, COLLECTION_SHARED_HABITS);
    const q = query(
      sharedHabitsRef,
      where('ownerUid', '==', ownerUid)
    );
    const snap = await getDocs(q);
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    console.log(`✅ [SharedHabits] Deleted all shared habits for user: ${ownerUid}`);
  } catch (err) {
    console.warn('[SharedHabits] Error deleting all shared habits for user:', err);
  }
}

/* =========================================================================
   MULTI-BUDDY SYSTEM & GRANULAR HABIT SHARING SERVICES
   ========================================================================= */

export interface SearchedUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  relationStatus?: 'friends' | 'pending_sent' | 'pending_received' | 'none';
}

/**
 * Searches for a user in the `users` collection by their lowercase email address
 */
export async function searchUserByEmail(
  rawEmail: string,
  currentUserUid?: string
): Promise<SearchedUser | null> {
  if (!db || !rawEmail.trim()) return null;

  const targetEmail = rawEmail.trim().toLowerCase();
  try {
    const usersRef = collection(db, COLLECTION_USERS);
    const q = query(usersRef, where('email', '==', targetEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const firstDoc = querySnapshot.docs[0];
    const data = firstDoc.data();
    const targetUid = firstDoc.id;

    let relationStatus: SearchedUser['relationStatus'] = 'none';

    if (currentUserUid && currentUserUid !== targetUid) {
      relationStatus = await checkBuddyRelationStatus(currentUserUid, targetUid);
    }

    return {
      uid: targetUid,
      email: data.email || targetEmail,
      displayName: data.displayName || 'Flux User',
      photoURL: data.photoURL || '',
      relationStatus,
    };
  } catch (error) {
    console.error('[Buddy] Error searching user by email:', error);
    throw error;
  }
}

/**
 * Checks relation status between two users (friends, invite pending, none)
 */
export async function checkBuddyRelationStatus(
  currentUserUid: string,
  targetUid: string
): Promise<'friends' | 'pending_sent' | 'pending_received' | 'none'> {
  if (!db || !currentUserUid || !targetUid) return 'none';

  try {
    // 1. Check active friendship in `friendships`
    const friendshipsRef = collection(db, COLLECTION_FRIENDSHIPS);
    const friendQ = query(
      friendshipsRef,
      where('members', 'array-contains', currentUserUid)
    );
    const friendSnap = await getDocs(friendQ);

    for (const d of friendSnap.docs) {
      const mems = d.data().members || [];
      if (mems.includes(targetUid)) {
        return 'friends';
      }
    }

    // 2. Check accepted invites in `buddy_invites`
    const invitesRef = collection(db, COLLECTION_INVITES);
    const accQ1 = query(
      invitesRef,
      where('fromUid', '==', currentUserUid),
      where('toUid', '==', targetUid),
      where('status', '==', 'accepted')
    );
    const accSnap1 = await getDocs(accQ1);
    if (!accSnap1.empty) return 'friends';

    const accQ2 = query(
      invitesRef,
      where('fromUid', '==', targetUid),
      where('toUid', '==', currentUserUid),
      where('status', '==', 'accepted')
    );
    const accSnap2 = await getDocs(accQ2);
    if (!accSnap2.empty) return 'friends';

    // 3. Check pending invites sent
    const sentQ = query(
      invitesRef,
      where('fromUid', '==', currentUserUid),
      where('toUid', '==', targetUid),
      where('status', '==', 'pending')
    );
    const sentSnap = await getDocs(sentQ);
    if (!sentSnap.empty) return 'pending_sent';

    // 4. Check pending invites received
    const recQ = query(
      invitesRef,
      where('fromUid', '==', targetUid),
      where('toUid', '==', currentUserUid),
      where('status', '==', 'pending')
    );
    const recSnap = await getDocs(recQ);
    if (!recSnap.empty) return 'pending_received';

    return 'none';
  } catch (err) {
    console.warn('[Buddy] Error checking relation status:', err);
    return 'none';
  }
}

/**
 * Dispatches a Buddy Invite and places a notification in the target's subcollection
 */
export async function sendBuddyInvite(
  sender: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null },
  targetUser: SearchedUser
): Promise<{ inviteId: string; notificationId: string } | null> {
  if (!db || !sender.uid || !targetUser.uid) return null;

  try {
    const timestamp = new Date().toISOString();

    // 1. Create document in `buddy_invites`
    const invitesRef = collection(db, COLLECTION_INVITES);
    const invitePayload = sanitizeForFirestore({
      fromUid: sender.uid,
      fromName: sender.displayName || 'Flux User',
      fromEmail: sender.email || '',
      fromPhoto: sender.photoURL || '',
      toUid: targetUser.uid,
      toEmail: targetUser.email,
      status: 'pending',
      createdAt: timestamp,
    });
    const inviteDocRef = await addDoc(invitesRef, invitePayload);

    // 2. Create notification under target user: `users/{targetUid}/notifications`
    const notificationsRef = collection(
      db,
      COLLECTION_USERS,
      targetUser.uid,
      SUBCOLLECTION_NOTIFICATIONS
    );
    const notificationPayload = sanitizeForFirestore({
      type: 'buddy_invite',
      title: 'New Buddy Request',
      message: `${sender.displayName || 'A Flux user'} sent you an accountability buddy invite.`,
      senderUid: sender.uid,
      senderName: sender.displayName || 'Flux User',
      senderEmail: sender.email || '',
      senderPhoto: sender.photoURL || '',
      inviteId: inviteDocRef.id,
      status: 'pending',
      read: false,
      createdAt: timestamp,
    });
    const notifDocRef = await addDoc(notificationsRef, notificationPayload);

    return { inviteId: inviteDocRef.id, notificationId: notifDocRef.id };
  } catch (error) {
    console.error('[Buddy] Error sending buddy invite:', error);
    throw error;
  }
}

/**
 * Accepts a Buddy Invite, creates a document in `friendships`, and sends acceptance alert
 */
export async function acceptBuddyInvite(
  invite: {
    id?: string;
    fromUid: string;
    fromName?: string;
    fromEmail?: string;
    fromPhoto?: string;
  },
  receiver: {
    uid: string;
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  },
  notificationId?: string
): Promise<boolean> {
  if (!db || !receiver.uid || !invite.fromUid) return false;

  try {
    const timestamp = new Date().toISOString();

    // 1. If invite.id exists, update it. If not, look for the pending invite in `buddy_invites`
    let inviteId = invite.id;
    if (!inviteId) {
      try {
        const invitesRef = collection(db, COLLECTION_INVITES);
        const q = query(
          invitesRef,
          where('fromUid', '==', invite.fromUid),
          where('toUid', '==', receiver.uid),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          inviteId = snap.docs[0].id;
        }
      } catch (e) {
        console.warn('[Buddy] Could not query invite doc:', e);
      }
    }

    if (inviteId) {
      try {
        const inviteRef = doc(db, COLLECTION_INVITES, inviteId);
        await updateDoc(
          inviteRef,
          sanitizeForFirestore({
            status: 'accepted',
            updatedAt: timestamp,
          })
        );
      } catch (e) {
        console.warn('[Buddy] Could not update invite status:', e);
      }
    }

    // 2. Update receiver's notification status to 'actioned'
    if (notificationId) {
      try {
        const receiverNotifRef = doc(
          db,
          COLLECTION_USERS,
          receiver.uid,
          SUBCOLLECTION_NOTIFICATIONS,
          notificationId
        );
        await updateDoc(
          receiverNotifRef,
          sanitizeForFirestore({
            status: 'actioned',
            read: true,
            updatedAt: timestamp,
          })
        );
      } catch (e) {
        console.warn('[Buddy] Could not update receiver notification:', e);
      }
    }

    // 3. Create document in `friendships` collection (check if already exists first)
    const friendshipsRef = collection(db, COLLECTION_FRIENDSHIPS);
    const existingQ = query(
      friendshipsRef,
      where('members', 'array-contains', receiver.uid)
    );
    const existingSnap = await getDocs(existingQ);
    const alreadyExists = existingSnap.docs.some((d) =>
      (d.data().members || []).includes(invite.fromUid)
    );

    if (!alreadyExists) {
      await addDoc(
        friendshipsRef,
        sanitizeForFirestore({
          members: [invite.fromUid, receiver.uid],
          memberDetails: {
            [invite.fromUid]: {
              displayName: invite.fromName || 'Flux User',
              email: invite.fromEmail || '',
              photoURL: invite.fromPhoto || '',
            },
            [receiver.uid]: {
              displayName: receiver.displayName || 'Flux User',
              email: receiver.email || '',
              photoURL: receiver.photoURL || '',
            },
          },
          status: 'active',
          createdAt: timestamp,
        })
      );
    }

    // 4. Safely try to notify sender (ignore error if cross-user write denied by rules)
    try {
      const senderNotifRef = collection(
        db,
        COLLECTION_USERS,
        invite.fromUid,
        SUBCOLLECTION_NOTIFICATIONS
      );
      await addDoc(
        senderNotifRef,
        sanitizeForFirestore({
          type: 'buddy_accepted',
          title: 'Invite Accepted! 🤝',
          message: `${receiver.displayName || 'Your buddy'} accepted your buddy invite. You are now habit buddies!`,
          senderUid: receiver.uid,
          senderName: receiver.displayName || 'Flux User',
          senderEmail: receiver.email || '',
          senderPhoto: receiver.photoURL || '',
          status: 'actioned',
          read: false,
          createdAt: timestamp,
        })
      );
    } catch (e) {
      console.warn('[Buddy] Sender notification dispatch skipped (rules protected):', e);
    }

    console.log('✅ [Buddy] Friendship established & invite accepted:', {
      user1: invite.fromUid,
      user2: receiver.uid,
    });
    return true;
  } catch (error) {
    console.error('[Buddy] Error in acceptBuddyInvite:', error);
    throw error;
  }
}

/**
 * Declines a Buddy Invite and marks the notification as actioned
 */
export async function declineBuddyInvite(
  inviteId: string,
  receiverUid: string,
  notificationId: string
): Promise<boolean> {
  if (!db || !receiverUid) return false;

  try {
    const timestamp = new Date().toISOString();

    if (inviteId) {
      try {
        const inviteRef = doc(db, COLLECTION_INVITES, inviteId);
        await updateDoc(
          inviteRef,
          sanitizeForFirestore({
            status: 'declined',
            updatedAt: timestamp,
          })
        );
      } catch (e) {}
    }

    if (notificationId) {
      try {
        const receiverNotifRef = doc(
          db,
          COLLECTION_USERS,
          receiverUid,
          SUBCOLLECTION_NOTIFICATIONS,
          notificationId
        );
        await updateDoc(
          receiverNotifRef,
          sanitizeForFirestore({
            status: 'actioned',
            read: true,
            updatedAt: timestamp,
          })
        );
      } catch (e) {}
    }

    return true;
  } catch (error) {
    console.error('[Buddy] Error declining buddy invite:', error);
    throw error;
  }
}

/**
 * Removes a friendship and cleans up all shared habit records in both directions
 */
export async function unfriendBuddy(
  friendshipId: string,
  currentUserUid: string,
  partnerUid: string
): Promise<boolean> {
  if (!db || !currentUserUid || !partnerUid) return false;

  try {
    // 1. Delete friendship document by ID
    if (friendshipId && !friendshipId.startsWith('friendship_invite_')) {
      try {
        const friendDocRef = doc(db, COLLECTION_FRIENDSHIPS, friendshipId);
        await deleteDoc(friendDocRef);
      } catch (e) {
        console.warn('[Buddy] Could not delete direct friendship doc:', e);
      }
    }

    // Also query and delete any friendship matching both members
    try {
      const friendshipsRef = collection(db, COLLECTION_FRIENDSHIPS);
      const q = query(friendshipsRef, where('members', 'array-contains', currentUserUid));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        if ((d.data().members || []).includes(partnerUid)) {
          try {
            await deleteDoc(d.ref);
          } catch (e) {}
        }
      }
    } catch (e) {
      console.warn('[Buddy] Error deleting member friendships:', e);
    }

    // 2. Delete or mark buddy_invites between them as revoked
    try {
      const invitesRef = collection(db, COLLECTION_INVITES);
      const qInv1 = query(invitesRef, where('fromUid', '==', currentUserUid), where('toUid', '==', partnerUid));
      const snapInv1 = await getDocs(qInv1);
      for (const d of snapInv1.docs) {
        try {
          await deleteDoc(d.ref);
        } catch (e) {
          try {
            await updateDoc(d.ref, { status: 'revoked' });
          } catch (e2) {}
        }
      }

      const qInv2 = query(invitesRef, where('fromUid', '==', partnerUid), where('toUid', '==', currentUserUid));
      const snapInv2 = await getDocs(qInv2);
      for (const d of snapInv2.docs) {
        try {
          await deleteDoc(d.ref);
        } catch (e) {
          try {
            await updateDoc(d.ref, { status: 'revoked' });
          } catch (e2) {}
        }
      }
    } catch (e) {
      console.warn('[Buddy] Error deleting invites:', e);
    }

    // 3. Delete all shared habits sent to or received from partner
    try {
      const sharedHabitsRef = collection(db, COLLECTION_SHARED_HABITS);

      // Habits I shared with partner
      const q1 = query(
        sharedHabitsRef,
        where('ownerUid', '==', currentUserUid),
        where('targetBuddyUid', '==', partnerUid)
      );
      const snap1 = await getDocs(q1);
      for (const d of snap1.docs) {
        try {
          await deleteDoc(d.ref);
        } catch (e) {}
      }

      // Habits partner shared with me (safely attempt deletion)
      const q2 = query(
        sharedHabitsRef,
        where('ownerUid', '==', partnerUid),
        where('targetBuddyUid', '==', currentUserUid)
      );
      const snap2 = await getDocs(q2);
      for (const d of snap2.docs) {
        try {
          await deleteDoc(d.ref);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('[Buddy] Error deleting shared habits:', e);
    }

    console.log('✅ [Buddy] Unfriended & wiped shared habits with:', partnerUid);
    return true;
  } catch (error) {
    console.error('[Buddy] Error unfriending buddy:', error);
    return false;
  }
}

/**
 * Subscribes to real-time `friendships` where `members array-contains currentUserUid`,
 * and auto-merges accepted `buddy_invites` with user detail hydration
 */
export function subscribeToFriendships(
  currentUserUid: string,
  onUpdate: (friendships: Friendship[]) => void
): Unsubscribe | null {
  if (!db || !currentUserUid) return null;

  try {
    const friendshipsMap = new Map<string, Friendship>();
    const sentAcceptedMap = new Map<string, Friendship>();
    const receivedAcceptedMap = new Map<string, Friendship>();

    const emitMerged = () => {
      const merged = new Map<string, Friendship>();

      // 1. Primary source: Friendships collection
      for (const [id, f] of friendshipsMap.entries()) {
        const partnerUid = (f.members || []).find((m) => m !== currentUserUid) || '';
        if (partnerUid) {
          merged.set(partnerUid, f);
        } else {
          merged.set(id, f);
        }
      }

      // 2. Sent Accepted Invites (fill in if missing from friendships)
      for (const [partnerUid, f] of sentAcceptedMap.entries()) {
        if (!merged.has(partnerUid)) {
          merged.set(partnerUid, f);
        }
      }

      // 3. Received Accepted Invites (fill in if missing from friendships)
      for (const [partnerUid, f] of receivedAcceptedMap.entries()) {
        if (!merged.has(partnerUid)) {
          merged.set(partnerUid, f);
        }
      }

      const list = Array.from(merged.values());
      onUpdate(list);
    };

    // 1. Friendships collection listener
    const friendshipsRef = collection(db, COLLECTION_FRIENDSHIPS);
    const q1 = query(friendshipsRef, where('members', 'array-contains', currentUserUid));
    const unsub1 = onSnapshot(
      q1,
      async (snapshot) => {
        friendshipsMap.clear();
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          const members = data.members || [];
          const partnerUid = members.find((m: string) => m !== currentUserUid) || '';
          let memberDetails = data.memberDetails || {};

          // Hydrate partner details if missing
          if (partnerUid && (!memberDetails[partnerUid]?.displayName || !memberDetails[partnerUid]?.email)) {
            try {
              const uSnap = await getDoc(doc(db, COLLECTION_USERS, partnerUid));
              if (uSnap.exists()) {
                const uData = uSnap.data();
                memberDetails = {
                  ...memberDetails,
                  [partnerUid]: {
                    displayName: uData.displayName || 'Flux User',
                    email: uData.email || '',
                    photoURL: uData.photoURL || '',
                  },
                };
              }
            } catch (e) {}
          }

          friendshipsMap.set(docSnap.id, {
            id: docSnap.id,
            members,
            memberDetails,
            status: data.status || 'active',
            createdAt: data.createdAt || new Date().toISOString(),
          });
        }
        emitMerged();
      },
      (error) => {
        console.warn('[Buddy] Error listening to friendships:', error);
      }
    );

    // 2. Accepted Invites Sent by currentUser
    const invitesRef = collection(db, COLLECTION_INVITES);
    const q2 = query(
      invitesRef,
      where('fromUid', '==', currentUserUid),
      where('status', '==', 'accepted')
    );
    const unsub2 = onSnapshot(
      q2,
      async (snapshot) => {
        sentAcceptedMap.clear();
        for (const docSnap of snapshot.docs) {
          const d = docSnap.data();
          const partnerUid = d.toUid;
          if (partnerUid) {
            let partnerName = 'Flux Buddy';
            let partnerEmail = d.toEmail || '';
            let partnerPhoto = '';
            try {
              const uSnap = await getDoc(doc(db, COLLECTION_USERS, partnerUid));
              if (uSnap.exists()) {
                const uData = uSnap.data();
                partnerName = uData.displayName || partnerName;
                partnerEmail = uData.email || partnerEmail;
                partnerPhoto = uData.photoURL || '';
              }
            } catch (e) {}

            sentAcceptedMap.set(partnerUid, {
              id: `friendship_invite_${docSnap.id}`,
              members: [currentUserUid, partnerUid],
              memberDetails: {
                [currentUserUid]: {
                  displayName: 'Me',
                  email: '',
                },
                [partnerUid]: {
                  displayName: partnerName,
                  email: partnerEmail,
                  photoURL: partnerPhoto,
                },
              },
              status: 'active',
              createdAt: d.createdAt || new Date().toISOString(),
            });
          }
        }
        emitMerged();
      },
      (e) => console.warn('[Buddy] Error listening to sent accepted invites:', e)
    );

    // 3. Accepted Invites Received by currentUser
    const q3 = query(
      invitesRef,
      where('toUid', '==', currentUserUid),
      where('status', '==', 'accepted')
    );
    const unsub3 = onSnapshot(
      q3,
      async (snapshot) => {
        receivedAcceptedMap.clear();
        for (const docSnap of snapshot.docs) {
          const d = docSnap.data();
          const partnerUid = d.fromUid;
          if (partnerUid) {
            receivedAcceptedMap.set(partnerUid, {
              id: `friendship_invite_${docSnap.id}`,
              members: [currentUserUid, partnerUid],
              memberDetails: {
                [currentUserUid]: {
                  displayName: 'Me',
                  email: '',
                },
                [partnerUid]: {
                  displayName: d.fromName || 'Flux Buddy',
                  email: d.fromEmail || '',
                  photoURL: d.fromPhoto || '',
                },
              },
              status: 'active',
              createdAt: d.createdAt || new Date().toISOString(),
            });
          }
        }
        emitMerged();
      },
      (e) => console.warn('[Buddy] Error listening to received accepted invites:', e)
    );

    return () => {
      if (unsub1) unsub1();
      if (unsub2) unsub2();
      if (unsub3) unsub3();
    };
  } catch (error) {
    console.warn('[Buddy] Error setting up friendships subscription:', error);
    return null;
  }
}

/* =========================================================================
   GRANULAR SHARED HABITS SERVICES
   ========================================================================= */

/**
 * Shares multiple habits with multiple buddies into `shared_habits` collection
 */
export async function shareHabitsWithBuddies(
  habits: Habit[],
  targetBuddyUids: string[],
  owner: { uid: string; displayName?: string | null; photoURL?: string | null },
  shareScope: 'starting' | 'today' = 'starting'
): Promise<boolean> {
  if (!db || !owner.uid || habits.length === 0 || targetBuddyUids.length === 0) {
    return false;
  }

  try {
    const todayStr = getTodayString();
    const timestamp = new Date().toISOString();
    const batch = writeBatch(db);

    for (const habit of habits) {
      const todayStatus = habit.history?.[todayStr];
      const isDone = todayStatus === 'done' || todayStatus === 'controlled';

      // Filter history based on shareScope:
      let sharedHistory: Record<string, CheckInStatus> = {};
      let sharedStreak = habit.overallStreak || 0;

      if (shareScope === 'today') {
        const filteredHistory: Record<string, CheckInStatus> = {};
        for (const [dateKey, val] of Object.entries(habit.history || {})) {
          if (dateKey >= todayStr) {
            filteredHistory[dateKey] = val;
          }
        }
        sharedHistory = filteredHistory;
        sharedStreak = isDone ? 1 : 0;
      } else {
        sharedHistory = habit.history || {};
        sharedStreak = habit.overallStreak || 0;
      }

      for (const buddyUid of targetBuddyUids) {
        if (!buddyUid) continue;
        const safeHabitId = String(habit.id).replace(/\//g, '_');
        const safeBuddyUid = String(buddyUid).replace(/\//g, '_');
        const docId = `${safeHabitId}_${safeBuddyUid}`;
        const sharedDocRef = doc(db, COLLECTION_SHARED_HABITS, docId);

        const habitStartDate = habit.startDate || (habit.createdAt ? habit.createdAt.split('T')[0] : todayStr);
        const resolvedShareStart = shareScope === 'today' ? todayStr : habitStartDate;

        const payload: SharedHabitRecord = {
          id: docId,
          habitId: habit.id,
          ownerUid: owner.uid,
          ownerName: owner.displayName || 'Flux User',
          ownerPhoto: owner.photoURL || '',
          targetBuddyUid: buddyUid,
          habitTitle: habit.name || 'Untitled Habit',
          habitIcon: habit.icon || 'Sparkles',
          habitColor: habit.color || '#10b981',
          habitCategory: habit.category || 'General',
          habitType: habit.type || 'BUILD',
          startDate: resolvedShareStart,
          createdAt: habit.createdAt || timestamp,
          streak: sharedStreak,
          completedToday: isDone,
          cadence: habit.type || 'BUILD',
          currentLevel: habit.currentLevel || 0,
          levelProgress: habit.levelProgress || 0,
          targetGoalDays: habit.targetGoalDays || 21,
          history: sharedHistory,
          shareScope: shareScope,
          shareStartDate: resolvedShareStart,
          updatedAt: timestamp,
        };

        batch.set(sharedDocRef, sanitizeForFirestore(payload), { merge: true });
      }
    }

    await batch.commit();
    console.log(
      `✅ [SharedHabits] Shared ${habits.length} habits with ${targetBuddyUids.length} buddies (${shareScope}).`
    );
    return true;
  } catch (error) {
    console.error('[SharedHabits] Error sharing habits with buddies:', error);
    throw error;
  }
}

/**
 * Revokes a shared habit record
 */
export async function revokeSharedHabit(sharedHabitDocId: string): Promise<boolean> {
  if (!db || !sharedHabitDocId) return false;

  try {
    const docRef = doc(db, COLLECTION_SHARED_HABITS, sharedHabitDocId);
    await deleteDoc(docRef);
    console.log('✅ [SharedHabits] Revoked shared habit access:', sharedHabitDocId);
    return true;
  } catch (error) {
    console.error('[SharedHabits] Error revoking shared habit:', error);
    throw error;
  }
}

/**
 * Syncs user's local habit progress to all `shared_habits` records where user is owner,
 * and automatically notifies active accountability buddies about check-in status (Done, Missed, Controlled, Failed).
 */
export async function syncHabitProgressToSharedHabits(
  owner: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null } | string,
  habit: Habit,
  checkInEvent?: {
    status: 'done' | 'missed' | 'controlled' | 'failed' | string;
    dateStr?: string;
  }
): Promise<void> {
  const ownerUid = typeof owner === 'string' ? owner : owner.uid;
  if (!db || !ownerUid || !habit.id) return;

  try {
    const todayStr = getTodayString();
    const todayStatus = habit.history?.[todayStr];
    const isDone = todayStatus === 'done' || todayStatus === 'controlled';
    const timestamp = new Date().toISOString();

    const sharedHabitsRef = collection(db, COLLECTION_SHARED_HABITS);
    const q = query(
      sharedHabitsRef,
      where('ownerUid', '==', ownerUid),
      where('habitId', '==', habit.id)
    );
    const snap = await getDocs(q);

    if (snap.empty) return;

    const batch = writeBatch(db);
    const ownerName = typeof owner === 'object' && owner.displayName ? owner.displayName : 'Your buddy';
    const ownerEmail = typeof owner === 'object' && owner.email ? owner.email : '';
    const ownerPhoto = typeof owner === 'object' && owner.photoURL ? owner.photoURL : '';

    const targetBuddyUids = new Set<string>();

    for (const d of snap.docs) {
      const sharedData = d.data() as SharedHabitRecord;
      const shareScope = sharedData.shareScope || 'starting';
      const shareStartDate = sharedData.shareStartDate;

      let historyToSync = habit.history || {};
      if (shareScope === 'today' && shareStartDate) {
        const filteredHistory: Record<string, CheckInStatus> = {};
        for (const [dateKey, val] of Object.entries(habit.history || {})) {
          if (dateKey >= shareStartDate) {
            filteredHistory[dateKey] = val;
          }
        }
        historyToSync = filteredHistory;
      }

      batch.update(d.ref, {
        habitTitle: habit.name,
        habitIcon: habit.icon,
        habitColor: habit.color,
        habitCategory: habit.category,
        habitType: habit.type || 'BUILD',
        startDate: habit.startDate || (habit.createdAt ? habit.createdAt.split('T')[0] : todayStr),
        streak: habit.overallStreak || 0,
        completedToday: isDone,
        currentLevel: habit.currentLevel || 0,
        levelProgress: habit.levelProgress || 0,
        targetGoalDays: habit.targetGoalDays || 21,
        history: historyToSync,
        updatedAt: timestamp,
      });

      if (sharedData.targetBuddyUid && sharedData.targetBuddyUid !== ownerUid) {
        targetBuddyUids.add(sharedData.targetBuddyUid);
      }
    }

    // Send real-time check-in notification to each unique accountability buddy
    if (checkInEvent && checkInEvent.status && checkInEvent.status !== 'none') {
      const rawStatus = checkInEvent.status.toLowerCase();
      const isBreak = habit.type === 'BREAK';

      let displayStatus: 'Done' | 'Missed' | 'Controlled' | 'Failed' = 'Done';
      let title = `✅ ${habit.name}: Done`;
      let message = `${ownerName} completed "${habit.name}" today!`;

      if (isBreak) {
        if (rawStatus === 'done' || rawStatus === 'controlled') {
          displayStatus = 'Controlled';
          title = `🛡️ ${habit.name}: Controlled`;
          message = `${ownerName} successfully controlled "${habit.name}" today!`;
        } else {
          displayStatus = 'Failed';
          title = `⚠️ ${habit.name}: Failed`;
          message = `${ownerName} slipped on "${habit.name}" today.`;
        }
      } else {
        if (rawStatus === 'done') {
          displayStatus = 'Done';
          title = `✅ ${habit.name}: Done`;
          message = `${ownerName} completed "${habit.name}" today!`;
        } else {
          displayStatus = 'Missed';
          title = `❌ ${habit.name}: Missed`;
          message = `${ownerName} missed "${habit.name}" today.`;
        }
      }

      const targetDateStr = checkInEvent.dateStr || todayStr;

      for (const targetBuddyUid of targetBuddyUids) {
        // Deterministic document ID per habit, owner, target date ensures idempotency and zero duplicate rows
        const notifDocId = `checkin_${habit.id}_${ownerUid}_${targetDateStr}`;
        const notifDocRef = doc(
          db,
          COLLECTION_USERS,
          targetBuddyUid,
          SUBCOLLECTION_NOTIFICATIONS,
          notifDocId
        );

        const notifPayload: AppNotification = {
          id: notifDocId,
          type: 'buddy_checkin',
          title,
          message,
          senderUid: ownerUid,
          senderName: ownerName,
          senderEmail: ownerEmail,
          senderPhoto: ownerPhoto,
          habitId: habit.id,
          habitName: habit.name,
          checkInStatus: displayStatus,
          status: 'actioned',
          read: false,
          createdAt: timestamp,
        };

        batch.set(notifDocRef, sanitizeForFirestore(notifPayload), { merge: true });
      }
    }
    await batch.commit();
  } catch (error) {
    console.warn('[SharedHabits] Error syncing habit progress to shared records:', error);
  }
}

/**
 * Subscribes to habits shared BY a specific buddy with currentUser
 */
export function subscribeToBuddySharedHabits(
  currentUserUid: string,
  buddyUid: string,
  onUpdate: (habits: SharedHabitRecord[]) => void
): Unsubscribe | null {
  if (!db || !currentUserUid || !buddyUid) return null;

  try {
    const sharedHabitsRef = collection(db, COLLECTION_SHARED_HABITS);
    const q = query(
      sharedHabitsRef,
      where('ownerUid', '==', buddyUid),
      where('targetBuddyUid', '==', currentUserUid)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: SharedHabitRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            habitId: data.habitId || '',
            ownerUid: data.ownerUid || '',
            ownerName: data.ownerName || 'Buddy',
            ownerPhoto: data.ownerPhoto || '',
            targetBuddyUid: data.targetBuddyUid || '',
            habitTitle: data.habitTitle || 'Habit',
            habitIcon: data.habitIcon || 'Sparkles',
            habitColor: data.habitColor || '#10b981',
            habitCategory: data.habitCategory || 'General',
            streak: Number(data.streak) || 0,
            completedToday: Boolean(data.completedToday),
            cadence: data.cadence || 'BUILD',
            currentLevel: Number(data.currentLevel) || 0,
            history: data.history || {},
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('[SharedHabits] Error listening to buddy shared habits:', error);
      }
    );
  } catch (error) {
    console.warn('[SharedHabits] Error creating buddy shared habits subscription:', error);
    return null;
  }
}

/**
 * Subscribes to habits shared BY currentUser with a specific buddy
 */
export function subscribeToMySharedHabitsWithBuddy(
  currentUserUid: string,
  buddyUid: string,
  onUpdate: (habits: SharedHabitRecord[]) => void
): Unsubscribe | null {
  if (!db || !currentUserUid || !buddyUid) return null;

  try {
    const sharedHabitsRef = collection(db, COLLECTION_SHARED_HABITS);
    const q = query(
      sharedHabitsRef,
      where('ownerUid', '==', currentUserUid),
      where('targetBuddyUid', '==', buddyUid)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: SharedHabitRecord[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            habitId: data.habitId || '',
            ownerUid: data.ownerUid || '',
            ownerName: data.ownerName || 'You',
            ownerPhoto: data.ownerPhoto || '',
            targetBuddyUid: data.targetBuddyUid || '',
            habitTitle: data.habitTitle || 'Habit',
            habitIcon: data.habitIcon || 'Sparkles',
            habitColor: data.habitColor || '#10b981',
            habitCategory: data.habitCategory || 'General',
            streak: Number(data.streak) || 0,
            completedToday: Boolean(data.completedToday),
            cadence: data.cadence || 'BUILD',
            currentLevel: Number(data.currentLevel) || 0,
            history: data.history || {},
            updatedAt: data.updatedAt || new Date().toISOString(),
          };
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('[SharedHabits] Error listening to outgoing shared habits:', error);
      }
    );
  } catch (error) {
    console.warn('[SharedHabits] Error creating outgoing shared habits subscription:', error);
    return null;
  }
}

/**
 * Subscribes to all incoming and outgoing shared habits for count badges in Buddy Hub
 */
export function subscribeToAllSharedHabitsForUser(
  currentUserUid: string,
  onUpdate: (habits: { incoming: SharedHabitRecord[]; outgoing: SharedHabitRecord[] }) => void
): Unsubscribe | null {
  if (!db || !currentUserUid) return null;

  try {
    const sharedHabitsRef = collection(db, COLLECTION_SHARED_HABITS);
    let incomingList: SharedHabitRecord[] = [];
    let outgoingList: SharedHabitRecord[] = [];

    const qIn = query(sharedHabitsRef, where('targetBuddyUid', '==', currentUserUid));
    const qOut = query(sharedHabitsRef, where('ownerUid', '==', currentUserUid));

    const unsubIn = onSnapshot(
      qIn,
      (snap) => {
        incomingList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SharedHabitRecord));
        onUpdate({ incoming: incomingList, outgoing: outgoingList });
      },
      (error) => {
        console.warn('[SharedHabits] Error listening to incoming shared habits:', error);
      }
    );

    const unsubOut = onSnapshot(
      qOut,
      (snap) => {
        outgoingList = snap.docs.map((d) => ({ id: d.id, ...d.data() } as SharedHabitRecord));
        onUpdate({ incoming: incomingList, outgoing: outgoingList });
      },
      (error) => {
        console.warn('[SharedHabits] Error listening to outgoing shared habits:', error);
      }
    );

    return () => {
      if (unsubIn) unsubIn();
      if (unsubOut) unsubOut();
    };
  } catch (error) {
    console.warn('[SharedHabits] Error subscribing to all shared habits:', error);
    return null;
  }
}

/**
 * Sends a nudge notification to an active buddy
 */
export async function sendBuddyNudge(
  sender: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null },
  buddyUid: string
): Promise<boolean> {
  if (!db || !sender.uid || !buddyUid) return false;

  try {
    const timestamp = new Date().toISOString();
    const buddyNotifRef = collection(
      db,
      COLLECTION_USERS,
      buddyUid,
      SUBCOLLECTION_NOTIFICATIONS
    );

    await addDoc(
      buddyNotifRef,
      sanitizeForFirestore({
        type: 'buddy_nudge',
        title: '⚡ Habit Nudge!',
        message: `${sender.displayName || 'Your buddy'} gave you an accountability nudge! Keep your streak alive!`,
        senderUid: sender.uid,
        senderName: sender.displayName || 'Flux User',
        senderEmail: sender.email || '',
        senderPhoto: sender.photoURL || '',
        status: 'actioned',
        read: false,
        createdAt: timestamp,
      })
    );

    return true;
  } catch (error) {
    console.error('[Buddy] Error sending buddy nudge:', error);
    throw error;
  }
}

/**
 * Batch marks specified notifications as read
 */
export async function markNotificationsAsRead(
  userId: string,
  notificationIds: string[]
): Promise<boolean> {
  if (!db || !userId || notificationIds.length === 0) return false;

  try {
    const batch = writeBatch(db);
    for (const notifId of notificationIds) {
      const notifRef = doc(
        db,
        COLLECTION_USERS,
        userId,
        SUBCOLLECTION_NOTIFICATIONS,
        notifId
      );
      batch.update(notifRef, { read: true });
    }
    await batch.commit();
    return true;
  } catch (error) {
    console.error('[Notification] Error marking notifications as read:', error);
    return false;
  }
}

/**
 * Subscribes to the user's notifications subcollection in real-time
 */
export function subscribeToNotifications(
  userId: string,
  onUpdate: (notifications: AppNotification[]) => void
): Unsubscribe | null {
  if (!db || !userId) return null;

  try {
    const notifsRef = collection(
      db,
      COLLECTION_USERS,
      userId,
      SUBCOLLECTION_NOTIFICATIONS
    );

    return onSnapshot(
      notifsRef,
      (snapshot) => {
        const notifs: AppNotification[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            type: data.type || 'buddy_invite',
            title: data.title || 'Notification',
            message: data.message || '',
            senderUid: data.senderUid || '',
            senderName: data.senderName || 'User',
            senderEmail: data.senderEmail || '',
            senderPhoto: data.senderPhoto || '',
            inviteId: data.inviteId,
            habitId: data.habitId,
            habitName: data.habitName,
            checkInStatus: data.checkInStatus,
            status: data.status || 'pending',
            read: Boolean(data.read),
            createdAt: data.createdAt || new Date().toISOString(),
          };
        });

        // Sort descending by createdAt
        notifs.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        onUpdate(notifs);
      },
      (error) => {
        console.warn('[Notification] Snapshot listener error:', error);
      }
    );
  } catch (error) {
    console.warn('[Notification] Error establishing notification listener:', error);
    return null;
  }
}

/* =========================================================================
   HABIT-SPECIFIC REFLECTION NOTES PERSISTENCE
   Path: users/{userId}/habits/{habitId}/logs/{dateKey}
   ========================================================================= */

/**
 * Stores a habit-specific miss/check-in reflection note directly in Firestore:
 * Path: `users/{userId}/habits/{habitId}/logs/{dateKey}`
 */
export async function saveHabitLogNote(
  userId: string,
  habitId: string,
  dateKey: string,
  note: string,
  status: CheckInStatus = 'missed'
): Promise<boolean> {
  if (!db || !userId || !habitId || !dateKey) return false;

  try {
    const docRef = doc(
      db,
      COLLECTION_USERS,
      userId,
      'habits',
      habitId,
      'logs',
      dateKey
    );
    const timestamp = new Date().toISOString();
    const payload = sanitizeForFirestore({
      status,
      note: note.trim(),
      updatedAt: timestamp,
    });

    await setDoc(docRef, payload, { merge: true });
    return true;
  } catch (error) {
    console.error('[HabitLog] Error saving habit log reflection note:', error);
    return false;
  }
}

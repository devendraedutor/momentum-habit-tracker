import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Habit, UserSettings } from '../types/habit';

export interface UserCloudData {
  email?: string | null;
  displayName?: string | null;
  habits: Habit[];
  jumboDates: string[];
  settings?: UserSettings;
  updatedAt?: string;
}

const COLLECTION_NAME = 'users';

/**
 * Strips all `undefined` fields recursively so Firestore never throws
 * "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) return null as unknown as T;
  return JSON.parse(JSON.stringify(data));
}

/**
 * Fetches user habits, jumboDates, and settings from Firestore
 */
export async function fetchUserCloudData(uid: string): Promise<UserCloudData | null> {
  if (!db || !uid) return null;

  console.log(`[Sync] Reading from Firestore for UID: ${uid}`);
  try {
    const userDocRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(userDocRef);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserCloudData;
      console.log(`✅ [Sync] Cloud data loaded successfully from Firestore for UID: ${uid}`, {
        habitsCount: data.habits?.length || 0,
        jumboCount: data.jumboDates?.length || 0,
        updatedAt: data.updatedAt,
      });
      return {
        email: data.email ?? '',
        displayName: data.displayName ?? '',
        habits: Array.isArray(data.habits) ? data.habits : [],
        jumboDates: Array.isArray(data.jumboDates) ? data.jumboDates : [],
        settings: data.settings || ({} as UserSettings),
        updatedAt: data.updatedAt,
      };
    }
    console.log(`[Sync] No existing cloud document found for UID: ${uid}`);
    return null;
  } catch (error) {
    console.error('[Sync] Error fetching user cloud data from Firestore:', error);
    return null;
  }
}

/**
 * Saves or updates user habits, jumboDates, and settings in Firestore with merge and sanitization
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
    const userDocRef = doc(db, COLLECTION_NAME, uid);
    const timestamp = new Date().toISOString();
    const rawPayload = {
      ...data,
      updatedAt: timestamp,
    };
    const cleanPayload = sanitizeForFirestore(rawPayload);

    await setDoc(userDocRef, cleanPayload, { merge: true });

    console.log(`☁️ [Sync] Firestore write confirmed at: ${timestamp}`, {
      uid,
      habitsCount: data.habits ? data.habits.length : undefined,
      jumboCount: data.jumboDates ? data.jumboDates.length : undefined,
    });
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
    const userDocRef = doc(db, COLLECTION_NAME, uid);
    return onSnapshot(
      userDocRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as UserCloudData;
          onUpdate({
            email: data.email ?? '',
            displayName: data.displayName ?? '',
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

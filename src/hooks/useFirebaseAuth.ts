import { useState, useEffect, useCallback, useRef } from 'react';
import {
  auth,
  db,
  loginWithGoogle,
  logoutUser,
  onAuthStateChanged,
  doc,
  getDoc,
  setDoc,
  type User,
} from '../lib/firebase';
import {
  subscribeToUserCloudData,
  sanitizeForFirestore,
} from '../lib/firestoreService';
import type { Habit, UserSettings } from '../types/habit';
import {
  saveHabitsToStorage,
  saveSettingsToStorage,
  saveJumboDatesToStorage,
  getAllLocalBetaHabits,
  getAllLocalBetaJumboDates,
} from '../lib/storage';

export type CloudSyncState = 'idle' | 'syncing' | 'synced' | 'error';

interface UseFirebaseAuthProps {
  habits: Habit[];
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  jumboDates: string[];
  setJumboDates: React.Dispatch<React.SetStateAction<string[]>>;
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

export function useFirebaseAuth({
  habits,
  setHabits,
  jumboDates,
  setJumboDates,
  settings,
  setSettings,
}: UseFirebaseAuthProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [syncState, setSyncState] = useState<CloudSyncState>('idle');
  const [migrationToast, setMigrationToast] = useState<string | null>(null);

  // Synchronization locks & equality refs to prevent infinite loop writes
  const hydratedUserIdRef = useRef<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCloudHydratedRef = useRef(false);
  const isSyncingFromCloudRef = useRef(false);
  const lastSavedJsonRef = useRef<string>('');

  const currentHabitsRef = useRef(habits);
  const currentJumboDatesRef = useRef(jumboDates);
  const currentSettingsRef = useRef(settings);

  useEffect(() => {
    currentHabitsRef.current = habits;
  }, [habits]);

  useEffect(() => {
    currentJumboDatesRef.current = jumboDates;
  }, [jumboDates]);

  useEffect(() => {
    currentSettingsRef.current = settings;
  }, [settings]);

  // 1. Firebase Auth listener & Firestore Initial Sync / Beta Migration
  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);

      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (currentUser && db) {
        if (hydratedUserIdRef.current !== currentUser.uid) {
          hydratedUserIdRef.current = currentUser.uid;
          isCloudHydratedRef.current = false;
          setSyncState('syncing');

          try {
            console.log(`[Sync] Reading from Firestore for UID: ${currentUser.uid}`);

            // 1. Inspect localStorage for existing habits BEFORE processing Firestore
            const localHabits =
              currentHabitsRef.current.length > 0
                ? currentHabitsRef.current
                : getAllLocalBetaHabits();

            const localJumbo =
              currentJumboDatesRef.current.length > 0
                ? currentJumboDatesRef.current
                : getAllLocalBetaJumboDates();

            const localSettings = currentSettingsRef.current;

            const userDocRef = doc(db, 'users', currentUser.uid);
            const docSnap = await getDoc(userDocRef);

            if (docSnap.exists()) {
              const data = docSnap.data();
              const cloudHabits = Array.isArray(data.habits) ? data.habits : [];
              const cloudJumbo = Array.isArray(data.jumboDates) ? data.jumboDates : [];
              const cloudSettings = (data.settings && typeof data.settings === 'object') ? data.settings : {};

              if (cloudHabits.length > 0) {
                // Cloud document has populated data: Hydrate state
                lastSavedJsonRef.current = JSON.stringify({
                  habits: cloudHabits,
                  jumboDates: cloudJumbo,
                  settings: cloudSettings,
                });
                isSyncingFromCloudRef.current = true;

                setHabits(cloudHabits);
                setJumboDates(cloudJumbo);
                if (Object.keys(cloudSettings).length > 0) {
                  setSettings((prev) => ({ ...prev, ...cloudSettings }));
                }

                saveHabitsToStorage(cloudHabits, currentUser.uid);
                saveJumboDatesToStorage(cloudJumbo, currentUser.uid);
                if (Object.keys(cloudSettings).length > 0) {
                  saveSettingsToStorage(cloudSettings, currentUser.uid);
                }

                console.log('✅ [Sync] Cloud data loaded successfully from Firestore for UID:', currentUser.uid);
                setSyncState('synced');
              } else if (localHabits.length > 0) {
                // Cloud document exists but has 0 habits, while localStorage HAS habits:
                // Migrate local habits into cloud to prevent data loss (NEVER call setHabits([]))
                console.log(`[Sync] Empty cloud habits detected. Migrating ${localHabits.length} local habits to Firestore for UID: ${currentUser.uid}`);

                const payload = {
                  email: currentUser.email ?? '',
                  displayName: currentUser.displayName ?? '',
                  habits: localHabits,
                  jumboDates: localJumbo,
                  settings: localSettings ?? {},
                  updatedAt: new Date().toISOString(),
                };
                const cleanPayload = sanitizeForFirestore(payload);
                await setDoc(userDocRef, cleanPayload, { merge: true });

                lastSavedJsonRef.current = JSON.stringify({
                  habits: localHabits,
                  jumboDates: localJumbo,
                  settings: localSettings ?? {},
                });

                isSyncingFromCloudRef.current = true;
                setHabits(localHabits);
                setJumboDates(localJumbo);
                saveHabitsToStorage(localHabits, currentUser.uid);
                saveJumboDatesToStorage(localJumbo, currentUser.uid);

                localStorage.setItem('flux_migrated', 'true');
                setMigrationToast('✨ Beta data successfully linked to your Google Account!');
                setTimeout(() => setMigrationToast(null), 5000);
                setSyncState('synced');
              } else {
                // Both cloud and local are empty: Fresh state
                lastSavedJsonRef.current = JSON.stringify({
                  habits: [],
                  jumboDates: [],
                  settings: cloudSettings,
                });
                setSyncState('synced');
              }
            } else {
              // 2. Brand new user profile: Migrate all localStorage habits into Firestore
              console.log(
                `[Sync] No cloud document for UID: ${currentUser.uid}. Migrating local data (${localHabits.length} habits)...`
              );

              const payload = {
                email: currentUser.email ?? '',
                displayName: currentUser.displayName ?? '',
                habits: localHabits ?? [],
                jumboDates: localJumbo ?? [],
                settings: localSettings ?? {},
                updatedAt: new Date().toISOString(),
              };
              const cleanPayload = sanitizeForFirestore(payload);

              await setDoc(userDocRef, cleanPayload);

              lastSavedJsonRef.current = JSON.stringify({
                habits: localHabits ?? [],
                jumboDates: localJumbo ?? [],
                settings: localSettings ?? {},
              });

              if (localHabits.length > 0) {
                isSyncingFromCloudRef.current = true;
                setHabits(localHabits);
                setJumboDates(localJumbo);
                saveHabitsToStorage(localHabits, currentUser.uid);
                saveJumboDatesToStorage(localJumbo, currentUser.uid);
                localStorage.setItem('flux_migrated', 'true');
                setMigrationToast('✨ Beta data successfully linked to your Google Account!');
                setTimeout(() => setMigrationToast(null), 5000);
              }

              console.log('✅ [Sync] Initialized new user profile in Firestore for UID:', currentUser.uid);
              setSyncState('synced');
            }
          } catch (err) {
            console.error('[Sync] Error during initial Firestore hydration:', err);
            // Fallback to local habits if network fails - NEVER set habits to empty
            const localFallback = getAllLocalBetaHabits();
            if (localFallback.length > 0) {
              setHabits(localFallback);
            }
            setSyncState('error');
          } finally {
            // Mark cloud hydration complete so future user changes trigger autosave
            isCloudHydratedRef.current = true;
          }

          // Real-time Firestore snapshot listener across tabs/devices
          const unsub = subscribeToUserCloudData(currentUser.uid, (incoming) => {
            if (!isCloudHydratedRef.current) return;

            const incomingPayloadJson = JSON.stringify({
              habits: incoming.habits || [],
              jumboDates: incoming.jumboDates || [],
              settings: incoming.settings || {},
            });

            // Prevent re-processing snapshot if data is identical to what we just saved
            if (incomingPayloadJson === lastSavedJsonRef.current) {
              return;
            }

            isSyncingFromCloudRef.current = true;
            lastSavedJsonRef.current = incomingPayloadJson;

            if (incoming.habits) {
              setHabits(incoming.habits);
              saveHabitsToStorage(incoming.habits, currentUser.uid);
            }
            if (incoming.jumboDates) {
              setJumboDates(incoming.jumboDates);
              saveJumboDatesToStorage(incoming.jumboDates, currentUser.uid);
            }
            if (incoming.settings) {
              setSettings((prev) => ({ ...prev, ...incoming.settings }));
              saveSettingsToStorage(incoming.settings, currentUser.uid);
            }
          });
          if (unsub) unsubscribeSnapshot = unsub;
        }
      } else {
        hydratedUserIdRef.current = null;
        isCloudHydratedRef.current = false;
        lastSavedJsonRef.current = '';
        isSyncingFromCloudRef.current = false;
        setSyncState('idle');
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, [setHabits, setJumboDates, setSettings]);

  // 2. Debounced (1000ms) Autosave to Firestore on Habit / Jumbo / Settings change
  useEffect(() => {
    if (!user || !db || !isCloudHydratedRef.current) return;

    // Save to local cache immediately
    saveHabitsToStorage(habits, user.uid);
    saveJumboDatesToStorage(jumboDates, user.uid);
    saveSettingsToStorage(settings, user.uid);

    // If this state update was triggered by an incoming cloud sync, consume the lock and skip writing back
    if (isSyncingFromCloudRef.current) {
      isSyncingFromCloudRef.current = false;
      return;
    }

    const currentPayloadJson = JSON.stringify({
      habits,
      jumboDates,
      settings,
    });

    // Strict equality check: If payload has not changed since last saved state, abort write
    if (lastSavedJsonRef.current === currentPayloadJson) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    setSyncState('syncing');

    debounceTimerRef.current = setTimeout(async () => {
      if (!db || !user || !isCloudHydratedRef.current) return;

      // Re-check before executing network write
      if (lastSavedJsonRef.current === currentPayloadJson) {
        setSyncState('synced');
        return;
      }

      try {
        const userDocRef = doc(db, 'users', user.uid);
        const timestamp = new Date().toISOString();

        const payload = {
          email: user.email ?? '',
          displayName: user.displayName ?? '',
          habits: habits ?? [],
          jumboDates: jumboDates ?? [],
          settings: settings ?? {},
          updatedAt: timestamp,
        };
        const cleanPayload = sanitizeForFirestore(payload);

        await setDoc(userDocRef, cleanPayload, { merge: true });
        lastSavedJsonRef.current = currentPayloadJson;

        console.log('☁️ [Sync] Firestore write confirmed at:', timestamp, {
          uid: user.uid,
          habitsCount: habits.length,
          jumboDatesCount: jumboDates.length,
        });

        setSyncState('synced');
      } catch (err) {
        console.error('☁️ [Sync] Firestore write error:', err);
        setSyncState('error');
      }
    }, 1000);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [habits, jumboDates, settings, user]);

  const handleLogin = useCallback(async () => {
    setIsSigningIn(true);

    const timeoutPromise = new Promise<null>((_, reject) =>
      setTimeout(
        () =>
          reject(
            new Error(
              'Sign-in timed out. Please check if the popup was blocked by your browser.'
            )
          ),
        25000
      )
    );

    try {
      const loggedInUser = await Promise.race([loginWithGoogle(), timeoutPromise]);
      return loggedInUser;
    } catch (error: unknown) {
      const err = error as Error;
      console.warn('Firebase Google Sign-In notice:', err.message);
      if (err.message.includes('timed out')) {
        alert(err.message);
      }
      return null;
    } finally {
      setIsSigningIn(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await logoutUser();
      setUser(null);
      hydratedUserIdRef.current = null;
      isCloudHydratedRef.current = false;
      lastSavedJsonRef.current = '';
      isSyncingFromCloudRef.current = false;
      setSyncState('idle');
    } catch (error) {
      console.error('Firebase Sign-Out error:', error);
      throw error;
    }
  }, []);

  return {
    user,
    isLoading,
    isSigningIn,
    syncState,
    migrationToast,
    loginWithGoogle: handleLogin,
    logout: handleLogout,
  };
}

import { useState, useEffect, useCallback } from 'react';
import type { Habit, UserSettings, ChartTimeRange, CheckInStatus } from './types/habit';
import {
  loadHabitsFromStorage,
  saveHabitsToStorage,
  loadSettingsFromStorage,
  saveSettingsToStorage,
  loadJumboDatesFromStorage,
  saveJumboDatesToStorage,
  reconcileJumboDate,
} from './lib/storage';
import {
  getTesterById,
  getActiveSessionUserId,
  clearActiveSession,
  type Tester,
} from './config/testers';
import { sound } from './lib/audio';
import { getTodayString, calculateHabitStats } from './lib/momentum';
import { Navbar } from './components/Navbar';
import { HabitReelDeck } from './components/HabitReelDeck';

import { HabitFormModal } from './components/HabitFormModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { MilestoneAscensionModal } from './components/MilestoneAscensionModal';
import { JumboUnlockModal } from './components/JumboUnlockModal';
import { HabitDirectoryModal } from './components/HabitDirectoryModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthGateModal } from './components/AuthGateModal';
import { HabitLaunchCelebration } from './components/HabitLaunchCelebration';
import confetti from 'canvas-confetti';

export function App() {
  // Active Tester Session State
  const [activeTester, setActiveTester] = useState<Tester | null>(() =>
    getTesterById(getActiveSessionUserId())
  );

  const [habits, setHabits] = useState<Habit[]>(() =>
    loadHabitsFromStorage(activeTester?.id)
  );
  const [settings, setSettings] = useState<UserSettings>(() =>
    loadSettingsFromStorage(activeTester?.id)
  );
  const [jumboDates, setJumboDates] = useState<string[]>(() =>
    loadJumboDatesFromStorage(activeTester?.id)
  );

  // Active logging date (defaults to today, switchable for testing multi-day histories)
  const [activeDateStr, setActiveDateStr] = useState<string>(() => getTodayString());

  // Hub, Detail, Directory & Settings Modal states
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailHabit, setSelectedDetailHabit] = useState<Habit | null>(null);
  const [ascendHabit, setAscendHabit] = useState<Habit | null>(null);
  const [isJumboUnlockModalOpen, setIsJumboUnlockModalOpen] = useState(false);
  const [habitCreatedCelebration, setHabitCreatedCelebration] = useState<{
    habitName: string;
    habitIcon: string;
    habitColor: string;
  } | null>(null);

  // Chart state for Hub
  const [selectedChartHabitId, setSelectedChartHabitId] = useState<string | 'all'>('all');
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('30d');

  // Login handler when passkey is validated in AuthGateModal
  const handleLogin = useCallback((tester: Tester) => {
    setActiveTester(tester);
    setHabits(loadHabitsFromStorage(tester.id));
    setSettings(loadSettingsFromStorage(tester.id));
    setJumboDates(loadJumboDatesFromStorage(tester.id));
    if (settings.soundEffects) {
      sound.playMilestone();
    }
  }, [settings.soundEffects]);

  // Logout / Switch Profile handler
  const handleLogout = useCallback(() => {
    clearActiveSession();
    setActiveTester(null);
    setIsHubOpen(false);
    setIsDirectoryOpen(false);
    setIsSettingsOpen(false);
    setIsHabitFormOpen(false);
    setIsDetailModalOpen(false);
    setEditingHabit(null);
    setSelectedDetailHabit(null);
  }, []);

  // Theme synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  // Save to namespaced localStorage whenever habits, settings, or jumboDates change
  useEffect(() => {
    if (activeTester) {
      saveHabitsToStorage(habits, activeTester.id);
    }
  }, [habits, activeTester]);

  useEffect(() => {
    if (activeTester) {
      saveSettingsToStorage(settings, activeTester.id);
    }
  }, [settings, activeTester]);

  useEffect(() => {
    if (activeTester) {
      saveJumboDatesToStorage(jumboDates, activeTester.id);
    }
  }, [jumboDates, activeTester]);

  // Sync active detail habit if updated
  useEffect(() => {
    if (selectedDetailHabit) {
      const updated = habits.find((h) => h.id === selectedDetailHabit.id);
      if (updated) {
        setSelectedDetailHabit(updated);
      }
    }
  }, [habits, selectedDetailHabit]);

  // Base browser history initialization
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ activeDate: activeDateStr }, '');
    }
  }, []);

  // System PopState (Android Back / Browser Back) Listener
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;

      // Close any active modal on system back
      setIsDetailModalOpen(false);
      setSelectedDetailHabit(null);
      setIsDirectoryOpen(false);
      setIsSettingsOpen(false);
      setIsHabitFormOpen(false);
      setEditingHabit(null);
      setIsHubOpen(false);
      setAscendHabit(null);
      setIsJumboUnlockModalOpen(false);

      // Restore active date if the state has a recorded date
      if (state?.activeDate) {
        setActiveDateStr(state.activeDate);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Modal Open/Close helpers synchronized with browser/system history
  const openDetailModal = useCallback(
    (habit: Habit) => {
      setSelectedDetailHabit(habit);
      setIsDetailModalOpen(true);
      window.history.pushState({ activeDate: activeDateStr, modal: 'detail', habitId: habit.id }, '');
    },
    [activeDateStr]
  );

  const closeDetailModal = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedDetailHabit(null);
    if (window.history.state?.modal === 'detail') {
      window.history.back();
    }
  }, []);

  const openDirectory = useCallback(() => {
    setIsDirectoryOpen(true);
    window.history.pushState({ activeDate: activeDateStr, modal: 'directory' }, '');
  }, [activeDateStr]);

  const closeDirectory = useCallback(() => {
    setIsDirectoryOpen(false);
    if (window.history.state?.modal === 'directory') {
      window.history.back();
    }
  }, []);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
    window.history.pushState({ activeDate: activeDateStr, modal: 'settings' }, '');
  }, [activeDateStr]);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
    if (window.history.state?.modal === 'settings') {
      window.history.back();
    }
  }, []);

  const openHabitForm = useCallback(
    (habit: Habit | null = null) => {
      setEditingHabit(habit);
      setIsHabitFormOpen(true);
      window.history.pushState({ activeDate: activeDateStr, modal: 'habit-form' }, '');
    },
    [activeDateStr]
  );

  const closeHabitForm = useCallback(() => {
    setIsHabitFormOpen(false);
    setEditingHabit(null);
    if (window.history.state?.modal === 'habit-form') {
      window.history.back();
    }
  }, []);

  const openHub = useCallback(() => {
    setIsHubOpen(true);
    window.history.pushState({ activeDate: activeDateStr, modal: 'hub' }, '');
  }, [activeDateStr]);

  const handleSelectHabitFromDirectory = useCallback(
    (habit: Habit) => {
      setSelectedChartHabitId(habit.id);
      setIsDirectoryOpen(false);
      setIsHubOpen(true);
      window.history.replaceState({ activeDate: activeDateStr, modal: 'hub', habitId: habit.id }, '');
    },
    [activeDateStr]
  );

  const closeHub = useCallback(() => {
    setIsHubOpen(false);
    if (window.history.state?.modal === 'hub') {
      window.history.back();
    }
  }, []);

  const openAscendModal = useCallback(
    (habit: Habit) => {
      setAscendHabit(habit);
      window.history.pushState({ activeDate: activeDateStr, modal: 'ascend' }, '');
    },
    [activeDateStr]
  );

  const closeAscendModal = useCallback(() => {
    setAscendHabit(null);
    if (window.history.state?.modal === 'ascend') {
      window.history.back();
    }
  }, []);

  const closeJumboUnlockModal = useCallback(() => {
    setIsJumboUnlockModalOpen(false);
    if (window.history.state?.modal === 'jumbo-unlock') {
      window.history.back();
    }
  }, []);

  const handleSelectDate = useCallback(
    (newDate: string) => {
      if (newDate !== activeDateStr) {
        window.history.pushState({ activeDate: newDate }, '');
        setActiveDateStr(newDate);
      }
    },
    [activeDateStr]
  );

  // Check-in logic for a specific date (and automatic Jumbo Point award/reconcile)
  const handleCheckIn = useCallback(
    (habitId: string, status: CheckInStatus, dateStr?: string) => {
      const targetDate = dateStr || activeDateStr;

      setHabits((prev) => {
        const nextHabits = prev.map((h) => {
          if (h.id !== habitId) return h;
          const newHistory = { ...h.history };
          if (status === 'none' || !status) {
            delete newHistory[targetDate];
          } else {
            newHistory[targetDate] = status;
          }
          return {
            ...h,
            history: newHistory,
          };
        });

        // Reconcile Jumbo Point for this specific target date
        const activeOnly = nextHabits.filter((h) => !h.archived);
        setJumboDates((prevJumbo) => {
          const { updatedJumboDates, wasAwarded } = reconcileJumboDate(targetDate, activeOnly, prevJumbo);
          if (wasAwarded) {
            // Special celebration for Jumbo Point unlocked!
            if (settings.soundEffects) sound.playMilestone();
            confetti({
              particleCount: 80,
              spread: 90,
              origin: { y: 0.5 },
              colors: ['#f59e0b', '#fbbf24', '#10b981', '#06b6d4'],
            });
          }
          return updatedJumboDates;
        });

        return nextHabits;
      });

      if (settings.soundEffects) {
        if (status === 'done') sound.playDone();
        else if (status === 'missed') sound.playMissed();
      }

      if (status === 'done' && settings.confetti) {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.65 },
          colors: ['#10b981', '#06b6d4', '#6366f1'],
        });
      }
    },
    [activeDateStr, settings]
  );

  // Batch commit multiple modifications at once
  const handleBatchSave = useCallback((updates: Record<string, CheckInStatus>, dateStr: string) => {
    setHabits((prev) => {
      const nextHabits = prev.map((h) => {
        const newStatus = updates[h.id];
        if (!newStatus) return h;
        const newHistory = { ...h.history };
        if (newStatus === 'none') {
          delete newHistory[dateStr];
        } else {
          newHistory[dateStr] = newStatus;
        }
        return {
          ...h,
          history: newHistory,
        };
      });

      const activeOnly = nextHabits.filter((h) => !h.archived);
      setJumboDates((prevJumbo) => {
        const { updatedJumboDates, wasAwarded } = reconcileJumboDate(dateStr, activeOnly, prevJumbo);
        if (wasAwarded) {
          confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.5 },
            colors: ['#f59e0b', '#fbbf24', '#10b981'],
          });
        }
        return updatedJumboDates;
      });

      return nextHabits;
    });
  }, []);

  // Granular Reset Options:
  // 1. Clear check-in history only (keeps habits intact)
  const handleClearHistoryOnly = useCallback(() => {
    setHabits((prev) =>
      prev.map((h) => ({
        ...h,
        history: {},
      }))
    );
    setJumboDates([]);
    if (settings.soundEffects) sound.playUndo();
  }, [settings]);

  // 2. Clear today's / active date check-ins only
  const handleResetActiveDateCheckIns = useCallback(() => {
    setHabits((prev) =>
      prev.map((h) => {
        const newHistory = { ...h.history };
        delete newHistory[activeDateStr];
        return {
          ...h,
          history: newHistory,
        };
      })
    );
    setJumboDates((prev) => prev.filter((d) => d !== activeDateStr));
    if (settings.soundEffects) sound.playUndo();
  }, [activeDateStr, settings]);

  // 3. Factory Reset (clears everything)
  const handleFactoryReset = useCallback(() => {
    setHabits([]);
    setJumboDates([]);
    localStorage.clear();
  }, []);

  // Save / Update Habit
  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'history'> & { id?: string; startDate?: string }) => {
    if (habitData.id) {
      // Update existing habit
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitData.id
            ? {
                ...h,
                name: habitData.name,
                description: habitData.description,
                category: habitData.category,
                icon: habitData.icon,
                color: habitData.color,
                type: habitData.type || h.type || 'BUILD',
                targetGoalDays: habitData.targetGoalDays || 21,
                startDate: habitData.startDate || h.startDate || getTodayString(),
              }
            : h
        )
      );
    } else {
      // Create brand new habit
      const newHabit: Habit = {
        id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        name: habitData.name,
        description: habitData.description,
        category: habitData.category,
        icon: habitData.icon,
        color: habitData.color,
        type: habitData.type || 'BUILD',
        targetGoalDays: habitData.targetGoalDays || 21,
        startDate: habitData.startDate || getTodayString(),
        createdAt: habitData.startDate || getTodayString(),
        archived: false,
        history: {},
      };
      setHabits((prev) => [newHabit, ...prev]);

      const currentActiveCount = habits.filter((h) => !h.archived).length;
      if (currentActiveCount + 1 >= 3) {
        const hasSeenIntro = localStorage.getItem('momentum_jumbo_intro_seen');
        if (!hasSeenIntro) {
          localStorage.setItem('momentum_jumbo_intro_seen', 'true');
          setTimeout(() => {
            setIsJumboUnlockModalOpen(true);
          }, 350);
        }
      }

      // Trigger distinct 400ms Habit Launch celebration
      setHabitCreatedCelebration({
        habitName: newHabit.name,
        habitIcon: newHabit.icon,
        habitColor: newHabit.color,
      });

      if (settings.soundEffects) {
        sound.playHabitLaunch();
      }
    }
    closeHabitForm();
  };

  const handleArchiveHabit = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, archived: !h.archived } : h))
    );
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    if (selectedDetailHabit?.id === habitId) {
      closeDetailModal();
    }
    if (selectedChartHabitId === habitId) {
      setSelectedChartHabitId('all');
    }
  };

  // Ascend habit milestone level up handler
  const handleAscendHabit = useCallback(
    (habitId: string, newTargetDays: number, bonusXP: number) => {
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          const currentTier = h.currentTier || 1;
          const currentTarget = h.targetGoalDays || 21;
          const milestones = (h.milestonesCompleted || 0) + 1;
          const prevTargets = h.previousTargets || [];
          const stats = calculateHabitStats(h, false);

          return {
            ...h,
            currentTier: currentTier + 1,
            tierStartStreak: stats.currentStreak,
            milestonesCompleted: milestones,
            previousTargets: [...prevTargets, currentTarget],
            targetGoalDays: newTargetDays,
            bonusXP: (h.bonusXP || 0) + bonusXP,
          };
        })
      );
    },
    []
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Closed Beta Access Gate Modal */}
      <AuthGateModal
        key={activeTester ? `session-${activeTester.id}` : 'auth-gate-logged-out'}
        isOpen={!activeTester}
        onSuccess={handleLogin}
      />

      {/* Top Navigation with glowing Jumbo Points Counter */}
      <Navbar
        habits={habits}
        jumboPointsCount={jumboDates.length}
        tester={activeTester}
        onOpenNewHabit={() => openHabitForm(null)}
        onOpenDirectory={openDirectory}
        onOpenSettings={openSettings}
        onLogout={handleLogout}
      />

      {/* Main Reel Card Deck Showcase */}
      <main className="w-full max-w-md sm:max-w-lg mx-auto flex-1 flex flex-col justify-center items-center py-3 sm:py-6 px-2 sm:px-4">
        <HabitReelDeck
          habits={habits}
          activeDateStr={activeDateStr}
          onSelectDate={handleSelectDate}
          onCheckIn={handleCheckIn}
          onBatchSave={handleBatchSave}
          onOpenNewHabit={() => openHabitForm(null)}
          onOpenDetail={openDetailModal}
          onOpenHub={openHub}
          onAscendHabit={openAscendModal}
          jumboPointsCount={jumboDates.length}
          floorAtZero={settings.floorAtZero}
        />
      </main>




      {/* Habit Create / Edit Modal (Mounts fresh instance with today's date) */}
      {isHabitFormOpen && (
        <HabitFormModal
          key={editingHabit ? `edit-${editingHabit.id}` : `new-habit-${Date.now()}`}
          isOpen={isHabitFormOpen}
          onClose={closeHabitForm}
          onSave={handleSaveHabit}
          initialHabit={editingHabit}
          defaultStartDate={getTodayString()}
        />
      )}

      {/* Single Habit Detail View */}
      <HabitDetailModal
        habit={selectedDetailHabit}
        isOpen={isDetailModalOpen}
        onClose={closeDetailModal}
        onCheckInDate={(hId, dStr, st) => handleCheckIn(hId, st, dStr)}
        onSelectDate={handleSelectDate}
        onEdit={openHabitForm}
        onArchive={handleArchiveHabit}
        onDelete={handleDeleteHabit}
        activeDateStr={activeDateStr}
        floorAtZero={settings.floorAtZero}
        theme={settings.theme}
      />

      {/* Milestone Ascension & Level Up Modal */}
      <MilestoneAscensionModal
        habit={ascendHabit}
        isOpen={!!ascendHabit}
        onClose={closeAscendModal}
        onAscend={handleAscendHabit}
      />

      {/* Gamified Jumbo Points 3-Habit Unlock Ceremony Modal */}
      <JumboUnlockModal
        isOpen={isJumboUnlockModalOpen}
        onClose={closeJumboUnlockModal}
        activeHabitsCount={habits.filter((h) => !h.archived).length}
      />

      {/* Dedicated Habit Directory & Management Modal (No Settings / Analytics clutter) */}
      <HabitDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={closeDirectory}
        habits={habits}
        onOpenNewHabit={() => openHabitForm(null)}
        onEditHabit={openHabitForm}
        onDeleteHabit={handleDeleteHabit}
        onSelectHabitProfile={handleSelectHabitFromDirectory}
        floorAtZero={settings.floorAtZero}
      />

      {/* System Settings, Backups & Data Erasure Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={closeSettings}
        habits={habits}
        settings={settings}
        tester={activeTester}
        onLogout={handleLogout}
        jumboDates={jumboDates}
        onUpdateSettings={setSettings}
        onRestoreHabits={setHabits}
        onRestoreJumboDates={setJumboDates}
        onClearHistoryOnly={handleClearHistoryOnly}
        onFactoryReset={handleFactoryReset}
      />

      {/* Distinct 400ms Habit Launch Shockwave & Energy Burst Celebration */}
      {habitCreatedCelebration && (
        <HabitLaunchCelebration
          habitName={habitCreatedCelebration.habitName}
          habitIcon={habitCreatedCelebration.habitIcon}
          habitColor={habitCreatedCelebration.habitColor}
          onComplete={() => setHabitCreatedCelebration(null)}
        />
      )}
    </div>
  );
}

export default App;

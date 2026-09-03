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
import { sound } from './lib/audio';
import { getTodayString, calculateHabitStats } from './lib/momentum';
import { Navbar } from './components/Navbar';
import { HabitReelDeck } from './components/HabitReelDeck';
import { CornerHubModal } from './components/CornerHubModal';
import { HabitFormModal } from './components/HabitFormModal';
import { HabitDetailModal } from './components/HabitDetailModal';
import { MilestoneAscensionModal } from './components/MilestoneAscensionModal';
import confetti from 'canvas-confetti';

export function App() {
  const [habits, setHabits] = useState<Habit[]>(() => loadHabitsFromStorage());
  const [settings, setSettings] = useState<UserSettings>(() => loadSettingsFromStorage());
  const [jumboDates, setJumboDates] = useState<string[]>(() => loadJumboDatesFromStorage());

  // Active logging date (defaults to today, switchable for testing multi-day histories)
  const [activeDateStr, setActiveDateStr] = useState<string>(() => getTodayString());

  // Hub, Detail, & Ascension Modal states
  const [isHubOpen, setIsHubOpen] = useState(false);
  const [isHabitFormOpen, setIsHabitFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDetailHabit, setSelectedDetailHabit] = useState<Habit | null>(null);
  const [ascendHabit, setAscendHabit] = useState<Habit | null>(null);

  // Chart state for Hub
  const [selectedChartHabitId, setSelectedChartHabitId] = useState<string | 'all'>('all');
  const [timeRange, setTimeRange] = useState<ChartTimeRange>('30d');

  // Theme synchronization
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [settings.theme]);

  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === 'dark' ? 'light' : 'dark',
    }));
  }, []);

  // Save to localStorage whenever habits, settings, or jumboDates change
  useEffect(() => {
    saveHabitsToStorage(habits);
  }, [habits]);

  useEffect(() => {
    saveSettingsToStorage(settings);
  }, [settings]);

  useEffect(() => {
    saveJumboDatesToStorage(jumboDates);
  }, [jumboDates]);

  // Sync active detail habit if updated
  useEffect(() => {
    if (selectedDetailHabit) {
      const updated = habits.find((h) => h.id === selectedDetailHabit.id);
      if (updated) {
        setSelectedDetailHabit(updated);
      }
    }
  }, [habits, selectedDetailHabit]);

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
  const handleSaveHabit = (habitData: Omit<Habit, 'id' | 'createdAt' | 'history'> & { id?: string }) => {
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
        createdAt: getTodayString(),
        archived: false,
        history: {},
      };
      setHabits((prev) => [newHabit, ...prev]);

      if (settings.soundEffects) {
        sound.playMilestone();
      }
    }
  };

  const handleArchiveHabit = (habitId: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, archived: !h.archived } : h))
    );
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    if (selectedDetailHabit?.id === habitId) {
      setIsDetailModalOpen(false);
      setSelectedDetailHabit(null);
    }
    if (selectedChartHabitId === habitId) {
      setSelectedChartHabitId('all');
    }
  };

  const handleAscendHabit = useCallback(
    (habitId: string, newTargetDays: number, bonusXP: number) => {
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id !== habitId) return h;
          const currentTier = h.currentTier || 1;
          const prevTargets = h.previousTargets || [];
          const currentTarget = h.targetGoalDays || 21;
          const milestones = (h.milestonesCompleted || 0) + 1;
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      {/* Top Navigation with glowing Jumbo Points Counter */}
      <Navbar
        habits={habits}
        jumboPointsCount={jumboDates.length}
        theme={settings.theme}
        onToggleTheme={toggleTheme}
        onOpenNewHabit={() => {
          setEditingHabit(null);
          setIsHabitFormOpen(true);
        }}
        onOpenHub={() => setIsHubOpen(true)}
      />

      {/* Main Reel Card Deck Showcase */}
      <main className="flex-1 flex flex-col justify-center items-center py-4 sm:py-8">
        <HabitReelDeck
          habits={habits}
          activeDateStr={activeDateStr}
          onSelectDate={setActiveDateStr}
          onCheckIn={handleCheckIn}
          onBatchSave={handleBatchSave}
          onOpenNewHabit={() => {
            setEditingHabit(null);
            setIsHabitFormOpen(true);
          }}
          onOpenDetail={(habit) => {
            setSelectedDetailHabit(habit);
            setIsDetailModalOpen(true);
          }}
          onOpenHub={() => setIsHubOpen(true)}
          onAscendHabit={(h) => setAscendHabit(h)}
          jumboPointsCount={jumboDates.length}
          floorAtZero={settings.floorAtZero}
        />
      </main>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-slate-400 dark:text-slate-500 font-mono border-t border-slate-200 dark:border-slate-800">
        <p>Momentum Habit Tracker • Daily Score Momentum • Instant Multi-Day Testing</p>
      </footer>

      {/* Corner Hub & Analytics Drawer */}
      <CornerHubModal
        isOpen={isHubOpen}
        onClose={() => setIsHubOpen(false)}
        habits={habits}
        settings={settings}
        jumboPointsCount={jumboDates.length}
        onUpdateSettings={setSettings}
        onOpenNewHabit={() => {
          setEditingHabit(null);
          setIsHabitFormOpen(true);
        }}
        onEditHabit={(h) => {
          setEditingHabit(h);
          setIsHabitFormOpen(true);
        }}
        onArchiveHabit={handleArchiveHabit}
        onDeleteHabit={handleDeleteHabit}
        onRestoreHabits={setHabits}
        onClearHistoryOnly={handleClearHistoryOnly}
        onResetActiveDateCheckIns={handleResetActiveDateCheckIns}
        onFactoryReset={handleFactoryReset}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        selectedChartHabitId={selectedChartHabitId}
        onSelectChartHabitId={setSelectedChartHabitId}
        onSelectHabitProfile={(h) => {
          setSelectedDetailHabit(h);
          setIsDetailModalOpen(true);
        }}
      />

      {/* Habit Create / Edit Modal (Key ensures fresh form state every time) */}
      <HabitFormModal
        key={editingHabit ? `edit-${editingHabit.id}` : 'new-habit'}
        isOpen={isHabitFormOpen}
        onClose={() => {
          setIsHabitFormOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        initialHabit={editingHabit}
      />

      {/* Single Habit Detail View */}
      <HabitDetailModal
        habit={selectedDetailHabit}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedDetailHabit(null);
        }}
        onCheckInDate={(hId, dStr, st) => handleCheckIn(hId, st, dStr)}
        onEdit={(h) => {
          setIsDetailModalOpen(false);
          setEditingHabit(h);
          setIsHabitFormOpen(true);
        }}
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
        onClose={() => setAscendHabit(null)}
        onAscend={handleAscendHabit}
      />
    </div>
  );
}

export default App;

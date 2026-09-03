import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Habit, CheckInStatus } from '../types/habit';
import { getTodayString, calculateHabitStats } from '../lib/momentum';
import { DynamicIcon } from './DynamicIcon';
import { Check, X, ArrowLeft, ArrowRight, Sparkles, Moon, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface NightlyRoutineModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onCheckIn: (habitId: string, status: CheckInStatus) => void;
  onUndo: (habitId: string) => void;
  soundEnabled: boolean;
  confettiEnabled: boolean;
  floorAtZero?: boolean;
}

export const NightlyRoutineModal: React.FC<NightlyRoutineModalProps> = ({
  isOpen,
  onClose,
  habits,
  onCheckIn,
  onUndo,
  confettiEnabled,
  floorAtZero = false,
}) => {
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const todayStr = getTodayString();

  useEffect(() => {
    if (isOpen && activeHabits.length > 0) {
      const firstUnlogged = activeHabits.findIndex((h) => !h.history[todayStr]);
      setCurrentIndex(firstUnlogged !== -1 ? firstUnlogged : 0);
    }
  }, [isOpen, activeHabits, todayStr]);

  const currentHabit = activeHabits[currentIndex];
  const todayStatus = currentHabit ? currentHabit.history[todayStr] : undefined;
  const isLogged = todayStatus === 'done' || todayStatus === 'missed';

  const totalCompleted = activeHabits.filter((h) => h.history[todayStr] === 'done').length;
  const totalMissed = activeHabits.filter((h) => h.history[todayStr] === 'missed').length;
  const totalLogged = totalCompleted + totalMissed;
  const allDone = activeHabits.length > 0 && totalLogged === activeHabits.length;

  const triggerConfetti = useCallback(() => {
    if (!confettiEnabled) return;
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#06b6d4', '#6366f1', '#f59e0b'],
    });
  }, [confettiEnabled]);

  const handleAction = useCallback((status: CheckInStatus) => {
    if (!currentHabit) return;
    onCheckIn(currentHabit.id, status);

    setTimeout(() => {
      if (currentIndex < activeHabits.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (totalLogged + 1 === activeHabits.length) {
        triggerConfetti();
      }
    }, 200);
  }, [currentHabit, currentIndex, activeHabits.length, onCheckIn, totalLogged, triggerConfetti]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (currentIndex < activeHabits.length - 1) setCurrentIndex((i) => i + 1);
      } else if (e.key === 'ArrowLeft') {
        if (currentIndex > 0) setCurrentIndex((i) => i - 1);
      } else if (e.key === 'd' || e.key === 'D' || e.key === '1') {
        e.preventDefault();
        handleAction('done');
      } else if (e.key === 'm' || e.key === 'M' || e.key === 's' || e.key === 'S' || e.key === '2') {
        e.preventDefault();
        handleAction('missed');
      } else if (e.key === 'u' || e.key === 'U') {
        if (currentHabit && isLogged) {
          e.preventDefault();
          onUndo(currentHabit.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, activeHabits.length, currentHabit, isLogged, handleAction, onClose, onUndo]);

  if (!isOpen) return null;

  const currentStats = currentHabit ? calculateHabitStats(currentHabit, floorAtZero) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl glass-card bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-200 dark:border-slate-700/80 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center justify-between relative z-10 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">60-Second Daily Routine</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Rapid friction-free daily check-in</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 relative z-10">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5 font-mono">
            <span>
              Habit {activeHabits.length > 0 ? currentIndex + 1 : 0} of {activeHabits.length}
            </span>
            <span>
              {totalLogged}/{activeHabits.length} Logged Today
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-emerald-500 via-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${activeHabits.length > 0 ? (totalLogged / activeHabits.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>

        {currentHabit ? (
          <div className="relative z-10 py-4 flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 shadow-md transition-transform duration-300 scale-100 hover:scale-105"
              style={{
                backgroundColor: `${currentHabit.color}25`,
                border: `2px solid ${currentHabit.color}`,
                color: currentHabit.color,
              }}
            >
              <DynamicIcon name={currentHabit.icon} className="w-8 h-8" />
            </div>

            <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 mb-2">
              {currentHabit.category}
            </span>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{currentHabit.name}</h3>

            {currentHabit.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 leading-relaxed">{currentHabit.description}</p>
            )}

            <div className="flex items-center gap-6 my-2 bg-slate-50 dark:bg-slate-900/80 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800">
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-500">Current Score</div>
                <div className="text-xl font-extrabold font-mono text-slate-900 dark:text-white">
                  {currentStats && currentStats.currentScore > 0 ? `+${currentStats.currentScore}` : currentStats?.currentScore ?? 0}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200 dark:bg-slate-800" />
              <div>
                <div className="text-[10px] uppercase font-mono text-slate-400 dark:text-slate-500">Active Streak</div>
                <div className="text-xl font-extrabold font-mono text-amber-500 dark:text-amber-400">
                  {currentStats?.currentStreak ?? 0}d 🔥
                </div>
              </div>
            </div>

            <div className="w-full mt-6">
              {isLogged ? (
                <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-3">
                  <div className="flex items-center gap-2">
                    {todayStatus === 'done' ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-semibold text-sm border border-emerald-500/40">
                        <Check className="w-4 h-4 stroke-[3]" /> Completed Today (+1)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-700 dark:text-rose-400 font-semibold text-sm border border-rose-500/40">
                        <X className="w-4 h-4 stroke-[3]" /> Missed / Skipped (-1)
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onUndo(currentHabit.id)}
                    className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Undo This Check-In (Press 'U')
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleAction('done')}
                    className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-emerald-50 dark:bg-gradient-to-br dark:from-emerald-600/30 dark:to-emerald-500/20 hover:bg-emerald-500 dark:hover:from-emerald-600 dark:hover:to-emerald-500 border border-emerald-400/50 dark:border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:text-white dark:hover:text-slate-950 transition-all duration-200 active:scale-95 shadow-sm"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 group-hover:bg-white/20 flex items-center justify-center mb-1">
                      <Check className="w-5 h-5 stroke-[3]" />
                    </div>
                    <span className="font-bold text-sm">Done Today (+1)</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-white dark:group-hover:text-slate-900 mt-0.5 font-mono">Press 'D' or '1'</span>
                  </button>

                  <button
                    onClick={() => handleAction('missed')}
                    className="group flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-100 dark:bg-slate-900/80 hover:bg-rose-50 dark:hover:bg-rose-950/60 border border-slate-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-rose-700/60 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition-all duration-200 active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 flex items-center justify-center mb-1">
                      <X className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="font-bold text-sm">Missed (-1)</span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 group-hover:text-rose-500 dark:group-hover:text-rose-400/80 mt-0.5 font-mono">Press 'M' or '2'</span>
                  </button>
                </div>
              )}
            </div>

            <div className="w-full flex items-center justify-between mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80">
              <button
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-1.5">
                {activeHabits.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      i === currentIndex
                        ? 'w-6 bg-cyan-500'
                        : activeHabits[i].history[todayStr]
                        ? 'bg-emerald-500'
                        : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  />
                ))}
              </div>

              <button
                disabled={currentIndex === activeHabits.length - 1}
                onClick={() => setCurrentIndex((i) => i + 1)}
                className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500">
            <p>No habits to review.</p>
          </div>
        )}

        {allDone && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between animate-scale-in">
            <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
              <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" />
              <span>All active habits checked in for today! Fantastic momentum.</span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors"
            >
              Finish
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

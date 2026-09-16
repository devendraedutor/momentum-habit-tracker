import React, { useState, useMemo } from 'react';
import type { Habit } from '../types/habit';
import { DynamicIcon } from './DynamicIcon';
import { calculateHabitStats, formatDisplayDate } from '../lib/momentum';
import { getTierByLevel } from '../config/progression';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Flame,
  Zap,
  Target,
  ShieldAlert,
  Sprout,
  Crown,
  Check,
  Handshake,
} from 'lucide-react';

interface HabitDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onSelectHabitProfile: (habit: Habit) => void;
  onOpenShareHabits?: () => void;
  floorAtZero?: boolean;
}

export const HabitDirectoryModal: React.FC<HabitDirectoryModalProps> = ({
  isOpen,
  onClose,
  habits,
  onOpenNewHabit,
  onEditHabit,
  onDeleteHabit,
  onSelectHabitProfile,
  onOpenShareHabits,
  floorAtZero = false,
}) => {
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-750 shadow-2xl flex flex-col relative animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Mac-style Close Button on Top-Right Corner */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition active:scale-90 hover:scale-105 cursor-pointer z-30"
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              Habit Directory
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {onOpenShareHabits && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenShareHabits();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs sm:text-sm font-bold font-mono flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-2xs"
                title="Commit Habits with Buddy"
              >
                <Handshake className="w-4 h-4 text-amber-600 dark:text-amber-400 mr-0.5" />
                <span className="hidden sm:inline">Commit</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenNewHabit();
              }}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center group"
              title="Add New Habit"
              aria-label="Add New Habit"
            >
              <Plus className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400 stroke-[3] group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Habit List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3.5">
          {activeHabits.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm sm:text-base font-medium">No habits found.</p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenNewHabit();
                }}
                className="mt-4 px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 text-sm sm:text-base font-bold font-mono shadow-md cursor-pointer hover:bg-emerald-400 transition-all"
              >
                + Create First Habit
              </button>
            </div>
          ) : (
            activeHabits.map((h) => {
              const isBreak = h.type === 'BREAK';
              const stats = calculateHabitStats(h, floorAtZero);
              const activeTier = getTierByLevel(stats.activeTierLevel);
              const targetDays = stats.targetGoalDays;
              const isDeleting = deletingHabitId === h.id;
              const startDateFormatted = formatDisplayDate(h.startDate || h.createdAt, true);

              return (
                <div
                  key={h.id}
                  onClick={() => {
                    onSelectHabitProfile(h);
                  }}
                  className="p-4 sm:p-4.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200/80 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all shadow-xs dark:shadow-md dark:shadow-black/25 cursor-pointer group flex flex-col gap-3 relative overflow-hidden"
                >
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700"
                        style={{
                          color: h.color,
                        }}
                      >
                        <DynamicIcon name={h.icon} className="w-6 h-6" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">
                            {h.name}
                          </h4>
                          <span
                            className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-bold uppercase font-mono flex items-center gap-1 ${
                              isBreak
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isBreak ? <ShieldAlert className="w-3 h-3" /> : <Sprout className="w-3 h-3" />}
                            <span>{isBreak ? 'BREAK' : 'BUILD'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-sans flex-wrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{h.category}</span>
                          <span>•</span>
                          <span className="font-mono text-xs">Started {startDateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isDeleting ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/10 dark:bg-rose-500/20 px-2 py-1 rounded-xl border border-rose-500/30 animate-scale-in">
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold font-mono">
                            Delete?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteHabit(h.id);
                              setDeletingHabitId(null);
                            }}
                            className="p-1 rounded-lg bg-rose-500 text-white hover:bg-rose-600 cursor-pointer shadow-xs"
                            title="Confirm Delete"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingHabitId(null)}
                            className="p-1 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-300 cursor-pointer"
                            title="Cancel"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => {
                              onEditHabit(h);
                            }}
                            className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Edit Habit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingHabitId(h.id)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Habit"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Core Metrics Row - 4 Balanced Clean Metric Pills with Level */}
                  <div className="grid grid-cols-4 gap-1.5 sm:gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-750 font-mono">
                    {/* Streak (Icon + Number) */}
                    <div
                      className="py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                      title="Lifetime Streak"
                    >
                      <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                        {stats.currentStreak}
                      </span>
                    </div>

                    {/* Score (Icon + Number) */}
                    <div
                      className="py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                      title="Momentum Score"
                    >
                      <Zap className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight">
                        {stats.currentScore}
                      </span>
                    </div>

                    {/* Level (Icon + Number) */}
                    <div
                      className="py-1.5 px-2 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                      title={`Mastery Level ${stats.achievedLevel} (Target: Lv.${activeTier.level} ${activeTier.name})`}
                    >
                      <Crown className="w-3.5 h-3.5 fill-amber-400 text-amber-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400 tracking-tight">
                        {stats.achievedLevel}
                      </span>
                    </div>

                    {/* Target Goal Progress */}
                    <div
                      className="py-1.5 px-1.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                      title={`Sprint Progress: ${stats.currentGoalStreak}/${targetDays} Days (Level ${activeTier.level})`}
                    >
                      <Target className="w-3.5 h-3.5 text-cyan-500 flex-shrink-0" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 tracking-tight">
                        {stats.currentGoalStreak} / {targetDays} D
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

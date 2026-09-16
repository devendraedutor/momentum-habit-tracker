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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div
        className="w-full max-w-[540px] max-h-[88vh] bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-100 dark:border-slate-800 p-6 sm:p-7 relative z-10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Mac-style Close Button on Top-Right Corner */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3.5 -right-3.5 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-transform hover:scale-105 active:scale-95 z-20"
          title="Close"
          aria-label="Close"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <Handshake className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Habit Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {activeHabits.length} active habit{activeHabits.length === 1 ? '' : 's'} tracked
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenShareHabits && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenShareHabits();
                }}
                className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                title="Commit Habits with Buddy"
              >
                <Handshake className="w-4 h-4" />
                <span>Commit</span>
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onOpenNewHabit();
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center group"
              title="Add New Habit"
              aria-label="Add New Habit"
            >
              <Plus className="w-4.5 h-4.5 text-emerald-500 dark:text-emerald-400 stroke-[3] group-hover:scale-110 transition-transform" />
            </button>
          </div>
        </div>

        {/* Habit List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5 pr-1 max-h-[52vh]">
          {activeHabits.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-medium">No habits found.</p>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenNewHabit();
                }}
                className="mt-4 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-all active:scale-[0.98] shadow-xs cursor-pointer"
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
                  onClick={() => onSelectHabitProfile(h)}
                  className="p-3 sm:p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs cursor-pointer group flex flex-col gap-2.5 relative overflow-hidden"
                >
                  {/* Card Top Row */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: `${h.color || '#10b981'}20`,
                          color: h.color || '#10b981',
                          border: `1px solid ${h.color || '#10b981'}40`,
                        }}
                      >
                        <DynamicIcon name={h.icon || 'Sparkles'} className="w-4.5 h-4.5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                            {h.name}
                          </h4>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold uppercase font-mono flex items-center gap-0.5 ${
                              isBreak
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isBreak ? <ShieldAlert className="w-2.5 h-2.5" /> : <Sprout className="w-2.5 h-2.5" />}
                            <span>{isBreak ? 'BREAK' : 'BUILD'}</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 flex-wrap">
                          <span className="text-slate-500 dark:text-slate-400 font-medium capitalize">{h.category || 'General'}</span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">Started {startDateFormatted}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div
                      className="flex items-center gap-1 flex-shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isDeleting ? (
                        <div className="flex items-center gap-1.5 bg-rose-500/10 dark:bg-rose-500/20 px-2 py-1 rounded-xl border border-rose-500/30">
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
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 transition-colors cursor-pointer"
                            title="Edit Habit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingHabitId(h.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete Habit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Core Metrics Row - 4 Balanced Clean Metric Pills with Level */}
                  <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 font-mono">
                    {/* Streak (Icon + Number) */}
                    <div
                      className="py-1 px-1.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                      title="Lifetime Streak"
                    >
                      <Flame className="w-3 h-3 fill-amber-500 text-amber-500 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {stats.currentStreak}
                      </span>
                    </div>

                    {/* Score (Icon + Number) */}
                    <div
                      className="py-1 px-1.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                      title="Momentum Score"
                    >
                      <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {stats.currentScore}
                      </span>
                    </div>

                    {/* Level (Icon + Number) */}
                    <div
                      className="py-1 px-1.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                      title={`Mastery Level ${stats.achievedLevel} (${activeTier.name})`}
                    >
                      <Crown className="w-3 h-3 fill-amber-400 text-amber-500 flex-shrink-0" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                        {stats.achievedLevel}
                      </span>
                    </div>

                    {/* Target Goal Progress */}
                    <div
                      className="py-1 px-1.5 rounded-lg bg-white dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700 flex items-center justify-center gap-1 shadow-2xs"
                      title={`Sprint Progress: ${stats.currentGoalStreak}/${targetDays} Days`}
                    >
                      <Target className="w-3 h-3 text-cyan-500 flex-shrink-0" />
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {stats.currentGoalStreak}/{targetDays}D
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

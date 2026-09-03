import React, { useState, useMemo } from 'react';
import type { Habit } from '../types/habit';
import { DynamicIcon } from './DynamicIcon';
import { calculateHabitStats, formatDisplayDate } from '../lib/momentum';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Flame,
  Target,
  ShieldAlert,
  Sprout,
  Crown,
  Search,
  Check,
} from 'lucide-react';

interface HabitDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
  onSelectHabitProfile: (habit: Habit) => void;
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
  floorAtZero = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingHabitId, setDeletingHabitId] = useState<string | null>(null);

  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);

  const filteredHabits = useMemo(() => {
    if (!searchQuery.trim()) return activeHabits;
    const q = searchQuery.toLowerCase();
    return activeHabits.filter(
      (h) =>
        h.name.toLowerCase().includes(q) ||
        h.category.toLowerCase().includes(q) ||
        (h.description && h.description.toLowerCase().includes(q))
    );
  }, [activeHabits, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                Habit Directory
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-xs font-bold font-mono">
                {activeHabits.length} Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage habits, view core metrics, and edit profiles
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenNewHabit();
              }}
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-bold font-mono shadow-sm flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>Add Habit</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search Filter (Shown when ≥ 3 habits) */}
        {activeHabits.length >= 3 && (
          <div className="px-5 sm:px-6 pt-3 pb-1 flex-shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search habits or categories..."
                className="w-full pl-9 pr-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 font-sans"
              />
            </div>
          </div>
        )}

        {/* Habit List */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-3">
          {filteredHabits.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <p className="text-sm font-medium">No habits found.</p>
              <button
                onClick={() => {
                  onClose();
                  onOpenNewHabit();
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold font-mono shadow-md cursor-pointer hover:bg-emerald-400 transition-all"
              >
                + Create First Habit
              </button>
            </div>
          ) : (
            filteredHabits.map((h) => {
              const isBreak = h.type === 'BREAK';
              const stats = calculateHabitStats(h, floorAtZero);
              const targetDays = h.targetGoalDays || 21;
              const isDeleting = deletingHabitId === h.id;
              const startDateFormatted = formatDisplayDate(h.startDate || h.createdAt, true);

              return (
                <div
                  key={h.id}
                  onClick={() => {
                    onClose();
                    onSelectHabitProfile(h);
                  }}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-slate-100/80 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-750 transition-all shadow-xs cursor-pointer group flex flex-col gap-3 relative overflow-hidden"
                >
                  {/* Card Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                        style={{
                          backgroundColor: `${h.color}20`,
                          color: h.color,
                          border: `1.5px solid ${h.color}40`,
                        }}
                      >
                        <DynamicIcon name={h.icon} className="w-5.5 h-5.5" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors truncate">
                            {h.name}
                          </h4>
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase font-mono flex items-center gap-1 ${
                              isBreak
                                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isBreak ? <ShieldAlert className="w-2.5 h-2.5" /> : <Sprout className="w-2.5 h-2.5" />}
                            <span>{isBreak ? 'BREAK' : 'BUILD'}</span>
                          </span>
                          {h.currentTier && h.currentTier > 1 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold font-mono flex items-center gap-0.5">
                              <Crown className="w-2.5 h-2.5 fill-amber-500" />
                              <span>T{h.currentTier}</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-sans flex-wrap">
                          <span className="font-semibold text-slate-600 dark:text-slate-300">{h.category}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">Started {startDateFormatted}</span>
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
                              onClose();
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

                  {/* Core Metrics Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800 text-left font-mono">
                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-semibold block uppercase">Streak</span>
                      <div className="flex items-center gap-1 text-amber-500 font-black text-xs mt-0.5">
                        <Flame className="w-3.5 h-3.5 fill-amber-500" />
                        <span>{stats.currentStreak}d</span>
                      </div>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-semibold block uppercase">Score XP</span>
                      <span className="text-emerald-500 font-black text-xs mt-0.5 block">
                        {stats.currentScore} XP
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800">
                      <span className="text-[9px] text-slate-400 font-semibold block uppercase">Target Goal</span>
                      <div className="flex items-center gap-1 text-cyan-500 font-black text-xs mt-0.5">
                        <Target className="w-3.5 h-3.5" />
                        <span>{stats.currentGoalStreak}/{targetDays}d</span>
                      </div>
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

import React, { useState, useEffect } from 'react';
import type { Habit, HabitType } from '../types/habit';
import { AVAILABLE_ICONS, DynamicIcon } from './DynamicIcon';
import { loadCategoriesFromStorage, saveCategoriesToStorage } from '../lib/storage';
import { X, Sparkles, Check, Target, Plus, Trash2, CopyPlus, ShieldAlert, Sprout } from 'lucide-react';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'history'> & { id?: string }) => void;
  initialHabit?: Habit | null;
}

const PRESET_COLORS = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Sky', hex: '#0284c7' },
  { name: 'Pink', hex: '#ec4899' },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}) => {
  const [habitType, setHabitType] = useState<HabitType>('BUILD');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<string[]>(() => loadCategoriesFromStorage());
  const [selectedCategory, setSelectedCategory] = useState('Productivity');
  const [newCatInput, setNewCatInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [icon, setIcon] = useState('Flame');
  const [color, setColor] = useState('#10b981');
  const [targetGoalDays, setTargetGoalDays] = useState<number>(21);

  useEffect(() => {
    const loaded = loadCategoriesFromStorage();
    setCategories(loaded);

    if (initialHabit) {
      setHabitType(initialHabit.type || 'BUILD');
      setName(initialHabit.name);
      setDescription(initialHabit.description || '');
      setSelectedCategory(initialHabit.category);
      setIcon(initialHabit.icon);
      setColor(initialHabit.color);
      setTargetGoalDays(initialHabit.targetGoalDays || 21);
    } else {
      setHabitType('BUILD');
      setName('');
      setDescription('');
      setSelectedCategory(loaded[0] || 'Productivity');
      setIcon('Flame');
      setColor('#10b981');
      setTargetGoalDays(21);
    }
  }, [initialHabit, isOpen]);

  if (!isOpen) return null;

  const handleAddCategory = () => {
    const trimmed = newCatInput.trim();
    if (trimmed && !categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      saveCategoriesToStorage(updated);
      setSelectedCategory(trimmed);
      setNewCatInput('');
      setIsAddingCategory(false);
    }
  };

  const handleDeleteCategory = (catToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (categories.length <= 1) return;
    const updated = categories.filter((c) => c !== catToDelete);
    setCategories(updated);
    saveCategoriesToStorage(updated);
    if (selectedCategory === catToDelete) {
      setSelectedCategory(updated[0] || 'General');
    }
  };

  const handleSaveExisting = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      ...(initialHabit ? { id: initialHabit.id } : {}),
      name: name.trim(),
      description: description.trim() || undefined,
      type: habitType,
      category: selectedCategory,
      icon,
      color,
      targetGoalDays: targetGoalDays > 0 ? Number(targetGoalDays) : 21,
    });
    onClose();
  };

  const handleSaveAsNew = () => {
    if (!name.trim()) return;

    // Explicitly omit id to guarantee a new habit is created
    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      type: habitType,
      category: selectedCategory,
      icon,
      color,
      targetGoalDays: targetGoalDays > 0 ? Number(targetGoalDays) : 21,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 relative border border-slate-200 dark:border-slate-800 shadow-2xl overflow-y-auto max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${habitType === 'BREAK' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'}`}>
              {habitType === 'BREAK' ? <ShieldAlert className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {initialHabit ? `Edit Habit: ${initialHabit.name}` : habitType === 'BREAK' ? 'Break a Bad Habit' : 'Create New Habit'}
              </h2>
              {initialHabit && (
                <span className="text-[11px] text-slate-400">
                  Editing existing habit or choose "Save as New" below
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSaveExisting} className="mt-4 space-y-4">
          {/* Habit Paradigm Selector: Build vs Break */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Habit Goal Paradigm <span className="text-emerald-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setHabitType('BUILD');
                  if (!initialHabit && color === '#f43f5e') setColor('#10b981');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  habitType === 'BUILD'
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Sprout className="w-4 h-4" />
                <span>🌱 Build Habit</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setHabitType('BREAK');
                  if (!initialHabit && color === '#10b981') setColor('#f43f5e');
                }}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  habitType === 'BREAK'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>🛑 Break Habit</span>
              </button>
            </div>

            {/* Dynamic Helper Copy */}
            <div className={`mt-2 p-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
              habitType === 'BUILD'
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border-rose-500/20'
            }`}>
              {habitType === 'BUILD' ? (
                <>
                  <Sprout className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <span>Earn <strong>+1 XP</strong> and grow streaks by doing this positive habit every day. (e.g. Reading, Workout, Meditation)</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 text-rose-500" />
                  <span>Earn <strong>+1 XP</strong> and grow clean streaks by controlling yourself and abstaining from this habit. (e.g. Porn Watching, Smoking, Junk Food)</span>
                </>
              )}
            </div>
          </div>

          {/* Habit Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Habit Name <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={habitType === 'BREAK' ? 'e.g. Porn Watching, Smoking, Junk Food...' : 'e.g. Morning Walk, Read 20 Pages, Meditation...'}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-sm"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Motivation (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={habitType === 'BREAK' ? 'Why you want to eliminate this habit and stay clean...' : 'Why this habit matters to your growth...'}
              rows={2}
              className="w-full px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-sm resize-none"
            />
          </div>

          {/* Streamlined Target Goal Days */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Target Goal Days <span className="text-cyan-500 font-mono">({habitType === 'BREAK' ? 'Clean Streak' : 'Strict Streak'})</span>
            </label>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                <Target className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={targetGoalDays}
                    onChange={(e) => setTargetGoalDays(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-20 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono font-bold text-center text-slate-900 dark:text-white text-base focus:ring-2 focus:ring-cyan-500 outline-none"
                  />
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    consecutive {habitType === 'BREAK' ? 'clean days' : 'days'} goal
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {habitType === 'BREAK' ? 'Clean streak resets to 0 if failed.' : 'Streak resets to 0 if missed.'}
                </p>
              </div>
            </div>
          </div>

          {/* Category Management */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Category
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(true)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Category
              </button>
            </div>

            {isAddingCategory && (
              <div className="mb-2 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center gap-2 animate-fade-in border border-slate-200 dark:border-slate-700">
                <input
                  type="text"
                  placeholder="New Category Name..."
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  className="flex-1 px-3 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategory();
                    }
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setNewCatInput('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <div
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`group px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  <span>{cat}</span>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCategory(cat, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity p-0.5"
                      title="Delete category"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Color & Icon Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Accent Color
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform hover:scale-105 cursor-pointer relative"
                    style={{ backgroundColor: c.hex }}
                  >
                    {color === c.hex && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Icon
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-[88px] overflow-y-auto pr-1">
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setIcon(ic.name)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                      icon === ic.name
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400'
                    }`}
                    title={ic.label}
                  >
                    <DynamicIcon name={ic.name} className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            >
              Cancel
            </button>

            {initialHabit ? (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveAsNew}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500 text-cyan-800 dark:text-cyan-300 hover:text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 border border-cyan-500/30 transition-all cursor-pointer"
                  title="Create as a brand new habit without modifying existing"
                >
                  <CopyPlus className="w-3.5 h-3.5" /> Save as New Habit
                </button>
                <button
                  type="submit"
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Update Habit
                </button>
              </div>
            ) : (
              <button
                type="submit"
                className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer ${
                  habitType === 'BREAK'
                    ? 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-400 hover:to-amber-400 text-white'
                    : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950'
                }`}
              >
                {habitType === 'BREAK' ? '+ Create Break Habit' : '+ Create Habit'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

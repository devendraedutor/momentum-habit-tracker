import React, { useState, useEffect } from 'react';
import type { Habit, HabitType } from '../types/habit';
import { AVAILABLE_ICONS, DynamicIcon } from './DynamicIcon';
import { loadCategoriesFromStorage, saveCategoriesToStorage } from '../lib/storage';
import { getTodayString, formatDisplayDate } from '../lib/momentum';
import {
  X,
  Sparkles,
  Check,
  Target,
  Plus,
  Trash2,
  CopyPlus,
  ShieldAlert,
  Sprout,
  ChevronDown,
  Calendar,
} from 'lucide-react';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'history'> & { id?: string; startDate?: string }) => void;
  initialHabit?: Habit | null;
  defaultStartDate?: string;
}

const PRESET_COLORS = [
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Sky', hex: '#0284c7' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Violet', hex: '#8b5cf6' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Fuchsia', hex: '#d946ef' },
  { name: 'Pink', hex: '#ec4899' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Lime', hex: '#84cc16' },
];

const TARGET_PRESETS = [7, 14, 21, 30, 66];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
  defaultStartDate,
}) => {
  const [habitType, setHabitType] = useState<HabitType>('BUILD');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [categories, setCategories] = useState<string[]>(() => loadCategoriesFromStorage());
  const [selectedCategory, setSelectedCategory] = useState('Productivity');
  const [newCatInput, setNewCatInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [icon, setIcon] = useState('Flame');
  const [color, setColor] = useState('#10b981');
  const [targetGoalDays, setTargetGoalDays] = useState<number>(21);
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');
  const [startDate, setStartDate] = useState<string>(() => defaultStartDate || getTodayString());

  useEffect(() => {
    const loaded = loadCategoriesFromStorage();
    setCategories(loaded);

    if (initialHabit) {
      setHabitType(initialHabit.type || 'BUILD');
      setName(initialHabit.name);
      setDescription(initialHabit.description || '');
      setShowDescription(Boolean(initialHabit.description));
      setSelectedCategory(initialHabit.category);
      setIcon(initialHabit.icon);
      setColor(initialHabit.color);
      setStartDate(initialHabit.startDate || initialHabit.createdAt?.split('T')[0] || defaultStartDate || getTodayString());
      const target = initialHabit.targetGoalDays || 21;
      setTargetGoalDays(target);
      if (!TARGET_PRESETS.includes(target)) {
        setIsCustomTarget(true);
        setCustomTargetInput(String(target));
      } else {
        setIsCustomTarget(false);
        setCustomTargetInput('');
      }
    } else {
      setHabitType('BUILD');
      setName('');
      setDescription('');
      setShowDescription(false);
      setSelectedCategory(loaded[0] || 'Productivity');
      setIcon('Flame');
      setColor('#10b981');
      setTargetGoalDays(21);
      setStartDate(defaultStartDate || getTodayString());
      setIsCustomTarget(false);
      setCustomTargetInput('');
    }
  }, [initialHabit, isOpen, defaultStartDate]);

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

  const handleSelectPresetTarget = (days: number) => {
    setTargetGoalDays(days);
    setIsCustomTarget(false);
    setCustomTargetInput('');
  };

  const handleCustomTargetChange = (val: string) => {
    setCustomTargetInput(val);
    setIsCustomTarget(true);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setTargetGoalDays(num);
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
      startDate: startDate || getTodayString(),
      targetGoalDays: targetGoalDays > 0 ? Number(targetGoalDays) : 21,
    });
    onClose();
  };

  const handleSaveAsNew = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      type: habitType,
      category: selectedCategory,
      icon,
      color,
      startDate: startDate || getTodayString(),
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
          {/* Habit Goal Paradigm Selector: Build vs Break with Single Clean Icons */}
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
                <span>Build Habit</span>
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
                <span>Break Habit</span>
              </button>
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
              placeholder={habitType === 'BREAK' ? 'e.g. Smoking, Junk Food, Late Screen Time...' : 'e.g. Morning Walk, Read 20 Pages, Meditation...'}
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-sm font-medium"
            />
          </div>

          {/* Collapsible Description / Motivation */}
          <div>
            <button
              type="button"
              onClick={() => setShowDescription(!showDescription)}
              className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer py-1"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showDescription ? 'rotate-180 text-cyan-500' : ''}`} />
              <span>{showDescription ? 'Hide Description / Motivation' : '+ Add Description / Motivation (Optional)'}</span>
            </button>

            {showDescription && (
              <div className="mt-2 animate-fade-in">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={habitType === 'BREAK' ? 'Why you want to eliminate this habit and stay clean...' : 'Why this habit matters to your daily growth...'}
                  rows={2}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white text-xs resize-none"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Redesigned Clean Target Goal Days Selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-500" />
                <span>Target Goal Days</span>
              </label>
              <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">
                {targetGoalDays} Days Goal
              </span>
            </div>

            {/* Smart Preset Chips & Custom Input */}
            <div className="grid grid-cols-6 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700">
              {TARGET_PRESETS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleSelectPresetTarget(days)}
                  className={`py-2 rounded-xl font-mono text-xs font-bold transition-all text-center cursor-pointer ${
                    !isCustomTarget && targetGoalDays === days
                      ? 'bg-cyan-500 text-slate-950 shadow-sm font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {days}d
                </button>
              ))}

              {/* Custom Input Chip */}
              <div className="relative">
                <input
                  type="number"
                  placeholder="Custom"
                  value={customTargetInput}
                  onChange={(e) => handleCustomTargetChange(e.target.value)}
                  className={`w-full py-2 px-1 rounded-xl font-mono text-xs font-bold text-center border transition-all outline-none ${
                    isCustomTarget
                      ? 'bg-cyan-500 text-slate-950 border-cyan-500 font-black placeholder:text-slate-950/70'
                      : 'bg-transparent text-slate-600 dark:text-slate-400 border-transparent placeholder:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Start Tracking Date */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                <span>Start Tracking From</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Not queued before this date
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white text-xs font-mono font-bold"
              />
              <button
                type="button"
                onClick={() => setStartDate(getTodayString())}
                className={`px-3.5 py-2.5 rounded-2xl text-xs font-mono font-bold border transition-all cursor-pointer ${
                  startDate === getTodayString()
                    ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-xs font-black'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Today
              </button>
            </div>
            {/* Live start date confirmation badge */}
            <div className="mt-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-700 dark:text-cyan-400 text-[11px] font-mono flex items-center gap-1.5">
              <span>🗓️ Active in queue from: <strong>{formatDisplayDate(startDate || getTodayString(), true)}</strong></span>
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
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-xs font-bold'
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* 16 Colors Grid */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Accent Color
                </label>
                <span className="text-[10px] font-mono text-slate-400">{PRESET_COLORS.length} Colors</span>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-4 gap-1.5 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setColor(c.hex)}
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 cursor-pointer relative shadow-xs"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  >
                    {color === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3] drop-shadow-md" />}
                  </button>
                ))}
              </div>
            </div>

            {/* 32 Icons Grid */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Icon
                </label>
                <span className="text-[10px] font-mono text-slate-400">{AVAILABLE_ICONS.length} Icons</span>
              </div>
              <div className="grid grid-cols-8 sm:grid-cols-4 gap-1.5 max-h-[108px] overflow-y-auto p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 pr-1">
                {AVAILABLE_ICONS.map((ic) => (
                  <button
                    key={ic.name}
                    type="button"
                    onClick={() => setIcon(ic.name)}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center border transition-all cursor-pointer ${
                      icon === ic.name
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={ic.label}
                  >
                    <DynamicIcon name={ic.name} className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
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

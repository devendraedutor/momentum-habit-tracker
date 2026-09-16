import React, { useState, useEffect, useRef } from 'react';
import type { Habit, HabitType } from '../types/habit';
import { AVAILABLE_ICONS, DynamicIcon } from './DynamicIcon';
import { loadCategoriesFromStorage, saveCategoriesToStorage } from '../lib/storage';
import { getTodayString } from '../lib/momentum';
import { DEFAULT_START_TARGET_DAYS } from '../config/progression';
import {
  X,
  Check,
  Plus,
  Trash2,
  ShieldAlert,
  Sprout,
  ChevronDown,
  ChevronUp,
  Calendar,
  ChevronLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'history'> & { id?: string; startDate?: string }) => void;
  initialHabit?: Habit | null;
  defaultStartDate?: string;
}

const PRESET_COLORS = [
  // Row 1: Cyan, Amber, Purple, Hot Pink
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Hot Pink', hex: '#ec4899' },

  // Row 2: Sky Blue, Neon Orange, Deep Violet, Fuchsia
  { name: 'Sky Blue', hex: '#0284c7' },
  { name: 'Neon Orange', hex: '#f97316' },
  { name: 'Deep Violet', hex: '#7c3aed' },
  { name: 'Fuchsia', hex: '#d946ef' },

  // Row 3: Indigo, Sunshine Yellow, Orchid, Tangerine
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Sunshine Yellow', hex: '#eab308' },
  { name: 'Orchid', hex: '#c026d3' },
  { name: 'Tangerine', hex: '#ea580c' },

  // Row 4: Electric Sapphire, Golden Sand, Plum, Coral Peach
  { name: 'Sapphire', hex: '#2563eb' },
  { name: 'Golden Sand', hex: '#facc15' },
  { name: 'Plum', hex: '#9333ea' },
  { name: 'Coral Peach', hex: '#fb923c' },

  // Row 5: Aqua, Warm Ochre, Lavender, Deep Berry
  { name: 'Aqua', hex: '#00e5ff' },
  { name: 'Warm Ochre', hex: '#d97706' },
  { name: 'Lavender', hex: '#8b5cf6' },
  { name: 'Deep Berry', hex: '#be185d' },

  // Row 6: Pacific Cerulean, Terracotta, Deep Purple, Magenta Pink
  { name: 'Cerulean', hex: '#0ea5e9' },
  { name: 'Terracotta', hex: '#c2410c' },
  { name: 'Deep Purple', hex: '#7e22ce' },
  { name: 'Magenta Pink', hex: '#db2777' },

  // Row 7: Cobalt, Caramel Bronze, Iris Blue, Electric Lilac
  { name: 'Cobalt', hex: '#1d4ed8' },
  { name: 'Caramel Bronze', hex: '#b45309' },
  { name: 'Iris Blue', hex: '#4f46e5' },
  { name: 'Electric Lilac', hex: '#a21caf' },

  // Row 8: Steel Slate, Champagne Gold, Periwinkle, Neon Blush
  { name: 'Steel Slate', hex: '#64748b' },
  { name: 'Champagne Gold', hex: '#fbbf24' },
  { name: 'Periwinkle', hex: '#818cf8' },
  { name: 'Neon Blush', hex: '#f472b6' },
];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
  defaultStartDate,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [stepDirection, setStepDirection] = useState<'forward' | 'backward'>('forward');
  const [habitType, setHabitType] = useState<HabitType>('BUILD');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [categories, setCategories] = useState<string[]>(() => loadCategoriesFromStorage());
  const [selectedCategory, setSelectedCategory] = useState('Productivity');
  const [newCatInput, setNewCatInput] = useState('');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [icon, setIcon] = useState('Flame');
  const [color, setColor] = useState('#06b6d4');
  const [targetGoalDays, setTargetGoalDays] = useState<number>(DEFAULT_START_TARGET_DAYS);
  const [startDate, setStartDate] = useState<string>(() => initialHabit?.startDate || getTodayString());

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loaded = loadCategoriesFromStorage();
    setCategories(loaded);
    setCurrentStep(1);
    setStepDirection('forward');

    if (initialHabit) {
      setHabitType(initialHabit.type || 'BUILD');
      setName(initialHabit.name);
      setDescription(initialHabit.description || '');
      setShowDescription(Boolean(initialHabit.description));
      setSelectedCategory(initialHabit.category);
      setIcon(initialHabit.icon);
      setColor(initialHabit.color);
      const todayStr = getTodayString();
      setStartDate(
        initialHabit.startDate ||
          initialHabit.createdAt?.split('T')[0] ||
          todayStr
      );
      setTargetGoalDays(initialHabit.targetGoalDays || DEFAULT_START_TARGET_DAYS);
    } else {
      setHabitType('BUILD');
      setName('');
      setDescription('');
      setShowDescription(false);
      setSelectedCategory(loaded[0] || 'Productivity');
      setIcon('Flame');
      setColor('#06b6d4');
      setTargetGoalDays(DEFAULT_START_TARGET_DAYS);
      setStartDate(getTodayString());
    }
  }, [initialHabit, isOpen, defaultStartDate]);

  // Autofocus input when on Step 1
  useEffect(() => {
    if (isOpen && currentStep === 1) {
      setTimeout(() => nameInputRef.current?.focus(), 60);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const goToStep = (next: 1 | 2) => {
    if (next > currentStep) {
      setStepDirection('forward');
    } else {
      setStepDirection('backward');
    }
    setCurrentStep(next);
  };

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

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      goToStep(1);
      return;
    }

    const today = getTodayString();
    const resolvedStartDate = startDate && startDate > today ? today : (startDate || today);

    onSave({
      ...(initialHabit ? { id: initialHabit.id } : {}),
      name: name.trim(),
      description: description.trim() || undefined,
      type: habitType,
      category: selectedCategory,
      icon,
      color,
      startDate: resolvedStartDate,
      targetGoalDays: targetGoalDays > 0 ? Number(targetGoalDays) : DEFAULT_START_TARGET_DAYS,
    });
  };

  const handleSaveAsNew = () => {
    if (!name.trim()) {
      goToStep(1);
      return;
    }

    const today = getTodayString();
    const resolvedStartDate = startDate && startDate > today ? today : (startDate || today);

    onSave({
      name: name.trim(),
      description: description.trim() || undefined,
      type: habitType,
      category: selectedCategory,
      icon,
      color,
      startDate: resolvedStartDate,
      targetGoalDays: targetGoalDays > 0 ? Number(targetGoalDays) : DEFAULT_START_TARGET_DAYS,
    });
  };

  const progressPercentage = currentStep === 1 ? 50 : 100;
  const slideAnimationClass = stepDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col relative animate-scale-in max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Mac-style Close Button on Top-Right Corner */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-md flex items-center justify-center transition active:scale-90 hover:scale-105 cursor-pointer z-30"
          title="Close"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* 1. Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Top Left: Back Button on Step 2 */}
          <div className="w-16">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all active:scale-95 cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Center Title */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight text-center">
            {initialHabit ? 'Edit Habit' : 'Create New Habit'}
          </h2>

          <div className="w-16" />
        </div>

        {/* 2. Step Content Container */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col justify-between">
          <div key={currentStep} className={slideAnimationClass}>
            {/* ================= STEP 1: Identity, Name & Start Date ================= */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Habit Goal Paradigm: Build vs Break */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Habit Goal Paradigm <span className="text-emerald-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setHabitType('BUILD');
                        if (icon === 'ShieldAlert') setIcon('Flame');
                      }}
                      className={`py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer ${
                        habitType === 'BUILD'
                          ? 'bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/25 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Sprout className="w-4 h-4" />
                      <span>Build Habit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHabitType('BREAK');
                        if (icon === 'Flame') setIcon('ShieldAlert');
                      }}
                      className={`py-2.5 px-3 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-95 cursor-pointer ${
                        habitType === 'BREAK'
                          ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/25 font-bold'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Break Habit</span>
                    </button>
                  </div>
                </div>

                {/* Habit Name Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Habit Name <span className="text-emerald-500">*</span>
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && name.trim()) {
                        e.preventDefault();
                        goToStep(2);
                      }
                    }}
                    placeholder={
                      habitType === 'BREAK'
                        ? 'e.g. Stop doomscrolling, No sugar...'
                        : 'e.g. Morning Walk, Read 20 Pages...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 text-sm font-semibold transition-all shadow-2xs"
                    required
                  />
                </div>

                {/* Start Tracking From Date Picker */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Start Tracking From</span>
                    </span>
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      max={getTodayString()}
                      value={startDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        const today = getTodayString();
                        setStartDate(val > today ? today : val);
                      }}
                      className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white text-xs sm:text-sm font-semibold transition-all shadow-2xs"
                    />
                    {startDate !== getTodayString() && (
                      <button
                        type="button"
                        onClick={() => setStartDate(getTodayString())}
                        className="px-3.5 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        Today
                      </button>
                    )}
                  </div>
                </div>

                {/* Collapsible Description / Motivation */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowDescription(!showDescription)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 font-semibold flex items-center gap-1 transition-colors cursor-pointer select-none active:scale-95"
                  >
                    {showDescription ? (
                      <>
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Hide Motivation / Notes</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-3.5 h-3.5" />
                        <span>+ Add Motivation / Notes (Optional)</span>
                      </>
                    )}
                  </button>

                  {showDescription && (
                    <div className="mt-2 animate-fade-in">
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Why is this habit important to you? What is your trigger or anchor routine?"
                        rows={2}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm transition-all resize-none shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 2: Visual Identity & Category ================= */}
            {currentStep === 2 && (
              <div className="space-y-3.5">
                {/* Category Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Category
                    </button>
                  </div>

                  {isAddingCategory && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-fade-in">
                      <input
                        type="text"
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        placeholder="Category name..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-lg active:scale-95 cursor-pointer"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingCategory(false)}
                        className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border flex items-center gap-1.5 transition-all duration-200 active:scale-95 select-none ${
                          selectedCategory === cat
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs font-bold'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <span>{cat}</span>
                        {categories.length > 1 && (
                          <button
                            type="button"
                            onClick={(e) => handleDeleteCategory(cat, e)}
                            className="opacity-40 hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Accent Color & Icon Picker Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Colors */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Accent Color
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setColor(c.hex)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs hover:scale-105 active:scale-90 mx-auto ${
                            color === c.hex
                              ? 'scale-105 ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md'
                              : ''
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {color === c.hex && <Check className="w-4 h-4 text-white stroke-[3] animate-scale-in" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Icons */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                        Icon
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750">
                      {AVAILABLE_ICONS.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setIcon(item.name)}
                          className={`p-2.5 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-105 active:scale-90 ${
                            icon === item.name
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 scale-105 shadow-xs font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                          title={item.label}
                        >
                          <DynamicIcon name={item.name} className="w-4.5 h-4.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Footer Navigation & Step Actions */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 mt-4">
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToStep(1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {currentStep === 1 && (
              <button
                type="button"
                onClick={() => {
                  if (name.trim()) goToStep(2);
                }}
                disabled={!name.trim()}
                aria-label="Next Step"
                title="Next"
                className={`py-2.5 px-5 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all duration-200 shadow-sm ${
                  name.trim()
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-emerald-500/20 active:scale-95 cursor-pointer font-bold'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <span>Next</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}

            {currentStep === 2 && (
              <div className="flex items-center gap-2">
                {initialHabit && (
                  <button
                    type="button"
                    onClick={handleSaveAsNew}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
                  >
                    Save as New
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleFinalSubmit()}
                  className="py-2.5 px-5 sm:px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                  <span>{initialHabit ? 'Save Changes' : 'Launch Habit'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Progress Bar */}
        <div className="w-full h-[2.5px] bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0">
          <div
            className="h-full bg-emerald-500/50 dark:bg-emerald-400/60 transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

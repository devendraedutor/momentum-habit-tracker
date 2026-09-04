import React, { useState, useEffect, useRef } from 'react';
import type { Habit, HabitType } from '../types/habit';
import { AVAILABLE_ICONS, DynamicIcon } from './DynamicIcon';
import { loadCategoriesFromStorage, saveCategoriesToStorage } from '../lib/storage';
import { getTodayString } from '../lib/momentum';
import {
  X,
  Check,
  Target,
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

const TARGET_PRESETS = [7, 14, 21, 30, 66];

export const HabitFormModal: React.FC<HabitFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
  defaultStartDate,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
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
  const [targetGoalDays, setTargetGoalDays] = useState<number>(21);
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [customTargetInput, setCustomTargetInput] = useState('');
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
      setColor('#06b6d4');
      setTargetGoalDays(21);
      setStartDate(getTodayString());
      setIsCustomTarget(false);
      setCustomTargetInput('');
    }
  }, [initialHabit, isOpen, defaultStartDate]);

  // Autofocus input when on Step 1
  useEffect(() => {
    if (isOpen && currentStep === 1) {
      setTimeout(() => nameInputRef.current?.focus(), 60);
    }
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const goToStep = (next: 1 | 2 | 3) => {
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

  const handleFinalSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      goToStep(1);
      return;
    }

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
    if (!name.trim()) {
      goToStep(1);
      return;
    }

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

  const progressPercentage = currentStep === 1 ? 33.33 : currentStep === 2 ? 66.66 : 100;
  const slideAnimationClass = stepDirection === 'forward' ? 'animate-slide-right' : 'animate-slide-left';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-scale-in relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header (Clean & Uncluttered) */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 flex-shrink-0">
          {/* Top Left: Back Button on Steps 2 and 3 */}
          <div className="w-16">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => goToStep((currentStep - 1) as 1 | 2)}
                className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-all active:scale-95 cursor-pointer py-1 px-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 font-mono"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>

          {/* Center Title */}
          <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight text-center">
            {initialHabit ? 'Edit Habit' : 'Create New Habit'}
          </h2>

          {/* Top Right: Close Button */}
          <div className="w-16 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Step Content Container with Directional Slide Transition */}
        <div className="p-5 sm:p-6 overflow-y-auto max-h-[68vh] min-h-[350px] flex flex-col justify-between">
          <div key={currentStep} className={slideAnimationClass}>
            {/* ================= STEP 1: Identity & Core Quest ================= */}
            {currentStep === 1 && (
              <div className="space-y-4">
                {/* Habit Goal Paradigm: Build vs Break with Fluid Springy Toggle */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
                    Habit Goal Paradigm <span className="text-emerald-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setHabitType('BUILD');
                        if (icon === 'ShieldAlert') setIcon('Flame');
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer font-mono ${
                        habitType === 'BUILD'
                          ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25 scale-[1.02]'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <Sprout className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                      <span>Build Habit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setHabitType('BREAK');
                        if (icon === 'Flame') setIcon('ShieldAlert');
                      }}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-300 active:scale-95 cursor-pointer font-mono ${
                        habitType === 'BREAK'
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 scale-[1.02]'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <ShieldAlert className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                      <span>Break Habit</span>
                    </button>
                  </div>
                </div>

                {/* Habit Name Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2 font-mono">
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
                        ? 'e.g. Stop doomscrolling, No sugar, Quit vaping...'
                        : 'e.g. Morning Walk, Read 20 Pages, Meditation...'
                    }
                    className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base font-semibold transition-all shadow-2xs"
                    required
                  />
                </div>

                {/* Collapsible Description / Motivation */}
                <div>
                  <button
                    type="button"
                    onClick={() => setShowDescription(!showDescription)}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-emerald-500 dark:hover:text-emerald-400 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer py-1 select-none active:scale-95"
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
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white placeholder-slate-400 text-xs transition-all resize-none shadow-2xs"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= STEP 2: Milestone & Timeline ================= */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Target Goal Days */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Target Goal Days</span>
                    </label>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 font-bold">
                      {targetGoalDays} Days Goal
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {TARGET_PRESETS.map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleSelectPresetTarget(days)}
                        className={`py-2 px-2 rounded-xl text-xs font-bold font-mono transition-all duration-200 border cursor-pointer hover:scale-105 active:scale-95 select-none ${
                          !isCustomTarget && targetGoalDays === days
                            ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-sm shadow-cyan-500/30 font-black'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                        }`}
                      >
                        {days} D
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomTarget(true);
                        if (!customTargetInput) setCustomTargetInput(String(targetGoalDays));
                      }}
                      className={`py-2 px-2 rounded-xl text-xs font-bold font-mono transition-all duration-200 border cursor-pointer hover:scale-105 active:scale-95 select-none ${
                        isCustomTarget
                          ? 'bg-cyan-500 text-slate-950 border-cyan-500 shadow-sm shadow-cyan-500/30 font-black'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {isCustomTarget && (
                    <div className="mt-2 flex items-center gap-2 animate-fade-in">
                      <input
                        type="number"
                        min={1}
                        max={365}
                        value={customTargetInput}
                        onChange={(e) => handleCustomTargetChange(e.target.value)}
                        placeholder="e.g. 45"
                        className="w-28 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-xs font-mono font-bold text-slate-900 dark:text-white"
                      />
                      <span className="text-xs text-slate-500 font-mono">consecutive days goal</span>
                    </div>
                  )}
                </div>

                {/* Start Tracking From */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Start Tracking From</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white text-xs sm:text-sm font-mono font-bold transition-all shadow-2xs"
                    />
                    {startDate !== getTodayString() && (
                      <button
                        type="button"
                        onClick={() => setStartDate(getTodayString())}
                        className="px-4 py-2.5 rounded-2xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30 text-xs font-bold font-mono transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1 shadow-2xs animate-fade-in"
                      >
                        Today
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: Visual Identity & Category ================= */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* Category Selector */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(true)}
                      className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1 font-mono cursor-pointer active:scale-95 transition-transform"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Category
                    </button>
                  </div>

                  {isAddingCategory && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 animate-fade-in">
                      <input
                        type="text"
                        value={newCatInput}
                        onChange={(e) => setNewCatInput(e.target.value)}
                        placeholder="Category name..."
                        className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        className="px-3 py-1.5 bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl active:scale-95 cursor-pointer"
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

                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {categories.map((cat) => (
                      <div
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border flex items-center gap-1.5 transition-all duration-200 hover:scale-105 active:scale-95 select-none ${
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                  {/* Colors */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                        Accent Color
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750">
                      {PRESET_COLORS.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => setColor(c.hex)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs hover:scale-110 active:scale-90 mx-auto ${
                            color === c.hex
                              ? 'scale-110 ring-2 ring-slate-900 dark:ring-white ring-offset-2 ring-offset-white dark:ring-offset-slate-900 shadow-md'
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
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 font-mono">
                        Icon
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750">
                      {AVAILABLE_ICONS.map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setIcon(item.name)}
                          className={`p-2 rounded-xl border flex items-center justify-center transition-all duration-200 cursor-pointer hover:scale-110 active:scale-90 ${
                            icon === item.name
                              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400 scale-105 shadow-xs font-bold'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                          title={item.label}
                        >
                          <DynamicIcon name={item.name} className="w-4 h-4" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Footer Navigation & Step Actions */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 mt-4">
            {currentStep === 1 ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all active:scale-95 cursor-pointer font-mono"
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                onClick={() => goToStep((currentStep - 1) as 1 | 2)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-all active:scale-95 cursor-pointer font-mono"
              >
                <ChevronLeft className="w-4 h-4" />
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
                className={`p-3 rounded-2xl font-bold text-xs font-mono flex items-center justify-center transition-all duration-200 shadow-md ${
                  name.trim()
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 shadow-emerald-500/20 hover:scale-105 active:scale-95 cursor-pointer'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}

            {currentStep === 2 && (
              <button
                type="button"
                onClick={() => goToStep(3)}
                aria-label="Next Step"
                title="Next"
                className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center transition-all duration-200 shadow-md shadow-cyan-500/20 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <ArrowRight className="w-5 h-5 stroke-[2.5]" />
              </button>
            )}

            {currentStep === 3 && (
              <div className="flex items-center gap-2">
                {initialHabit && (
                  <button
                    type="button"
                    onClick={handleSaveAsNew}
                    className="px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    Save as New
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleFinalSubmit()}
                  className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm font-mono shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer group relative overflow-hidden"
                >
                  {/* Subtle sheen highlight animation across button */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-bar-sheen pointer-events-none" />
                  
                  <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950 transition-transform group-hover:rotate-12" />
                  <span className="tracking-wide">{initialHabit ? 'Save Changes' : 'Launch Habit'}</span>
                  <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 4. Subtle, Low-Profile Progress Bar (Anchored at very bottom edge) */}
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

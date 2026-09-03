import React from 'react';
import type { Habit } from '../types/habit';
import { Zap, Moon, Sun, Plus, ListChecks, Gem, Settings } from 'lucide-react';

interface NavbarProps {
  habits: Habit[];
  jumboPointsCount: number;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenNewHabit: () => void;
  onOpenDirectory: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  habits,
  jumboPointsCount,
  theme,
  onToggleTheme,
  onOpenNewHabit,
  onOpenDirectory,
  onOpenSettings,
}) => {
  const activeHabitsCount = habits.filter((h) => !h.archived).length;
  const isDark = theme === 'dark';

  return (
    <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-emerald-500/15">
            <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
              <Zap className="w-4.5 h-4.5 fill-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight bg-gradient-to-r from-emerald-600 via-cyan-600 to-indigo-600 dark:from-emerald-400 dark:via-cyan-400 dark:to-indigo-300 bg-clip-text text-transparent font-mono">
                MOMENTUM
              </span>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold uppercase tracking-wider">
                Habit Quest
              </span>
            </div>
          </div>
        </div>

        {/* Minimalist, Gamified, Icon-Driven Header Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* 1. Gamified Jumbo Point Badge (Prestige Currency Capsule - Unlocked at >= 3 habits) */}
          {activeHabitsCount >= 3 && (
            <div
              className="relative px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 flex items-center gap-1.5 font-mono shadow-xs select-none cursor-default animate-fade-in"
              title={`Total Jumbo Points: ${jumboPointsCount} (Conquered Perfect Days)`}
            >
              <Gem className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span className="text-xs font-black font-mono">
                {jumboPointsCount}
              </span>
            </div>
          )}

          {/* 2. Fluid Theme Toggle (Telegram-Style Micro-Animation) */}
          <button
            onClick={onToggleTheme}
            className="relative p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all duration-300 active:scale-90 cursor-pointer overflow-hidden"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Theme"
          >
            <div className={`transform transition-transform duration-500 ${isDark ? 'rotate-0 scale-100' : 'rotate-180 scale-100'}`}>
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </div>
          </button>

          {/* 3. New Habit Action Button */}
          <button
            onClick={onOpenNewHabit}
            className="p-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold shadow-sm shadow-emerald-500/20 transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Add New Habit"
            aria-label="Add New Habit"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
          </button>

          {/* 4. Habit Directory Button (Icon-Only) */}
          <button
            onClick={onOpenDirectory}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Habit Directory & Management"
            aria-label="Habit Directory & Management"
          >
            <ListChecks className="w-4 h-4 text-cyan-500" />
          </button>

          {/* 5. System Settings & Data Erasure Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Settings & Data Management"
            aria-label="Settings & Data Management"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" />
          </button>
        </div>
      </div>
    </header>
  );
};

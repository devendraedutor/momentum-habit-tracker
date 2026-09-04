import React from 'react';
import type { Habit } from '../types/habit';
import type { Tester } from '../config/testers';
import { Zap, Plus, ListChecks, Gem, Settings, LogOut } from 'lucide-react';

interface NavbarProps {
  habits: Habit[];
  jumboPointsCount: number;
  tester: Tester | null;
  onOpenNewHabit: () => void;
  onOpenDirectory: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  habits,
  jumboPointsCount,
  tester,
  onOpenNewHabit,
  onOpenDirectory,
  onOpenSettings,
  onLogout,
}) => {
  const activeHabitsCount = habits.filter((h) => !h.archived).length;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/90 dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-750 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-br from-emerald-400 via-cyan-500 to-indigo-600 p-0.5 shadow-md shadow-emerald-500/15 flex-shrink-0">
            <div className="w-full h-full bg-slate-900 dark:bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
              <Zap className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-emerald-400" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="text-base font-black tracking-tight bg-gradient-to-r from-emerald-600 via-cyan-600 to-indigo-600 dark:from-emerald-400 dark:via-cyan-400 dark:to-indigo-300 bg-clip-text text-transparent font-mono">
              FLUX
            </span>
            {tester && (
              <span className="hidden xs:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 font-mono shadow-2xs truncate max-w-[120px] sm:max-w-[180px]">
                <span className="text-amber-500">⚡</span>
                <span className="truncate">{tester.name}</span>
              </span>
            )}
          </div>
        </div>

        {/* Minimalist, Gamified, Icon-Driven Header Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* 1. Gamified Jumbo Point Badge (Prestige Currency Capsule - Unlocked at >= 3 habits) */}
          {activeHabitsCount >= 3 && (
            <div
              className="relative px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-500/30 text-amber-700 dark:bg-amber-500/15 dark:border-amber-400/30 dark:text-amber-300 flex items-center gap-1.5 font-mono shadow-xs select-none cursor-default animate-fade-in"
              title={`Total Jumbo Points: ${jumboPointsCount} (Conquered Perfect Days)`}
            >
              <Gem className="w-4 h-4 fill-amber-400 text-amber-500" />
              <span className="text-xs font-black font-mono">
                {jumboPointsCount}
              </span>
            </div>
          )}

          {/* 2. New Habit Action Button */}
          <button
            onClick={onOpenNewHabit}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center group"
            title="Add New Habit"
            aria-label="Add New Habit"
          >
            <Plus className="w-4 h-4 text-emerald-500 dark:text-emerald-400 stroke-[3] group-hover:scale-110 transition-transform" />
          </button>

          {/* 3. Habit Directory Button (Icon-Only) */}
          <button
            onClick={onOpenDirectory}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Habit Directory & Management"
            aria-label="Habit Directory & Management"
          >
            <ListChecks className="w-4 h-4 text-cyan-500" />
          </button>

          {/* 4. System Settings & Data Erasure Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Settings & Data Management"
            aria-label="Settings & Data Management"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" />
          </button>

          {/* 5. Exit Session / Switch Profile Button */}
          {tester && (
            <button
              onClick={onLogout}
              className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900/50 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center"
              title={`Exit Session (Logged in as ${tester.name})`}
              aria-label="Exit Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};


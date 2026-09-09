import React, { useState, useRef, useEffect } from 'react';
import type { Habit } from '../types/habit';
import type { Tester } from '../config/testers';
import { Zap, Plus, ListChecks, Gem, Settings, LogOut } from 'lucide-react';
import type { User } from '../lib/firebase';
import type { CloudSyncState } from '../hooks/useFirebaseAuth';

interface NavbarProps {
  habits: Habit[];
  jumboPointsCount: number;
  hasPendingBacklog?: boolean;
  tester: Tester | null;
  user: User | null;
  isSigningIn?: boolean;
  syncState?: CloudSyncState;
  onOpenNewHabit: () => void;
  onOpenDirectory: () => void;
  onOpenSettings: () => void;
  onOpenJumboVault?: () => void;
  onLogout: () => void;
  onLoginGoogle?: () => void;
  onLogoutGoogle?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  habits,
  jumboPointsCount,
  hasPendingBacklog = false,
  tester,
  user,
  isSigningIn = false,
  onOpenNewHabit,
  onOpenDirectory,
  onOpenSettings,
  onOpenJumboVault,
  onLogout,
  onLoginGoogle,
  onLogoutGoogle,
}) => {
  const activeHabitsCount = habits.filter((h) => !h.archived).length;
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

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

        {/* Header Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* 1. Gamified Jumbo Point Badge (Unlocked at >= 3 habits) */}
          {activeHabitsCount >= 3 && (
            <button
              type="button"
              onClick={onOpenJumboVault}
              className={`relative px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border text-amber-700 dark:bg-amber-500/15 dark:text-amber-300 flex items-center gap-1.5 font-mono shadow-xs select-none cursor-pointer transition-all hover:scale-105 active:scale-95 hover:border-amber-500/60 dark:hover:border-amber-400/70 hover:shadow-amber-500/20 animate-fade-in group ${
                hasPendingBacklog
                  ? 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/70 dark:ring-amber-400/80 ring-offset-2 ring-offset-white dark:ring-offset-slate-900 animate-pulse'
                  : 'border-amber-500/35 dark:border-amber-400/40'
              }`}
              title={
                hasPendingBacklog
                  ? `Total Jumbo Points: ${jumboPointsCount} • ⚠️ Audit required: past check-ins pending`
                  : `Total Jumbo Points: ${jumboPointsCount} • Click to open Jumbo Vault Analytics`
              }
              aria-label="Open Jumbo Points Vault"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400/0 via-amber-300/20 to-amber-400/0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <Gem className="w-4 h-4 fill-amber-400 text-amber-500 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-xs font-black font-mono">
                {jumboPointsCount}
              </span>
              {hasPendingBacklog && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping flex-shrink-0" />
              )}
            </button>
          )}

          {/* 2. Consumer-Grade User Profile & Navigation Pill */}
          {user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition active:scale-95 cursor-pointer"
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Google User'}
                    className="w-7 h-7 rounded-full object-cover ring-1 ring-emerald-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500 text-white font-bold text-xs flex items-center justify-center font-mono">
                    {user.displayName
                      ? user.displayName.charAt(0).toUpperCase()
                      : user.email
                      ? user.email.charAt(0).toUpperCase()
                      : 'U'}
                  </div>
                )}
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 max-w-[120px] sm:max-w-[160px] truncate">
                  {user.displayName || user.email?.split('@')[0] || 'Account'}
                </span>
              </button>

              {/* Clean Dropdown Popover */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-100 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {user.displayName || 'User'}
                    </p>
                    <p className="text-xs text-slate-400 font-mono truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="pt-1">
                    {onLogoutGoogle && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogoutGoogle();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            onLoginGoogle && (
              <button
                type="button"
                onClick={onLoginGoogle}
                disabled={isSigningIn}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs text-xs font-bold text-slate-700 dark:text-slate-200 transition-all hover:scale-105 active:scale-95 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
                title="Sign in with Google"
              >
                {isSigningIn ? (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                ) : (
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span className="hidden sm:inline font-mono">
                  {isSigningIn ? 'Connecting...' : 'Sign In'}
                </span>
              </button>
            )
          )}

          {/* 3. New Habit Action Button */}
          <button
            onClick={onOpenNewHabit}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center group"
            title="Add New Habit"
            aria-label="Add New Habit"
          >
            <Plus className="w-4 h-4 text-emerald-500 dark:text-emerald-400 stroke-[3] group-hover:scale-110 transition-transform" />
          </button>

          {/* 4. Habit Directory Button */}
          <button
            onClick={onOpenDirectory}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Habit Directory & Management"
            aria-label="Habit Directory & Management"
          >
            <ListChecks className="w-4 h-4 text-cyan-500" />
          </button>

          {/* 5. System Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-90 hover:scale-105 cursor-pointer flex items-center justify-center"
            title="Settings & Data Management"
            aria-label="Settings & Data Management"
          >
            <Settings className="w-4 h-4 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors" />
          </button>

          {/* 6. Exit Session / Switch Profile Button */}
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

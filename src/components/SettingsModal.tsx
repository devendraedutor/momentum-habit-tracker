import React, { useState } from 'react';
import type { Habit, UserSettings } from '../types/habit';
import { exportBackupData, importBackupData } from '../lib/storage';
import {
  X,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Sparkles,
  Settings,
  AlertTriangle,
  ShieldCheck,
  Sun,
  Moon,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  settings: UserSettings;
  jumboDates?: string[];
  onUpdateSettings: (settings: UserSettings) => void;
  onRestoreHabits: (habits: Habit[]) => void;
  onRestoreJumboDates?: (dates: string[]) => void;
  onClearHistoryOnly: () => void;
  onFactoryReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  habits,
  settings,
  jumboDates = [],
  onUpdateSettings,
  onRestoreHabits,
  onRestoreJumboDates,
  onClearHistoryOnly,
  onFactoryReset,
}) => {
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [confirmMode, setConfirmMode] = useState<'none' | 'history' | 'factory'>('none');

  if (!isOpen) return null;

  const handleExport = () => {
    exportBackupData(habits, settings, jumboDates);
    setImportError('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = importBackupData(text);
        if (result && Array.isArray(result.habits)) {
          onRestoreHabits(result.habits);
          if (result.settings) {
            onUpdateSettings(result.settings);
          }
          if (result.jumboDates && onRestoreJumboDates) {
            onRestoreJumboDates(result.jumboDates);
          }
          setImportSuccess(true);
          setImportError('');
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Invalid backup file format');
        }
      } catch (err: unknown) {
        setImportError((err as Error).message || 'Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div
        className="w-full max-w-lg max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-750 shadow-2xl flex flex-col overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-750 flex items-center justify-between gap-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-xs">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                Settings & System
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Preferences, audio feedback, backups & data reset
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: System Preferences */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 font-mono">
              System Preferences
            </h3>
            <div className="space-y-2.5">
              {/* Theme Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Color Theme</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Dark / Light UI appearance</div>
                  </div>
                </div>
                <div className="flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-850 border border-slate-300 dark:border-slate-700">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      settings.theme === 'light'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                      settings.theme === 'dark'
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark
                  </button>
                </div>
              </div>

              {/* Sound Effects */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {settings.soundEffects ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Audio Feedback</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Sound effects on check-in and rewards</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, soundEffects: !settings.soundEffects })}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                    settings.soundEffects ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white block shadow-xs" />
                </button>
              </div>

              {/* Confetti */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Confetti Celebrations</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Particles on perfect days and goal clears</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, confetti: !settings.confetti })}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                    settings.confetti ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white block shadow-xs" />
                </button>
              </div>

              {/* Hold Score Floor at 0 */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <ShieldCheck className="w-4 h-4 text-cyan-500" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100">Score Floor at 0 XP</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Prevent habit scores from going below 0</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, floorAtZero: !settings.floorAtZero })}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center cursor-pointer ${
                    settings.floorAtZero ? 'bg-cyan-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white block shadow-xs" />
                </button>
              </div>
            </div>
          </div>

          {/* Section 2: Data Backup & Restore */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 font-mono">
              Backup & Portability
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 hover:border-emerald-500/50 text-left flex items-center gap-3 transition-all cursor-pointer group"
              >
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                  <Download className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Export Backup</div>
                  <div className="text-[10px] text-slate-500 font-mono">Download JSON file</div>
                </div>
              </button>

              <label className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 hover:border-cyan-500/50 text-left flex items-center gap-3 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition-transform">
                  <Upload className="w-4.5 h-4.5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Import Backup</div>
                  <div className="text-[10px] text-slate-500 font-mono">Restore JSON file</div>
                </div>
              </label>
            </div>

            {importSuccess && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium font-mono">
                ✓ Data restored successfully!
              </div>
            )}
            {importError && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium font-mono">
                ✕ {importError}
              </div>
            )}
          </div>

          {/* Section 3: Danger Zone & Erase Data */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-rose-500 dark:text-rose-400 mb-3 font-mono">
              Danger Zone & Reset
            </h3>
            <div className="space-y-2.5">
              {/* 1. Clear History Only */}
              {confirmMode === 'history' ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 animate-scale-in">
                  <div className="text-xs font-bold text-amber-700 dark:text-amber-300 mb-1">
                    Clear all check-in history?
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">
                    Your habit definitions will be preserved, but all daily check-in logs will be reset.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClearHistoryOnly();
                        setConfirmMode('none');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs font-mono shadow-xs cursor-pointer hover:bg-amber-400"
                    >
                      Yes, Clear Logs
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmMode('none')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmMode('history')}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-amber-500/10 border border-slate-200 dark:border-slate-750 hover:border-amber-500/30 text-left flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors">
                        Clear Check-In History Only
                      </div>
                      <div className="text-[10px] text-slate-500">Keep habits, reset daily logs & streaks</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 group-hover:text-amber-500">
                    Reset Logs →
                  </span>
                </button>
              )}

              {/* 2. Factory Reset / Erase All */}
              {confirmMode === 'factory' ? (
                <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 animate-scale-in">
                  <div className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Permanent Factory Reset</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-3">
                    This will permanently erase all habits, check-in history, and stored data.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onFactoryReset();
                        setConfirmMode('none');
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs font-mono shadow-xs cursor-pointer hover:bg-rose-500"
                    >
                      Yes, Erase Everything
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmMode('none')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-mono cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmMode('factory')}
                  className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 hover:bg-rose-500/10 border border-slate-200 dark:border-slate-750 hover:border-rose-500/30 text-left flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <Trash2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-500 transition-colors">
                        Erase All Data & Factory Reset
                      </div>
                      <div className="text-[10px] text-slate-500">Completely wipe all habits and start fresh</div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-rose-500 font-bold">
                    Erase All →
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import type { Habit, UserSettings } from '../types/habit';
import { exportBackupData, importBackupData, generateDemoHabits } from '../lib/storage';
import { X, Download, Upload, RefreshCw, Volume2, VolumeX, Sparkles, Sliders, AlertTriangle, ShieldCheck, Sun, Moon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onRestoreHabits: (habits: Habit[]) => void;
  onResetAll: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  habits,
  settings,
  onUpdateSettings,
  onRestoreHabits,
  onResetAll,
}) => {
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    const jsonStr = exportBackupData(habits, settings);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `momentum-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = importBackupData(text);
        if (result) {
          onRestoreHabits(result.habits);
          onUpdateSettings(result.settings);
          setImportSuccess(true);
          setImportError('');
          setTimeout(() => setImportSuccess(false), 3000);
        } else {
          setImportError('Invalid backup JSON format');
        }
      } catch (err: unknown) {
        setImportError((err as Error).message || 'Failed to parse JSON file');
      }
    };
    reader.readAsText(file);
  };

  const handleLoadDemo = () => {
    const demoHabits = generateDemoHabits();
    onRestoreHabits(demoHabits);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-xl glass-card bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 relative border border-slate-200 dark:border-slate-700 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings & Preferences</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Theme, audio, and data management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Application Preferences
            </h3>
            <div className="space-y-3">
              {/* Theme Selector */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Color Theme</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Toggle comfortable dark or crisp light mode</div>
                  </div>
                </div>
                <div className="flex items-center p-1 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                  <button
                    onClick={() => onUpdateSettings({ ...settings, theme: 'light' })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                      settings.theme === 'light'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
                  </button>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, theme: 'dark' })}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
                      settings.theme === 'dark'
                        ? 'bg-slate-950 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark
                  </button>
                </div>
              </div>

              {/* Audio */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {settings.soundEffects ? <Volume2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Audio Feedback</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Play responsive audio tones on +1/-1 check-ins</div>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, soundEffects: !settings.soundEffects })}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center ${
                    settings.soundEffects ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white block shadow-xs" />
                </button>
              </div>

              {/* Confetti */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Confetti Celebrations</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Celebrate streak milestones and routine completions</div>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, confetti: !settings.confetti })}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center ${
                    settings.confetti ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white block shadow-xs" />
                </button>
              </div>

              {/* Score Floor */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Hold Score Floor at 0</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Prevent momentum scores from dipping into negative values</div>
                  </div>
                </div>
                <button
                  onClick={() => onUpdateSettings({ ...settings, floorAtZero: !settings.floorAtZero })}
                  className={`w-12 h-6.5 rounded-full p-1 transition-colors flex items-center ${
                    settings.floorAtZero ? 'bg-cyan-500 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <span className="w-4.5 h-4.5 rounded-full bg-white block shadow-xs" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Data Backup & Portability
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-left flex flex-col justify-between group transition-all shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">.json</span>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Export Backup
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Download full habit history</div>
                </div>
              </button>

              <label className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-left flex flex-col justify-between group cursor-pointer transition-all shadow-2xs">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex items-center justify-between">
                  <Upload className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Restore</span>
                </div>
                <div className="mt-3">
                  <div className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
                    Import Backup
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Restore data from file</div>
                </div>
              </label>
            </div>

            {importSuccess && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                Data restored successfully!
              </div>
            )}
            {importError && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-medium">
                {importError}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Optional Sample Data & Reset
            </h3>
            <div className="space-y-3">
              <button
                onClick={handleLoadDemo}
                className="w-full p-3.5 rounded-2xl bg-slate-50 dark:bg-gradient-to-r dark:from-slate-900 dark:to-slate-850 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/50 text-left flex items-center justify-between group transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Load Sample Demo Habits</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Optional 60 days of sample data to preview trajectories</div>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-500/30">
                  Load Samples
                </span>
              </button>

              <div className="pt-2">
                {showResetConfirm ? (
                  <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-rose-800 dark:text-rose-300">
                      <strong className="block font-bold">Clear all habit data?</strong>
                      This will erase all check-ins and reset local storage.
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onResetAll();
                          setShowResetConfirm(false);
                          onClose();
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-colors"
                      >
                        Yes, Erase All
                      </button>
                      <button
                        onClick={() => setShowResetConfirm(false)}
                        className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full p-3 rounded-2xl text-left text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
                  >
                    <span className="flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Erase All Habits & Reset
                    </span>
                    <span>Clear Everything</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

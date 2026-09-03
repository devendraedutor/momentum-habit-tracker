import React, { useState } from 'react';
import type { Habit, UserSettings, ChartTimeRange } from '../types/habit';
import { DashboardStats } from './DashboardStats';
import { MomentumChart } from './MomentumChart';
import { ConsistencyHeatmap } from './ConsistencyHeatmap';
import { DynamicIcon } from './DynamicIcon';
import { calculateHabitStats } from '../lib/momentum';
import { exportBackupData, importBackupData } from '../lib/storage';
import {
  X,
  TrendingUp,
  Sliders,
  Plus,
  Edit2,
  Archive,
  Trash2,
  Target,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Sparkles,
  ShieldCheck,
  Download,
  Upload,
  AlertTriangle,
  RotateCcw,
  Check,
  Flame,
  ChevronRight,
} from 'lucide-react';

interface CornerHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onOpenNewHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
  onRestoreHabits: (habits: Habit[]) => void;
  onClearHistoryOnly: () => void;
  onResetActiveDateCheckIns: () => void;
  onFactoryReset: () => void;
  timeRange: ChartTimeRange;
  onTimeRangeChange: (range: ChartTimeRange) => void;
  selectedChartHabitId: string | 'all';
  onSelectChartHabitId: (id: string | 'all') => void;
  jumboPointsCount?: number;
  onSelectHabitProfile?: (habit: Habit) => void;
}

export const CornerHubModal: React.FC<CornerHubModalProps> = ({
  isOpen,
  onClose,
  habits,
  settings,
  onUpdateSettings,
  onOpenNewHabit,
  onEditHabit,
  onArchiveHabit,
  onDeleteHabit,
  onRestoreHabits,
  onClearHistoryOnly,
  onResetActiveDateCheckIns,
  onFactoryReset,
  timeRange,
  onTimeRangeChange,
  selectedChartHabitId,
  onSelectChartHabitId,
  jumboPointsCount = 0,
  onSelectHabitProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'habits' | 'settings'>('analytics');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [resetFeedback, setResetFeedback] = useState<string | null>(null);

  // Granular Reset Dialog State
  const [activeResetModal, setActiveResetModal] = useState<'history' | 'today' | 'factory' | null>(null);

  if (!isOpen) return null;

  const handleExport = () => {
    exportBackupData(habits, settings);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const data = importBackupData(content);
      if (data) {
        onRestoreHabits(data.habits);
        onUpdateSettings(data.settings);
        setImportSuccess(true);
        setImportError(null);
        setTimeout(() => setImportSuccess(false), 3000);
      } else {
        setImportError('Invalid backup JSON file.');
        setImportSuccess(false);
      }
    };
    reader.readAsText(file);
  };

  const triggerResetFeedback = (msg: string) => {
    setResetFeedback(msg);
    setTimeout(() => setResetFeedback(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">Hub & Analytics</h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-3 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'analytics'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" /> Analytics
          </button>

          <button
            onClick={() => setActiveTab('habits')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'habits'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-cyan-500" /> Active Habits ({habits.filter((h) => !h.archived).length})
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-slate-200 dark:border-slate-700'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Settings & Reset
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 1. Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="space-y-4 animate-fade-in">
              <DashboardStats habits={habits} jumboPointsCount={jumboPointsCount} floorAtZero={settings.floorAtZero} />

              {/* Chart Filter Pills */}
              {habits.filter((h) => !h.archived).length > 0 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => onSelectChartHabitId('all')}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${
                      selectedChartHabitId === 'all'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    All Aggregate
                  </button>

                  {habits
                    .filter((h) => !h.archived)
                    .map((h) => (
                      <button
                        key={h.id}
                        onClick={() => onSelectChartHabitId(h.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 cursor-pointer ${
                          selectedChartHabitId === h.id
                            ? 'text-slate-900 dark:text-white border shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                        style={{
                          backgroundColor: selectedChartHabitId === h.id ? `${h.color}20` : undefined,
                          borderColor: selectedChartHabitId === h.id ? h.color : undefined,
                        }}
                      >
                        <DynamicIcon name={h.icon} className="w-3.5 h-3.5" />
                        <span>{h.name}</span>
                      </button>
                    ))}
                </div>
              )}

              <MomentumChart
                habits={habits}
                selectedHabitId={selectedChartHabitId}
                timeRange={timeRange}
                onTimeRangeChange={onTimeRangeChange}
                floorAtZero={settings.floorAtZero}
                theme={settings.theme}
                onSelectDate={() => onClose()}
              />

              {habits.length > 0 && <ConsistencyHeatmap habits={habits} theme={settings.theme} />}
            </div>
          )}

          {/* 2. Habits Management Tab */}
          {activeTab === 'habits' && (() => {
            const activeHabitsList = habits.filter((h) => !h.archived);
            const archivedHabitsList = habits.filter((h) => h.archived);

            return (
              <div className="space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Active Habits ({activeHabitsList.length})
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenNewHabit();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" /> Add Habit
                  </button>
                </div>

                {activeHabitsList.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <p className="text-sm">No active habits. Click "Add Habit" to start!</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {activeHabitsList.map((h) => {
                      const isBreak = h.type === 'BREAK';
                      const stats = calculateHabitStats(h, false);

                      return (
                        <div
                          key={h.id}
                          onClick={() => {
                            if (onSelectHabitProfile) {
                              onClose();
                              onSelectHabitProfile(h);
                            }
                          }}
                          className="p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3 transition-all shadow-xs cursor-pointer group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center text-white flex-shrink-0 shadow-xs group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: `${h.color}25`, color: h.color, border: `1.5px solid ${h.color}40` }}
                            >
                              <DynamicIcon name={h.icon} className="w-5.5 h-5.5" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-cyan-500 dark:group-hover:text-cyan-400 transition-colors truncate">
                                  {h.name}
                                </span>
                                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase font-mono ${
                                  isBreak
                                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                  {isBreak ? 'BREAK' : 'BUILD'}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold uppercase">
                                  {h.category}
                                </span>
                              </div>

                              {/* Habit-Specific Core Stats */}
                              <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono flex-wrap">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  {stats.currentScore > 0 ? `+${stats.currentScore}` : stats.currentScore} XP
                                </span>
                                <span>•</span>
                                <span className="text-amber-500 font-bold flex items-center gap-1">
                                  <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                  <span>{stats.currentStreak}d streak</span>
                                </span>
                                <span>•</span>
                                <span>Day {stats.currentGoalStreak}/{h.targetGoalDays || 21} goal</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                onClose();
                                onEditHabit(h);
                              }}
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                              title="Edit Habit"
                            >
                              <Edit2 className="w-4 h-4 text-amber-500" />
                            </button>
                            <button
                              onClick={() => onArchiveHabit(h.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                              title="Archive Habit"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteHabit(h.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="Delete Habit"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </button>
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 group-hover:translate-x-0.5 transition-all ml-1" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Archived Habits Section (if any) */}
                {archivedHabitsList.length > 0 && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                      Archived Habits ({archivedHabitsList.length})
                    </span>
                    <div className="space-y-2">
                      {archivedHabitsList.map((h) => (
                        <div
                          key={h.id}
                          className="p-3 rounded-2xl bg-slate-100/50 dark:bg-slate-800/40 border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-between gap-3 opacity-70"
                        >
                          <div className="flex items-center gap-3">
                            <DynamicIcon name={h.icon} className="w-5 h-5 text-slate-400" />
                            <div>
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 line-through">
                                {h.name}
                              </span>
                              <span className="ml-2 text-[10px] text-amber-500 font-semibold font-mono">Archived</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => onArchiveHabit(h.id)}
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500 hover:text-white cursor-pointer"
                            >
                              Unarchive
                            </button>
                            <button
                              onClick={() => onDeleteHabit(h.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer"
                              title="Delete permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* 3. Settings & Selective Reset Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4 animate-fade-in">
              <div className="space-y-2.5">
                {/* Theme toggle */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
                      {settings.theme === 'dark' ? <Moon className="w-4 h-4 text-cyan-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Theme Mode</span>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                    className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-slate-700 text-xs font-bold text-slate-900 dark:text-white cursor-pointer"
                  >
                    {settings.theme === 'dark' ? 'Dark' : 'Light'}
                  </button>
                </div>

                {/* Sound Effects */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
                      {settings.soundEffects ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Audio Feedback</span>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, soundEffects: !settings.soundEffects })}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                      settings.soundEffects ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white block shadow-xs" />
                  </button>
                </div>

                {/* Confetti */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Confetti Celebrations</span>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, confetti: !settings.confetti })}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                      settings.confetti ? 'bg-emerald-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white block shadow-xs" />
                  </button>
                </div>

                {/* Zero Floor */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700">
                      <ShieldCheck className="w-4 h-4 text-cyan-500" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">Zero Score Floor</span>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ ...settings, floorAtZero: !settings.floorAtZero })}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors flex items-center cursor-pointer ${
                      settings.floorAtZero ? 'bg-cyan-500 justify-end' : 'bg-slate-300 dark:bg-slate-600 justify-start'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-white block shadow-xs" />
                  </button>
                </div>
              </div>

              {/* Backup JSON */}
              <div className="pt-2 grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleExport}
                  className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-left flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-4 h-4 text-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Export Backup</span>
                </button>

                <label className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-400 text-left flex items-center gap-2 cursor-pointer transition-all">
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  <Upload className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Import Backup</span>
                </label>
              </div>

              {resetFeedback && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                  <Check className="w-4 h-4 stroke-[3]" /> {resetFeedback}
                </div>
              )}

              {importSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-semibold">
                  Restored successfully!
                </div>
              )}
              {importError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 text-xs font-semibold">
                  {importError}
                </div>
              )}

              {/* Granular Selective Reset Section */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Data Reset Options (Choose What to Erase)
                </span>

                {/* Option 1: Clear Check-in History Only (Keep habits intact) */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-cyan-500" /> Clear Check-In History Only
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Resets all scores, XP, and streaks to 0 while <strong>keeping all your {habits.length} habits intact</strong>.
                    </p>
                  </div>
                  {activeResetModal === 'history' ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          onClearHistoryOnly();
                          setActiveResetModal(null);
                          triggerResetFeedback('Check-in history cleared! All habits kept intact.');
                        }}
                        className="px-3 py-1 bg-cyan-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setActiveResetModal(null)}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveResetModal('history')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 cursor-pointer flex-shrink-0"
                    >
                      Clear History
                    </button>
                  )}
                </div>

                {/* Option 2: Reset Today's Queue */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-500" /> Reset Today's Queue
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Clears only today's check-ins and puts all habits back in the queue deck.
                    </p>
                  </div>
                  {activeResetModal === 'today' ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          onResetActiveDateCheckIns();
                          setActiveResetModal(null);
                          triggerResetFeedback("Today's queue reset successfully.");
                        }}
                        className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setActiveResetModal(null)}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveResetModal('today')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 cursor-pointer flex-shrink-0"
                    >
                      Reset Queue
                    </button>
                  )}
                </div>

                {/* Option 3: Full Factory Reset */}
                <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> Factory Reset (Delete Everything)
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Permanently erases all habits, custom categories, history, and settings.
                    </p>
                  </div>
                  {activeResetModal === 'factory' ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => {
                          onFactoryReset();
                          setActiveResetModal(null);
                          onClose();
                        }}
                        className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Erase All
                      </button>
                      <button
                        onClick={() => setActiveResetModal(null)}
                        className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-xs rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setActiveResetModal('factory')}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 cursor-pointer flex-shrink-0"
                    >
                      Factory Reset
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

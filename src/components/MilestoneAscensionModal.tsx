import React, { useState } from 'react';
import type { Habit } from '../types/habit';
import { sound } from '../lib/audio';
import {
  X,
  Trophy,
  Crown,
  Sparkles,
  Zap,
  Target,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MilestoneAscensionModalProps {
  habit: Habit | null;
  isOpen: boolean;
  onClose: () => void;
  onAscend: (habitId: string, newTargetDays: number, bonusXP: number) => void;
}

export const MilestoneAscensionModal: React.FC<MilestoneAscensionModalProps> = ({
  habit,
  isOpen,
  onClose,
  onAscend,
}) => {
  if (!isOpen || !habit) return null;

  const currentTarget = habit.targetGoalDays || 21;
  const currentTier = habit.currentTier || 1;
  const nextTier = currentTier + 1;
  const bonusRewardXP = 5;

  // Clean goal presets for next tier
  const preset1 = 7;
  const preset2 = 14;
  const preset3 = 21;
  const preset4 = 30;

  const [selectedTarget, setSelectedTarget] = useState<number>(currentTarget || 7);
  const [customDays, setCustomDays] = useState<string>('');
  const [isCustom, setIsCustom] = useState(false);

  const handleSelectPreset = (days: number) => {
    setSelectedTarget(days);
    setIsCustom(false);
  };

  const handleCustomChange = (val: string) => {
    setCustomDays(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num > 0) {
      setSelectedTarget(num);
    }
  };

  const handleConfirm = () => {
    const finalTarget = isCustom ? parseInt(customDays, 10) || preset1 : selectedTarget;

    // Trigger celebration effects
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#8b5cf6'],
    });
    sound.playMilestone();

    onAscend(habit.id, finalTarget, bonusRewardXP);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 relative border border-amber-500/30 shadow-2xl overflow-hidden animate-scale-in">
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Celebration Header */}
        <div className="flex flex-col items-center text-center relative z-10 pt-2 pb-4">
          {/* Pulsing Trophy Medallion */}
          <div className="relative mb-3.5">
            <div className="w-18 h-18 rounded-3xl bg-gradient-to-tr from-amber-400 via-yellow-400 to-amber-600 p-0.5 shadow-xl shadow-amber-500/30 animate-bounce">
              <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center text-amber-400">
                <Trophy className="w-9 h-9" />
              </div>
            </div>
            <span className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg font-bold">
              <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950" />
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-[11px] font-black font-mono uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5" />
            <span>Milestone Conquered!</span>
          </div>

          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Ascend & Level Up
          </h2>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
            You completed the <strong className="text-slate-900 dark:text-white font-mono">{currentTarget}-Day Goal</strong> for{' '}
            <span className="text-amber-600 dark:text-amber-400 font-bold">{habit.name}</span>!
          </p>
        </div>

        {/* Unlocked Rewards Showcase */}
        <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-cyan-500/10 border border-amber-500/25 relative z-10">
          <div className="text-[10px] font-black uppercase font-mono tracking-wider text-slate-400 mb-2">
            Unlocked Rewards:
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Crown Level Up */}
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Mastery Rank</div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  Tier {nextTier} 👑
                </div>
              </div>
            </div>

            {/* Instant Bonus XP */}
            <div className="p-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="text-[10px] font-mono text-slate-400">Clear Bonus</div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  +{bonusRewardXP} Bonus XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Target Milestone Selection */}
        <div className="my-4 relative z-10">
          <label className="text-xs font-black uppercase font-mono tracking-wider text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-cyan-500" />
            <span>Set Next Challenge Target:</span>
          </label>

          {/* Presets Grid */}
          <div className="grid grid-cols-4 gap-1.5 mb-2.5">
            <button
              type="button"
              onClick={() => handleSelectPreset(preset1)}
              className={`p-2 rounded-xl border font-mono text-center transition-all cursor-pointer ${
                !isCustom && selectedTarget === preset1
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black ring-2 ring-amber-500/30'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-bold'
              }`}
            >
              <div className="text-[9px] opacity-80">Tier Goal</div>
              <div className="text-xs font-black">{preset1}d</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset(preset2)}
              className={`p-2 rounded-xl border font-mono text-center transition-all cursor-pointer ${
                !isCustom && selectedTarget === preset2
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black ring-2 ring-amber-500/30'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-bold'
              }`}
            >
              <div className="text-[9px] opacity-80">Tier Goal</div>
              <div className="text-xs font-black">{preset2}d</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset(preset3)}
              className={`p-2 rounded-xl border font-mono text-center transition-all cursor-pointer ${
                !isCustom && selectedTarget === preset3
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black ring-2 ring-amber-500/30'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-bold'
              }`}
            >
              <div className="text-[9px] opacity-80">Tier Goal</div>
              <div className="text-xs font-black">{preset3}d</div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset(preset4)}
              className={`p-2 rounded-xl border font-mono text-center transition-all cursor-pointer ${
                !isCustom && selectedTarget === preset4
                  ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md font-black ring-2 ring-amber-500/30'
                  : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 font-bold'
              }`}
            >
              <div className="text-[9px] opacity-80">Tier Goal</div>
              <div className="text-xs font-black">{preset4}d</div>
            </button>
          </div>

          {/* Custom Days Input */}
          <div className="relative">
            <input
              type="number"
              placeholder="Custom Target Days (e.g. 10, 21, 66...)"
              value={customDays}
              onChange={(e) => {
                setIsCustom(true);
                handleCustomChange(e.target.value);
              }}
              className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border text-xs font-mono transition-all text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none ${
                isCustom
                  ? 'border-cyan-500 ring-2 ring-cyan-500/20'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleConfirm}
          className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Confirm & Collect Reward 🚀</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};

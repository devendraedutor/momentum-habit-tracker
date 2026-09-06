import React from 'react';
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
import { getTierByLevel } from '../config/progression';

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

  const currentAchievedLevel = Math.max(1, habit.currentLevel ?? 1);
  const unlockedTier = getTierByLevel(currentAchievedLevel);
  const nextLevel = Math.min(7, currentAchievedLevel + 1);
  const nextTier = getTierByLevel(nextLevel);
  const bonusRewardXP = 5;

  const handleConfirm = () => {
    // Trigger celebration effects
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#f59e0b', '#10b981', '#06b6d4', '#ec4899', '#8b5cf6'],
    });
    sound.playMilestone();

    onAscend(habit.id, nextTier.days, bonusRewardXP);
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

          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs font-black font-mono uppercase tracking-wider mb-2">
            <Crown className="w-3.5 h-3.5" />
            <span>LEVEL {currentAchievedLevel} UNLOCKED!</span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
            You completed the <strong className="text-slate-900 dark:text-white font-mono">{unlockedTier.days}-Day Goal</strong> for{' '}
            <span className="text-amber-600 dark:text-amber-400 font-bold">{habit.name}</span>!
          </p>
        </div>

        {/* Unlocked Rewards Showcase */}
        <div className="my-3 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-cyan-500/10 border border-amber-500/25 relative z-10">
          <div className="text-[10px] font-black uppercase font-mono tracking-wider text-slate-400 mb-2">
            Unlocked Tier & Rewards:
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {/* Level Progression */}
            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center flex-shrink-0">
                <Crown className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-black text-slate-900 dark:text-white font-mono flex items-center gap-1 whitespace-nowrap">
                  <span>Lv.{currentAchievedLevel}</span>
                  <span className="text-amber-500">👑</span>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 truncate">{unlockedTier.name}</span>
                </div>
              </div>
            </div>

            {/* Instant Bonus XP */}
            <div className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-2.5 shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center flex-shrink-0">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono whitespace-nowrap">
                  +{bonusRewardXP} Bonus XP
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mindset Tag & Next Fixed Tier Milestone Showcase */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-emerald-500/10 border border-amber-500/30 relative z-10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black font-mono text-slate-900 dark:text-white uppercase tracking-wider">
                  Next: Level {nextTier.level} ({nextTier.name})
                </div>
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-mono font-bold">
                  {nextTier.tag}
                </div>
              </div>
            </div>
            <span className="px-3 py-1 rounded-xl bg-amber-500 text-slate-950 text-xs font-black font-mono shadow-xs">
              {nextTier.days} D
            </span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
            Next sprint target resets to <strong>0 / {nextTier.days} D</strong> for Level {nextTier.level}!
          </p>
        </div>

        {/* Celebratory Action Button */}
        <button
          onClick={handleConfirm}
          className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] cursor-pointer group relative overflow-hidden"
        >
          {/* Subtle sheen highlight animation across button */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent animate-bar-sheen pointer-events-none" />
          
          <Sparkles className="w-4 h-4 fill-slate-950 text-slate-950 transition-transform group-hover:rotate-12" />
          <span className="tracking-wide">Claim Reward & Start Level {nextTier.level}</span>
          <ArrowRight className="w-4 h-4 stroke-[3] group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};

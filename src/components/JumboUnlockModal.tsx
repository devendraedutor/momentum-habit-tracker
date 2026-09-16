import React, { useEffect } from 'react';
import { Gem, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../lib/audio';
import { Modal } from './common/Modal';

interface JumboUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeHabitsCount?: number;
}

export const JumboUnlockModal: React.FC<JumboUnlockModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      sound.playMilestone();
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#f59e0b', '#fbbf24', '#06b6d4', '#10b981'],
      });
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="max-w-md"
      hideHeader
      className="p-6 sm:p-7 border border-amber-500/30 text-center"
      bodyClassName="p-0"
    >
      {/* Ambient Top Radiant Glow */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 bg-amber-400" />

      {/* Diamond Icon */}
      <div className="relative z-10 flex flex-col items-center mt-1">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 p-0.5 shadow-lg shadow-amber-500/20 mb-2.5 animate-bounce">
          <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
            <Gem className="w-7 h-7 fill-amber-400 text-amber-300 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          </div>
        </div>

        <h3 className="text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
          Jumbo Points Unlocked!
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs font-sans">
          Score +1 💎 every time you complete 100% of your habits in a day.
        </p>
      </div>

      {/* 2 Clean Micro-Cards */}
      <div className="mt-4 grid grid-cols-2 gap-2 text-left relative z-10">
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block font-mono">
            Reward
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-1 block">
            +1 💎 Point
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-center">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block font-mono">
            Requirement
          </span>
          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 block">
            ≥ 3 Habits
          </span>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-5 relative z-10">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider font-mono shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
        >
          <span>Got it!</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </Modal>
  );
};

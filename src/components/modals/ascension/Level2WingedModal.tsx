import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from '../../DynamicIcon';
import { HABIT_ENTRANCE_PHYSICS, type HabitCategory } from '../../../utils/habitFX';
import { ArrowRight, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Habit } from '../../../types/habit';
import type { LevelMeta } from '../../../config/ascensionMeta';

interface Level2WingedModalProps {
  habit: Habit | null;
  meta: LevelMeta;
  category: HabitCategory;
  onClose: () => void;
}

export const Level2WingedModal: React.FC<Level2WingedModalProps> = ({
  habit,
  meta,
  category,
  onClose,
}) => {
  const habitColor = habit?.color || '#06b6d4';
  const entrance = HABIT_ENTRANCE_PHYSICS[category];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 25 }}
      animate={{ scale: [0.8, 1.04, 1.0], opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0, y: 15 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className="relative w-full max-w-sm rounded-t-[2.5rem] rounded-b-xl border-t-4 border-t-cyan-400 border-x border-b border-slate-200 dark:border-slate-800 p-8 text-center flex flex-col items-center overflow-hidden z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl shadow-cyan-500/20 dark:shadow-black/70 transition-colors duration-200"
    >
      {/* High-Voltage Cyan Halo */}
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 bg-cyan-400/20 dark:bg-cyan-500/25 blur-3xl rounded-full pointer-events-none" />

      {/* Top Winged Header Chip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1.5 px-4 py-1 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400 text-[11px] font-black tracking-wider uppercase mb-3 shadow-2xs"
      >
        <Zap className="w-3.5 h-3.5 fill-cyan-500 text-cyan-500" />
        <span>7-DAY MOMENTUM CREST</span>
      </motion.div>

      {/* Center Winged Emblem (Flanked with Electric Wing Chevrons) */}
      <motion.div
        key={`winged-emblem-${habit?.id}`}
        {...entrance}
        className="relative my-3 flex items-center justify-center"
      >
        {/* Left Wing Chevron */}
        <div className="flex -space-x-1.5 text-cyan-400 opacity-70 animate-pulse mr-2">
          <ChevronLeft className="w-6 h-6 stroke-[3]" />
          <ChevronLeft className="w-6 h-6 stroke-[3]" />
        </div>

        {/* Center Emblem */}
        <div className="relative flex flex-col items-center">
          <div className="absolute inset-0 bg-cyan-400/30 rounded-3xl blur-xl animate-pulse" />

          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 p-1 shadow-xl flex items-center justify-center">
            <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[14px] flex items-center justify-center">
              {habit?.icon ? (
                <div style={{ color: habitColor }}>
                  <DynamicIcon name={habit.icon} className="w-12 h-12" />
                </div>
              ) : (
                <span className="text-5xl select-none">⚡</span>
              )}
            </div>
          </div>

          {/* Level 2 Winged Badge */}
          <div className="absolute -bottom-2.5 px-3.5 py-0.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-black font-mono shadow-md border border-white/60 dark:border-black/40">
            Lv. 2 Unlocked
          </div>
        </div>

        {/* Right Wing Chevron */}
        <div className="flex -space-x-1.5 text-cyan-400 opacity-70 animate-pulse ml-2">
          <ChevronRight className="w-6 h-6 stroke-[3]" />
          <ChevronRight className="w-6 h-6 stroke-[3]" />
        </div>
      </motion.div>

      {/* Hero Habit Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-4 w-full flex flex-col items-center"
      >
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate max-w-[280px]">
          {habit?.name || 'Habit'}
        </h2>

        {/* Mindset Tag */}
        <h3 className="text-lg font-black bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent mt-1">
          ⚡ {meta.mindsetTag}
        </h3>

        <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[260px] mx-auto mt-1 leading-snug">
          "{meta.celebrationMessage}"
        </p>
      </motion.div>

      {/* Target Leap Chip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.32 }}
        className="mt-4 inline-flex items-center gap-1.5 py-1.5 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-xs shadow-2xs"
      >
        <span>Completed: <b className="text-slate-800 dark:text-slate-200">7d</b></span>
        <span className="text-cyan-500 font-black">→</span>
        <span>Next Arena: <b className="text-cyan-600 dark:text-cyan-400">14d Ironclad</b></span>
      </motion.div>

      {/* Wide Gradient Action Bar */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClose}
        className="w-full mt-6 py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 active:scale-95 transition-all cursor-pointer"
      >
        <span>Ride the Momentum</span>
        <ArrowRight className="w-4 h-4 stroke-[3]" />
      </motion.button>
    </motion.div>
  );
};

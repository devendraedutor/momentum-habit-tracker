import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from '../../DynamicIcon';
import { HABIT_ENTRANCE_PHYSICS, type HabitCategory } from '../../../utils/habitFX';
import { ArrowRight, Shield } from 'lucide-react';
import type { Habit } from '../../../types/habit';
import type { LevelMeta } from '../../../config/ascensionMeta';

interface Level3ShieldModalProps {
  habit: Habit | null;
  meta: LevelMeta;
  category: HabitCategory;
  onClose: () => void;
}

export const Level3ShieldModal: React.FC<Level3ShieldModalProps> = ({
  habit,
  meta,
  category,
  onClose,
}) => {
  const habitColor = habit?.color || '#6366f1';
  const entrance = HABIT_ENTRANCE_PHYSICS[category];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 25 }}
      animate={{ scale: [0.8, 1.04, 1.0], opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0, y: 15 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className="relative w-full max-w-sm rounded-t-2xl rounded-b-[3.5rem] border-2 border-indigo-300 dark:border-indigo-700/80 p-9 text-center flex flex-col items-center overflow-hidden z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl shadow-indigo-500/20 dark:shadow-black/70 transition-colors duration-200"
    >
      {/* Heavy Metallic Indigo Aura */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-500/20 dark:bg-indigo-600/25 blur-3xl rounded-full pointer-events-none" />

      {/* Decorative Metallic Security Corner Rivets */}
      <div className="absolute top-3.5 left-4 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-600 shadow-inner" />
      <div className="absolute top-3.5 right-4 w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 border border-slate-400 dark:border-slate-600 shadow-inner" />

      {/* Top Shield Header Chip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1.5 px-4 py-1 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 text-[11px] font-black tracking-wider uppercase mb-3 shadow-2xs"
      >
        <Shield className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
        <span>14-DAY BASTION SHIELD</span>
      </motion.div>

      {/* Center Riveted Shield Plate Frame */}
      <motion.div
        key={`shield-emblem-${habit?.id}`}
        {...entrance}
        className="relative my-3 flex flex-col items-center"
      >
        <div className="absolute inset-0 bg-indigo-500/30 rounded-full blur-xl animate-pulse" />

        {/* Armored Plate Silhouette */}
        <div className="relative w-24 h-24 rounded-t-xl rounded-b-[2rem] bg-gradient-to-b from-slate-200 via-indigo-200 to-indigo-500 dark:from-slate-700 dark:via-indigo-900 dark:to-indigo-600 p-1 shadow-2xl flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-slate-950 rounded-t-[10px] rounded-b-[1.8rem] flex items-center justify-center">
            {habit?.icon ? (
              <div style={{ color: habitColor }}>
                <DynamicIcon name={habit.icon} className="w-12 h-12 filter drop-shadow-sm" />
              </div>
            ) : (
              <span className="text-5xl select-none">🛡️</span>
            )}
          </div>
        </div>

        {/* Level 3 Armor Pill */}
        <div className="absolute -bottom-2.5 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white text-xs font-black font-mono shadow-md border border-white/40 dark:border-black/40">
          Lv. 3 Ironclad
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
        <h3 className="text-lg font-black bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400 bg-clip-text text-transparent mt-1">
          🛡️ {meta.mindsetTag}
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
        <span>Completed: <b className="text-slate-800 dark:text-slate-200">14d</b></span>
        <span className="text-indigo-500 font-black">→</span>
        <span>Next Arena: <b className="text-indigo-600 dark:text-indigo-400">30d Crucible</b></span>
      </motion.div>

      {/* Royal Indigo Bastion Button */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClose}
        className="w-full mt-6 py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-600 to-purple-600 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/25 active:scale-95 transition-all cursor-pointer"
      >
        <span>Hold the Iron Defense</span>
        <ArrowRight className="w-4 h-4 stroke-[3]" />
      </motion.button>
    </motion.div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from '../../DynamicIcon';
import { HABIT_ENTRANCE_PHYSICS, type HabitCategory } from '../../../utils/habitFX';
import { ArrowRight, Sprout } from 'lucide-react';
import type { Habit } from '../../../types/habit';
import type { LevelMeta } from '../../../config/ascensionMeta';

interface Level1PebbleModalProps {
  habit: Habit | null;
  meta: LevelMeta;
  category: HabitCategory;
  onClose: () => void;
}

export const Level1PebbleModal: React.FC<Level1PebbleModalProps> = ({
  habit,
  meta,
  category,
  onClose,
}) => {
  const habitColor = habit?.color || '#10b981';
  const entrance = HABIT_ENTRANCE_PHYSICS[category];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 25 }}
      animate={{ scale: [0.8, 1.04, 1.0], opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0, y: 15 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className="relative w-full max-w-xs rounded-[3rem] p-7 text-center flex flex-col items-center overflow-hidden z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-emerald-500/25 dark:border-emerald-500/35 shadow-2xl shadow-emerald-500/15 dark:shadow-black/70 transition-colors duration-200"
    >
      {/* Mint Ambient Halo */}
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-400/20 dark:bg-emerald-500/20 blur-3xl rounded-full pointer-events-none" />

      {/* Floating Organic Leaf Crest Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-[11px] font-black tracking-wider uppercase mb-3 shadow-2xs"
      >
        <Sprout className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
        <span>THE 3-DAY SPARK</span>
      </motion.div>

      {/* Center Pebble Emblem */}
      <motion.div
        key={`pebble-emblem-${habit?.id}`}
        {...entrance}
        className="relative my-2 flex flex-col items-center"
      >
        <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-xl animate-pulse" />

        <div className="relative w-22 h-22 rounded-[2rem] bg-gradient-to-br from-emerald-400 via-teal-400 to-emerald-500 p-1 shadow-lg flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[1.8rem] flex items-center justify-center">
            {habit?.icon ? (
              <div style={{ color: habitColor }}>
                <DynamicIcon name={habit.icon} className="w-11 h-11" />
              </div>
            ) : (
              <span className="text-4xl select-none">🌱</span>
            )}
          </div>
        </div>

        {/* Level 1 Pill */}
        <div className="absolute -bottom-2.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 text-xs font-black font-mono shadow-md border border-white/60 dark:border-black/40">
          Lv. 1 Unlocked
        </div>
      </motion.div>

      {/* Hero Habit Title */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mt-4 w-full flex flex-col items-center"
      >
        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight truncate max-w-[240px]">
          {habit?.name || 'Habit'}
        </h2>

        {/* Mindset Tag */}
        <h3 className="text-base font-black bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent mt-1">
          🌱 {meta.mindsetTag}
        </h3>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 max-w-[230px] mx-auto mt-1 leading-snug">
          "{meta.celebrationMessage}"
        </p>
      </motion.div>

      {/* Target Leap Chip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.32 }}
        className="mt-4 inline-flex items-center gap-1.5 py-1.5 px-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono text-[11px] shadow-2xs"
      >
        <span>Sprint: <b className="text-slate-800 dark:text-slate-200">3d</b></span>
        <span className="text-emerald-500 font-black">→</span>
        <span>Arena: <b className="text-emerald-600 dark:text-emerald-400">7d Ready</b></span>
      </motion.div>

      {/* Compact Pill CTA */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClose}
        className="w-full mt-5 py-3.5 px-5 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
      >
        <span>Keep the Spark Alive</span>
        <ArrowRight className="w-4 h-4 stroke-[3]" />
      </motion.button>
    </motion.div>
  );
};

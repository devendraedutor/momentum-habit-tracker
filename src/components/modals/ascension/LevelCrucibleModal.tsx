import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from '../../DynamicIcon';
import { HABIT_ENTRANCE_PHYSICS, type HabitCategory } from '../../../utils/habitFX';
import { LEVEL_REQUIREMENTS } from '../../../config/progression';
import { ArrowRight, Flame, Crown } from 'lucide-react';
import type { Habit } from '../../../types/habit';
import type { LevelMeta } from '../../../config/ascensionMeta';

interface LevelCrucibleModalProps {
  habit: Habit | null;
  meta: LevelMeta;
  level: number;
  category: HabitCategory;
  onClose: () => void;
}

export const LevelCrucibleModal: React.FC<LevelCrucibleModalProps> = ({
  habit,
  meta,
  level,
  category,
  onClose,
}) => {
  const habitColor = habit?.color || '#f59e0b';
  const entrance = HABIT_ENTRANCE_PHYSICS[category];
  const prevTargetDays = LEVEL_REQUIREMENTS[level] || 30;
  const nextLevel = Math.min(7, level + 1);
  const nextTargetDays = LEVEL_REQUIREMENTS[nextLevel] || 365;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 25 }}
      animate={{ scale: [0.8, 1.04, 1.0], opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0, y: 15 }}
      transition={{ type: 'spring', stiffness: 380, damping: 24 }}
      className="relative w-full max-w-sm rounded-[2.2rem] ring-4 ring-amber-400/40 border border-slate-200 dark:border-slate-800 p-9 text-center flex flex-col items-center overflow-hidden z-10 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xl shadow-amber-500/20 dark:shadow-black/70 transition-colors duration-200"
    >
      {/* Radiant Molten Amber/Gold Core Aura */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-amber-500/20 dark:bg-amber-600/25 blur-3xl rounded-full pointer-events-none" />

      {/* Top Header Chip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`flex items-center gap-1.5 px-4 py-1 rounded-full border text-[11px] font-black tracking-wider uppercase mb-3 shadow-2xs ${meta.pillStyle}`}
      >
        <Flame className="w-3.5 h-3.5 fill-current" />
        <span>LEVEL {level} {meta.title.toUpperCase()}</span>
      </motion.div>

      {/* Center Radiant Diamond Emblem */}
      <motion.div
        key={`crucible-emblem-${habit?.id}`}
        {...entrance}
        className="relative my-3 flex flex-col items-center"
      >
        <div className="absolute inset-0 bg-amber-400/30 rounded-full blur-xl animate-pulse" />

        <div className="relative w-24 h-24 rounded-[1.8rem] bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-1 shadow-2xl flex items-center justify-center">
          <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[1.6rem] flex items-center justify-center">
            {habit?.icon ? (
              <div style={{ color: habitColor }}>
                <DynamicIcon name={habit.icon} className="w-12 h-12" />
              </div>
            ) : (
              <Crown className="w-12 h-12 text-amber-500 fill-amber-400" />
            )}
          </div>
        </div>

        {/* Level Shield Pill */}
        <div
          className={`absolute -bottom-2.5 px-3.5 py-0.5 rounded-full bg-gradient-to-r ${meta.levelBadgeStyle} text-xs font-black font-mono shadow-md border border-white/60 dark:border-black/40`}
        >
          Lv. {level} {meta.title}
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
        <h3
          className={`text-lg font-black bg-gradient-to-r ${meta.gradient} bg-clip-text text-transparent mt-1`}
        >
          🔥 {meta.mindsetTag}
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
        <span>Completed: <b className="text-slate-800 dark:text-slate-200">{prevTargetDays}d</b></span>
        <span className="text-amber-500 font-black">→</span>
        <span>
          Next Arena:{' '}
          <b className="text-amber-600 dark:text-amber-400">
            {level < 7 ? `${nextTargetDays}d Promoted` : 'Mastered Forever 👑'}
          </b>
        </span>
      </motion.div>

      {/* Radiant Action Button */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClose}
        className={`w-full mt-6 py-4 px-6 rounded-2xl bg-gradient-to-r ${meta.buttonGradient} ${meta.buttonShadow} font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all cursor-pointer`}
      >
        <span>{meta.buttonText || 'Continue Journey'}</span>
        <ArrowRight className="w-4 h-4 stroke-[3]" />
      </motion.button>
    </motion.div>
  );
};

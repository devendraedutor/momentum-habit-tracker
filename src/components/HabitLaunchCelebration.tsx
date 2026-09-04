import React, { useEffect } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { DynamicIcon } from './DynamicIcon';

interface HabitLaunchCelebrationProps {
  habitName: string;
  habitIcon: string;
  habitColor: string;
  onComplete: () => void;
}

export const HabitLaunchCelebration: React.FC<HabitLaunchCelebrationProps> = ({
  habitName,
  habitIcon,
  habitColor,
  onComplete,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 1400);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Generate 16 radial starburst sparks
  const sparks = Array.from({ length: 16 }).map((_, i) => {
    const angle = (i * 360) / 16;
    const distance = 100 + (i % 4) * 26;
    const rad = (angle * Math.PI) / 180;
    const x = Math.cos(rad) * distance;
    const y = Math.sin(rad) * distance;
    const size = 3.5 + (i % 3);
    return { id: i, x, y, size, delay: (i % 5) * 0.03 };
  });

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center p-4 select-none overflow-hidden"
      aria-live="polite"
    >
      {/* Ambient Radiant Backdrop Aura */}
      <div className="absolute inset-0 bg-slate-900/15 dark:bg-black/45 animate-launch-backdrop-1400 backdrop-blur-[2px]" />

      {/* Primary Expanding Holographic Shockwave */}
      <div
        className="absolute w-28 h-28 rounded-full border-2 animate-launch-shockwave-1400"
        style={{
          borderColor: habitColor || '#10b981',
          boxShadow: `0 0 30px ${habitColor || '#10b981'}, inset 0 0 30px ${habitColor || '#10b981'}`,
        }}
      />

      {/* Secondary Staggered Shockwave */}
      <div
        className="absolute w-28 h-28 rounded-full border border-cyan-400 animate-launch-shockwave-secondary-1400"
        style={{
          borderColor: habitColor ? `${habitColor}aa` : '#06b6d4',
          boxShadow: `0 0 20px ${habitColor || '#06b6d4'}`,
        }}
      />

      {/* 16 Radial Energy Spark Particles */}
      {sparks.map((s) => (
        <div
          key={s.id}
          className="absolute rounded-full animate-launch-spark-1400"
          style={
            {
              width: `${s.size}px`,
              height: `${s.size}px`,
              backgroundColor: s.id % 2 === 0 ? (habitColor || '#10b981') : '#38bdf8',
              boxShadow: `0 0 12px ${habitColor || '#10b981'}, 0 0 20px #38bdf8`,
              animationDelay: `${s.delay}s`,
              '--target-x': `${s.x}px`,
              '--target-y': `${s.y}px`,
            } as React.CSSProperties
          }
        />
      ))}

      {/* Central Hero Emblem & Habit Name Showcase */}
      <div className="relative z-10 flex flex-col items-center animate-launch-badge-1400">
        {/* Radiant Ambient Core Halo */}
        <div
          className="absolute -inset-4 rounded-3xl blur-2xl opacity-75 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${habitColor || '#10b981'} 0%, #06b6d4 50%, transparent 70%)`,
          }}
        />

        {/* Glowing Habit Icon Orb Emblem */}
        <div
          className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center p-1 shadow-2xl relative"
          style={{
            background: `linear-gradient(135deg, ${habitColor || '#10b981'}, #06b6d4, #6366f1)`,
            boxShadow: `0 0 40px ${habitColor || 'rgba(16, 185, 129, 0.75)'}, 0 0 70px rgba(6, 182, 212, 0.5)`,
          }}
        >
          <div className="w-full h-full bg-white dark:bg-slate-950 rounded-[22px] flex items-center justify-center relative overflow-hidden border border-slate-100 dark:border-white/10 shadow-inner">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-emerald-500/10 dark:via-white/20 to-transparent animate-bar-sheen" />
            <div style={{ color: habitColor || '#059669' }}>
              <DynamicIcon
                name={habitIcon}
                className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-[0_0_10px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_0_12px_rgba(255,255,255,0.9)] relative z-10"
              />
            </div>
          </div>

          <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 absolute -top-2.5 -right-2.5 text-amber-400 fill-amber-400 animate-spin drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]" />
        </div>

        {/* Floating Pill: Prominent Habit Name in Clean Light Mode */}
        <div className="mt-4 px-6 py-2.5 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-white/20 text-slate-900 dark:text-white shadow-2xl shadow-slate-300/60 dark:shadow-slate-950/80 flex items-center gap-3 backdrop-blur-xl max-w-sm">
          <div className="w-6 h-6 rounded-full bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/30 dark:border-emerald-400/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 shadow-xs">
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </div>

          <span className="text-base sm:text-lg font-black font-mono tracking-tight text-slate-900 dark:text-white truncate">
            {habitName || 'New Habit'}
          </span>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useCallback } from 'react';
import { AnimatePresence, useAnimate } from 'framer-motion';
import confetti from 'canvas-confetti';
import { getLevelMeta } from '../config/ascensionMeta';
import { DynamicIcon } from './DynamicIcon';
import { CuteRocket } from './ascension/CuteRocket';
import { GlossyBalloon } from './ascension/GlossyBalloon';
import {
  playRocketWhoosh,
  playBalloonPopFanfare,
} from '../utils/balloonAudio';
import type { Habit } from '../types/habit';

interface AscensionCeremonyModalProps {
  isOpen: boolean;
  habit: Habit | null;
  level: number;
  onClose: () => void;
}

const BALLOON_COLORS = ['#10b981', '#06b6d4', '#6366f1', '#f59e0b', '#d946ef', '#f43f5e', '#eab308'];

export const AscensionCeremonyModal: React.FC<AscensionCeremonyModalProps> = ({
  isOpen,
  habit,
  level,
  onClose,
}) => {
  const meta = getLevelMeta(level);
  const [scope, animate] = useAnimate();

  const habitColor = habit?.color || meta.gradient.includes('emerald') ? '#10b981' : '#06b6d4';

  const triggerRadialConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 85,
        spread: 120,
        origin: { x: 0.5, y: 0.5 },
        colors: [habitColor, '#10b981', '#06b6d4', '#eab308', '#f43f5e', '#d946ef', '#ffffff'],
        disableForReducedMotion: true,
      });
    } catch {
      // Fallback
    }
  }, [habitColor]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const runSequence = async () => {
      try {
        playRocketWhoosh();

        // 1. Initial State: Balloon manifest
        await animate('#balloon-container', { scale: [0.85, 1], opacity: [0, 1] }, { duration: 0.25 });
        if (!isMounted) return;

        // 2. Rocket Flight: Direct swift flight arc (0.55s) with linear/easeIn collision
        await animate(
          '#rocket',
          {
            x: [-120, -50, 0],
            y: [180, 65, 0],
            rotate: [10, 24, 38],
            scale: [0.85, 1.05, 1.18],
          },
          {
            duration: 0.55,
            ease: 'easeIn',
          }
        );
        if (!isMounted) return;

        // 3. INSTANT POP (Zero delay, no React state reflow):
        animate('#balloon', { scale: [1, 1.35, 0], opacity: [1, 1, 0] }, { duration: 0.08 });
        playBalloonPopFanfare();
        triggerRadialConfetti();

        // 4. Shards explode radially in 360 degrees
        if (scope.current) {
          const shardEls = scope.current.querySelectorAll('.shard');
          shardEls.forEach((el: Element, i: number) => {
            const angle = (i / shardEls.length) * 360;
            const rad = (angle * Math.PI) / 180;
            const dist = 140 + (i % 3) * 35;
            animate(
              el,
              {
                x: [0, Math.cos(rad) * dist],
                y: [0, Math.sin(rad) * dist],
                scale: [1, 1.2, 0],
                opacity: [1, 0.9, 0],
                rotate: [0, i % 2 === 0 ? 360 : -360],
              },
              { duration: 0.55, ease: 'easeOut' }
            );
          });
        }

        // 5. Revealed Card springs up from the explosion center
        animate(
          '#celebration-card',
          {
            scale: [0.3, 1.05, 1],
            opacity: [0, 1],
          },
          { duration: 0.35, ease: 'backOut' }
        );

        // 6. Rocket docks smoothly at the top of the card
        animate(
          '#rocket',
          {
            x: 0,
            y: -140,
            rotate: 10,
            scale: 0.88,
          },
          { duration: 0.3, ease: 'easeOut' }
        );

        // 7. UNLOCKED stamp slams down with spring authority
        await animate(
          '#unlocked-stamp',
          {
            scale: [2.5, 0.9, 1],
            opacity: [0, 1],
            rotate: [-20, -6],
          },
          { duration: 0.22, ease: 'backOut' }
        );
      } catch {
        // Animation completed or unmounted
      }
    };

    runSequence();

    return () => {
      isMounted = false;
    };
  }, [isOpen, level]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={scope}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md overflow-hidden select-none"
        >
          {/* Backdrop Dismiss */}
          <div onClick={onClose} className="fixed inset-0" />

          {/* 1. BALLOON STAGE & SHARDS (Pre-rendered in DOM) */}
          <div id="balloon-container" className="relative flex items-center justify-center pointer-events-none opacity-0">
            <div id="balloon">
              <GlossyBalloon level={level} balloonColor={habitColor} isPopping={false} />
            </div>

            {/* Shard particles pre-rendered, hidden until instant burst */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              {Array.from({ length: 16 }).map((_, i) => (
                <span
                  key={i}
                  className="shard absolute w-3.5 h-3.5 rounded-sm opacity-0 pointer-events-none"
                  style={{
                    backgroundColor: BALLOON_COLORS[i % BALLOON_COLORS.length],
                    clipPath: 'polygon(0% 0%, 100% 20%, 80% 100%, 20% 80%)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* 2. ROCKET (Pre-rendered in DOM, driven by useAnimate) */}
          <div id="rocket" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
            <CuteRocket habit={habit} habitColor={habitColor} isFlying={true} showNameTag={false} isParked={false} />
          </div>

          {/* 3. REVEALED CELEBRATION CARD (Pre-rendered in DOM, emerges on pop) */}
          <div
            id="celebration-card"
            className="absolute z-10 w-full max-w-sm bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 text-center flex flex-col items-center justify-center gap-4 opacity-0 overflow-hidden"
          >
            {/* Atmospheric Ambient Glow */}
            <div
              className="absolute -top-16 inset-x-0 h-32 rounded-full blur-3xl opacity-25 pointer-events-none mx-auto w-3/4"
              style={{ backgroundColor: habitColor }}
            />

            {/* Top Space for Docked Rocket */}
            <div className="h-10 w-full" />

            {/* Habit Identity: [Icon] Habit Name */}
            <div className="relative z-10 flex items-center justify-center gap-2.5">
              <div
                className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800 border shadow-sm flex items-center justify-center"
                style={{ borderColor: `${habitColor}50` }}
              >
                <DynamicIcon
                  name={habit?.icon || 'Flame'}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  size={22}
                  style={{ color: habitColor }}
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                {habit?.name || 'Habit'}
              </h1>
            </div>

            {/* Ascension Badge Row: Level X • Title + Slamming UNLOCKED Stamp */}
            <div className="relative z-10 flex items-center justify-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
                Level {meta.level} • {meta.title}
              </h2>

              <span
                id="unlocked-stamp"
                className="opacity-0 bg-rose-500 text-white font-black text-[10.5px] sm:text-[11px] tracking-wider px-2.5 py-0.5 rounded-md uppercase shadow-md shadow-rose-500/30 border border-white/40 select-none inline-block"
              >
                UNLOCKED
              </span>
            </div>

            {/* Primary Action CTA Button */}
            <div className="relative z-10 w-full mt-2">
              <button
                onClick={onClose}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white font-black text-base tracking-wide shadow-lg shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Continue Journey</span>
                <span>→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

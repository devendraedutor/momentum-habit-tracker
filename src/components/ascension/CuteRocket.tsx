import React from 'react';
import { motion } from 'framer-motion';
import { DynamicIcon } from '../DynamicIcon';
import type { Habit } from '../../types/habit';

interface CuteRocketProps {
  habit: Habit | null;
  habitColor: string;
  isFlying?: boolean;
  showNameTag?: boolean;
  isParked?: boolean;
}

export const CuteRocket: React.FC<CuteRocketProps> = ({
  habit,
  habitColor,
  isFlying = false,
  showNameTag = true,
  isParked = false,
}) => {
  return (
    <div className="relative flex flex-col items-center select-none">
      {/* Rocket Main Hull */}
      <div className={`relative ${isParked ? 'w-16 h-24' : 'w-20 h-30'} flex flex-col items-center transition-all duration-300`}>
        <svg
          viewBox="0 0 70 105"
          className="w-full h-full drop-shadow-xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Side Left Fin */}
          <path
            d="M 17 64 C 6 70 4 87 4 92 C 13 92 19 83 22 77 Z"
            fill={habitColor}
            className="filter drop-shadow-sm"
          />
          {/* Side Right Fin */}
          <path
            d="M 53 64 C 64 70 66 87 66 92 C 57 92 51 83 48 77 Z"
            fill={habitColor}
            className="filter drop-shadow-sm"
          />

          {/* White Main Fuselage */}
          <path
            d="M 35 6 C 20 22 17 56 17 84 C 17 88 53 88 53 84 C 53 56 50 22 35 6 Z"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Nose Cone */}
          <path
            d="M 35 6 C 26 18 23 28 23 36 C 30 38 40 38 47 36 C 47 28 44 18 35 6 Z"
            fill={habitColor}
          />

          {/* Rocket Engine Nozzle at Bottom */}
          <path
            d="M 26 84 L 24 92 L 46 92 L 44 84 Z"
            fill="#475569"
          />

          {/* Porthole Outer Metallic Ring */}
          <circle cx="35" cy="48" r="14" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
          <circle cx="35" cy="48" r="11.5" fill="#0f172a" />
        </svg>

        {/* Embedded Icon inside Porthole */}
        <div className={`absolute ${isParked ? 'top-[29px]' : 'top-[36px]'} left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center pointer-events-none text-white transition-all`}>
          <DynamicIcon
            name={habit?.icon || 'Flame'}
            className={`${isParked ? 'w-4 h-4' : 'w-4.5 h-4.5'} text-white drop-shadow`}
            size={isParked ? 16 : 18}
          />
        </div>

        {/* Large Prominent Habit Name Tag Badge on Rocket Fuselage (during launch only) */}
        {showNameTag && !isParked && (
          <div
            className="absolute bottom-5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900/90 border border-white/60 shadow-md max-w-[70px] truncate pointer-events-none"
            style={{ borderColor: `${habitColor}90` }}
          >
            <span className="text-[9.5px] sm:text-[10.5px] font-black tracking-wide text-white uppercase block truncate text-center">
              {habit?.name || 'Habit'}
            </span>
          </div>
        )}
      </div>

      {/* Animated Thruster Flame & Smoke Exhaust */}
      <div className="relative -mt-2 flex flex-col items-center">
        {/* Flame Core */}
        <motion.div
          animate={{
            scaleY: isFlying ? [1.2, 1.8, 1.3] : isParked ? [0.6, 0.9, 0.6] : [0.9, 1.3, 0.9],
            scaleX: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 0.18,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className={`${isParked ? 'w-3.5 h-4' : 'w-5 h-8'} origin-top rounded-b-full bg-gradient-to-b from-yellow-300 via-orange-500 to-red-500 shadow-[0_0_12px_rgba(249,115,22,0.7)]`}
        />

        {/* Inner White-Hot Flame Core */}
        <motion.div
          animate={{
            scaleY: [1, 1.4, 1],
          }}
          transition={{
            duration: 0.15,
            repeat: Infinity,
          }}
          className={`absolute top-0 ${isParked ? 'w-1.5 h-2' : 'w-2.5 h-4'} origin-top rounded-b-full bg-white blur-[0.5px]`}
        />

        {/* Smoke Rings / Trail Puffs */}
        {isFlying && (
          <div className="absolute top-6 flex flex-col items-center gap-1 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.8, scale: 0.4, y: 0 }}
                animate={{ opacity: 0, scale: 1.6, y: 25 }}
                transition={{
                  duration: 0.45,
                  delay: i * 0.12,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="w-3.5 h-3.5 rounded-full bg-slate-300/60 dark:bg-slate-700/60 blur-[1px]"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { motion } from 'framer-motion';
import { Crown } from 'lucide-react';

interface GlossyBalloonProps {
  level: number;
  balloonColor: string;
  isPopping?: boolean;
}

const BALLOON_THEMES: Record<number, { primary: string; secondary: string; shadow: string }> = {
  1: { primary: '#10b981', secondary: '#059669', shadow: 'rgba(16, 185, 129, 0.4)' },
  2: { primary: '#06b6d4', secondary: '#0284c7', shadow: 'rgba(6, 182, 212, 0.4)' },
  3: { primary: '#6366f1', secondary: '#4f46e5', shadow: 'rgba(99, 102, 241, 0.4)' },
  4: { primary: '#f59e0b', secondary: '#d97706', shadow: 'rgba(245, 158, 11, 0.4)' },
  5: { primary: '#d946ef', secondary: '#c026d3', shadow: 'rgba(217, 70, 239, 0.4)' },
  6: { primary: '#f43f5e', secondary: '#e11d48', shadow: 'rgba(244, 63, 94, 0.4)' },
  7: { primary: '#eab308', secondary: '#ca8a04', shadow: 'rgba(234, 179, 8, 0.5)' },
};

export const GlossyBalloon: React.FC<GlossyBalloonProps> = ({
  level,
  isPopping = false,
}) => {
  const theme = BALLOON_THEMES[level] || BALLOON_THEMES[1];
  const gradId = `balloon-grad-${level}`;
  const specId = `balloon-spec-${level}`;

  return (
    <motion.div
      animate={
        isPopping
          ? { scale: [1, 1.35], opacity: [1, 0] }
          : { y: [-6, 6, -6] }
      }
      transition={
        isPopping
          ? { duration: 0.12, ease: 'easeOut' }
          : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
      }
      className="relative flex flex-col items-center select-none"
    >
      {/* 3D Glossy Plump Balloon SVG */}
      <div className="relative w-36 h-44 sm:w-40 sm:h-48">
        <svg
          viewBox="0 0 160 200"
          className="w-full h-full drop-shadow-2xl"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Radial Plump Surface Gradient */}
            <radialGradient
              id={gradId}
              cx="35%"
              cy="30%"
              r="65%"
              fx="35%"
              fy="30%"
            >
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="25%" stopColor={theme.primary} />
              <stop offset="100%" stopColor={theme.secondary} />
            </radialGradient>

            {/* Specular Highlight Gradient */}
            <linearGradient id={specId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Drop Shadow */}
            <filter id="balloonShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor={theme.shadow} />
            </filter>
          </defs>

          {/* Plump Balloon Main Body */}
          <path
            d="M 80 16 C 36 16 14 54 14 100 C 14 142 54 168 74 175 L 86 175 C 106 168 146 142 146 100 C 146 54 124 16 80 16 Z"
            fill={`url(#${gradId})`}
            filter="url(#balloonShadow)"
          />

          {/* High-Specular Pill Highlight Top-Left */}
          <ellipse
            cx="48"
            cy="52"
            rx="18"
            ry="28"
            transform="rotate(-28 48 52)"
            fill={`url(#${specId})`}
          />

          {/* Secondary Sub-Gloss Reflection Bottom-Right */}
          <path
            d="M 115 110 C 125 90 128 70 125 55 C 123 68 120 85 110 100 Z"
            fill="#ffffff"
            opacity="0.25"
          />

          {/* Balloon Knot Bottom Triangle */}
          <path
            d="M 74 175 L 86 175 L 88 183 L 72 183 Z"
            fill={theme.secondary}
          />

          {/* Curly Dangling Ribbon */}
          <path
            d="M 80 183 Q 70 190 85 195 T 75 205"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>

        {/* Center Label: Vector Crown + Level X in Title Case */}
        <div className="absolute top-[68px] sm:top-[74px] inset-x-0 flex flex-col items-center justify-center pointer-events-none text-white gap-0.5">
          <Crown className="w-6 h-6 text-amber-300 fill-amber-300 drop-shadow-md" />
          <span className="text-sm sm:text-base font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] font-sans">
            Level {level}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

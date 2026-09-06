import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Habit } from '../../types/habit';
import type { LevelMeta } from '../../config/ascensionMeta';

interface AscensionStairwayProps {
  habit: Habit | null;
  meta: LevelMeta;
  level: number;
  onLeap?: () => void;
  onLand?: () => void;
}

interface StepNode {
  level: number;
  title: string;
  days: number;
  icon: string;
  x: number;
  y: number;
  color: string;
}

const STAIRWAY_STEPS: StepNode[] = [
  { level: 1, title: 'The Spark', days: 3, icon: '🌱', x: 42, y: 155, color: '#10b981' },
  { level: 2, title: 'Momentum', days: 7, icon: '⚡', x: 84, y: 133, color: '#06b6d4' },
  { level: 3, title: 'Ironclad', days: 14, icon: '🛡️', x: 126, y: 111, color: '#6366f1' },
  { level: 4, title: 'Crucible', days: 30, icon: '🔥', x: 168, y: 89, color: '#f59e0b' },
  { level: 5, title: 'Resilient', days: 60, icon: '💎', x: 210, y: 67, color: '#d946ef' },
  { level: 6, title: 'Grandmaster', days: 120, icon: '👑', x: 252, y: 46, color: '#f43f5e' },
  { level: 7, title: 'Eternal', days: 365, icon: '⚡', x: 292, y: 26, color: '#eab308' },
];

export const AscensionStairway: React.FC<AscensionStairwayProps> = ({
  habit,
  meta,
  level,
  onLeap,
  onLand,
}) => {
  const [phase, setPhase] = useState<'manifest' | 'emerge' | 'leap' | 'landed'>('manifest');
  const [hasLanded, setHasLanded] = useState(false);
  const [shake, setShake] = useState(false);

  const habitColor = habit?.color || meta.gradient.includes('emerald') ? '#10b981' : '#06b6d4';

  // Target and start coordinates
  const targetStep = useMemo(() => {
    return STAIRWAY_STEPS.find((s) => s.level === level) || STAIRWAY_STEPS[0];
  }, [level]);

  const startStep = useMemo(() => {
    if (level <= 1) {
      return { x: 14, y: 172, level: 0 };
    }
    const prev = STAIRWAY_STEPS.find((s) => s.level === level - 1);
    return prev ? { x: prev.x, y: prev.y, level: prev.level } : { x: 14, y: 172, level: 0 };
  }, [level]);

  // Synchronized 4-second animation timeline
  useEffect(() => {
    // 0.0s: Manifest staircase
    setPhase('manifest');

    // 0.8s: Habit totem emerges & hovers
    const tEmerge = setTimeout(() => {
      setPhase('emerge');
    }, 800);

    // 1.8s: The Leap begins
    const tLeap = setTimeout(() => {
      setPhase('leap');
      if (onLeap) onLeap();
    }, 1800);

    // 2.8s: Stomp Impact Landing & Mindset Unlock
    const tLand = setTimeout(() => {
      setPhase('landed');
      setHasLanded(true);
      setShake(true);
      if (onLand) onLand();
      setTimeout(() => setShake(false), 200);
    }, 2800);

    return () => {
      clearTimeout(tEmerge);
      clearTimeout(tLeap);
      clearTimeout(tLand);
    };
  }, [level, onLeap, onLand]);

  // Mid-air apex for the jump arc
  const midAirX = (startStep.x + targetStep.x) / 2;
  const midAirY = Math.min(startStep.y, targetStep.y) - 62;

  return (
    <div className={`relative w-full max-w-[340px] mx-auto select-none ${shake ? 'animate-bounce' : ''}`}>
      {/* 2.5D Isometric Staircase Stage */}
      <div className="relative w-full h-[190px] rounded-3xl bg-gradient-to-b from-slate-50 to-slate-100/90 dark:from-slate-900/90 dark:to-slate-950 border border-slate-200/70 dark:border-slate-800/80 shadow-inner overflow-hidden p-2">
        {/* Ambient Grid / Speed Lines */}
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.08] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:12px_12px]" />

        {/* Dynamic Trail Lighting behind current leap */}
        {phase === 'leap' && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: [0, 0.8, 0], scaleX: [0.5, 1.2, 0.8] }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="absolute h-1 rounded-full blur-sm pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, ${habitColor}, transparent)`,
              left: `${startStep.x}px`,
              top: `${(startStep.y + targetStep.y) / 2}px`,
              width: `${Math.abs(targetStep.x - startStep.x) + 40}px`,
              transform: 'rotate(-25deg)',
            }}
          />
        )}

        {/* SVG Isometric Stairway Rail & Connecting Energy Beams */}
        <svg
          viewBox="0 0 330 190"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="stairBeamGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#eab308" stopOpacity="0.9" />
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Under-Rail Foundation Line */}
          <path
            d="M 14 176 L 42 155 L 84 133 L 126 111 L 168 89 L 210 67 L 252 46 L 292 26"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeDasharray="4 4"
            className="text-slate-200 dark:text-slate-800"
          />

          {/* Illuminated Energy Track up to Current Level */}
          <motion.path
            d={(() => {
              const activeNodes = STAIRWAY_STEPS.filter((s) => s.level <= level);
              if (activeNodes.length === 0) return 'M 14 176 L 42 155';
              let pathStr = 'M 14 176';
              activeNodes.forEach((node) => {
                pathStr += ` L ${node.x} ${node.y}`;
              });
              return pathStr;
            })()}
            fill="none"
            stroke="url(#stairBeamGrad)"
            strokeWidth="3.5"
            strokeLinecap="round"
            filter="url(#glowFilter)"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: 'easeInOut' }}
          />

          {/* Isometric 3D Step Blocks */}
          {STAIRWAY_STEPS.map((step) => {
            const isTarget = step.level === level;
            const isCompleted = step.level < level;
            const isLocked = step.level > level;

            const pw = 30; // plinth width
            const ph = 14; // plinth height
            const depth = 8; // 3D extrusion depth

            const cx = step.x;
            const cy = step.y;

            return (
              <g key={step.level}>
                {/* 3D Plinth Extrusion Front/Sides */}
                <polygon
                  points={`
                    ${cx - pw / 2},${cy}
                    ${cx},${cy + ph / 2}
                    ${cx + pw / 2},${cy}
                    ${cx + pw / 2},${cy + depth}
                    ${cx},${cy + ph / 2 + depth}
                    ${cx - pw / 2},${cy + depth}
                  `}
                  fill={
                    isTarget
                      ? step.color
                      : isCompleted
                      ? '#64748b'
                      : '#334155'
                  }
                  opacity={isLocked ? 0.3 : isTarget ? 0.95 : 0.6}
                />

                {/* 3D Plinth Top Surface Diamond */}
                <polygon
                  points={`
                    ${cx},${cy - ph / 2}
                    ${cx + pw / 2},${cy}
                    ${cx},${cy + ph / 2}
                    ${cx - pw / 2},${cy}
                  `}
                  fill={
                    isTarget
                      ? '#ffffff'
                      : isCompleted
                      ? '#cbd5e1'
                      : '#1e293b'
                  }
                  className={isTarget ? 'dark:fill-slate-100' : isCompleted ? 'dark:fill-slate-700' : 'dark:fill-slate-800'}
                  stroke={isTarget ? step.color : isCompleted ? '#94a3b8' : '#475569'}
                  strokeWidth={isTarget ? '2' : '1'}
                />

                {/* Target Step Pulsing Aura Rings */}
                {isTarget && (
                  <>
                    <motion.ellipse
                      cx={cx}
                      cy={cy}
                      rx={pw * 0.7}
                      ry={ph * 0.7}
                      fill="none"
                      stroke={step.color}
                      strokeWidth="2"
                      initial={{ scale: 0.8, opacity: 0.9 }}
                      animate={{ scale: [0.8, 1.4, 0.8], opacity: [0.9, 0.2, 0.9] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                    {hasLanded && (
                      <motion.ellipse
                        cx={cx}
                        cy={cy}
                        rx={pw * 1.6}
                        ry={ph * 1.6}
                        fill="none"
                        stroke={step.color}
                        strokeWidth="2.5"
                        initial={{ scale: 0.2, opacity: 1 }}
                        animate={{ scale: 2.2, opacity: 0 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    )}
                  </>
                )}

                {/* Level Node Badge text/emoji */}
                <text
                  x={cx}
                  y={cy + 3}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="900"
                  className="pointer-events-none select-none"
                >
                  {isLocked ? '🔒' : step.icon}
                </text>

                {/* Step Sub-label (Days) */}
                <text
                  x={cx}
                  y={cy + ph + depth + 4}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="800"
                  fill={isTarget ? step.color : isCompleted ? '#64748b' : '#94a3b8'}
                  className="select-none tracking-tight font-sans"
                >
                  {step.days}d
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Habit Bearer Totem (Leaps from startStep to targetStep) */}
        <motion.div
          className="absolute z-20 pointer-events-none flex flex-col items-center"
          initial={{
            x: startStep.x - 22,
            y: startStep.y - 36,
            scale: 0.7,
            opacity: 0,
          }}
          animate={(() => {
            if (phase === 'manifest') {
              return {
                x: startStep.x - 22,
                y: startStep.y - 36,
                scale: 0.7,
                opacity: 0,
              };
            }
            if (phase === 'emerge') {
              return {
                x: startStep.x - 22,
                y: startStep.y - 48,
                scale: [0.8, 1.15, 1.0],
                opacity: 1,
                transition: { duration: 0.6, ease: 'easeOut' },
              };
            }
            if (phase === 'leap') {
              return {
                x: [startStep.x - 22, midAirX - 22, targetStep.x - 22],
                y: [startStep.y - 48, midAirY - 48, targetStep.y - 44],
                scale: [1.0, 1.35, 1.1],
                rotate: [0, 14, 0],
                opacity: 1,
                transition: {
                  duration: 0.95,
                  times: [0, 0.45, 1],
                  ease: [0.25, 0.1, 0.25, 1.0],
                },
              };
            }
            // phase === 'landed'
            return {
              x: targetStep.x - 22,
              y: targetStep.y - 44,
              scale: [1.15, 0.92, 1.0],
              opacity: 1,
              transition: { duration: 0.4, ease: 'backOut' },
            };
          })()}
        >
          {/* Glowing Aura halo around habit totem */}
          <div
            className="absolute inset-0 rounded-full blur-md opacity-70 animate-pulse pointer-events-none"
            style={{ backgroundColor: habitColor }}
          />

          {/* Hero Habit Totem Plaque */}
          <div
            className="relative px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border-2 shadow-xl flex items-center gap-1.5"
            style={{
              borderColor: habitColor,
              boxShadow: `0 8px 24px ${habitColor}40`,
            }}
          >
            <span className="text-base leading-none">{habit?.icon || '⭐'}</span>
            <span className="text-[10px] font-black tracking-tight text-slate-900 dark:text-white uppercase max-w-[65px] truncate">
              {habit?.name || 'Habit'}
            </span>
          </div>

          {/* Ground Beacon / Pointing Down-Triangle */}
          <div
            className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] -mt-0.5"
            style={{ borderTopColor: habitColor }}
          />
        </motion.div>

        {/* Floating Sparkle Particles during Emerge and Landed */}
        {phase === 'emerge' && (
          <div className="absolute inset-0 pointer-events-none">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{
                  x: startStep.x + (i - 1) * 12,
                  y: startStep.y - 30,
                  opacity: 0.9,
                  scale: 0.5,
                }}
                animate={{
                  y: startStep.y - 70,
                  opacity: 0,
                  scale: 1.2,
                }}
                transition={{
                  duration: 0.8,
                  delay: i * 0.15,
                  repeat: Infinity,
                  ease: 'easeOut',
                }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: habitColor }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

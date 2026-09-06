import confetti from 'canvas-confetti';
import type { Habit } from '../types/habit';

export type HabitCategory = 'movement' | 'focus' | 'break';

/**
 * Detects habit category based on type, name, category, or icon.
 */
export function getHabitCategory(habit: Habit | null): HabitCategory {
  if (!habit) return 'focus';
  if (habit.type === 'BREAK') return 'break';

  const name = (habit.name || '').toLowerCase();
  const icon = (habit.icon || '').toLowerCase();
  const cat = (habit.category || '').toLowerCase();

  // Break / Defense habits
  if (
    name.includes('quit') ||
    name.includes('stop') ||
    name.includes('no ') ||
    name.includes('sugar') ||
    name.includes('smoking') ||
    name.includes('porn') ||
    name.includes('screen') ||
    name.includes('late night') ||
    icon.includes('shield') ||
    icon.includes('ban')
  ) {
    return 'break';
  }

  // Movement / Fitness / Energy habits
  if (
    name.includes('walk') ||
    name.includes('run') ||
    name.includes('gym') ||
    name.includes('workout') ||
    name.includes('exercise') ||
    name.includes('cardio') ||
    name.includes('yoga') ||
    name.includes('steps') ||
    name.includes('bike') ||
    name.includes('swim') ||
    icon.includes('dumbbell') ||
    icon.includes('activity') ||
    icon.includes('bike') ||
    icon.includes('heart') ||
    icon.includes('footprints') ||
    icon.includes('flame') ||
    cat.includes('fitness') ||
    cat.includes('health')
  ) {
    return 'movement';
  }

  // Focus / Mind / Study habits
  return 'focus';
}

/**
 * Procedural Web Audio Engine with tailored sound profiles per habit archetype.
 */
export function playHabitChime(category: HabitCategory): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (category === 'movement') {
      // Fast ascending two-tone whoosh with athletic kick (sine wave rising from 280Hz to 660Hz with lowpass filter punch)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.35);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.exponentialRampToValueAtTime(3200, now + 0.18);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.35, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.48);

      // Trailing bright bell chord
      [660, 880, 1100].forEach((freq, idx) => {
        const bellOsc = ctx.createOscillator();
        const bellGain = ctx.createGain();
        const start = now + 0.15 + idx * 0.05;

        bellOsc.type = 'triangle';
        bellOsc.frequency.setValueAtTime(freq, start);

        bellGain.gain.setValueAtTime(0.0001, start);
        bellGain.gain.exponentialRampToValueAtTime(0.2, start + 0.02);
        bellGain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);

        bellOsc.connect(bellGain);
        bellGain.connect(ctx.destination);
        bellOsc.start(start);
        bellOsc.stop(start + 0.55);
      });
    } else if (category === 'focus') {
      // High-harmonic glass wind-chime / temple bell arpeggio (harmonic frequencies at 880Hz, 1320Hz, 1760Hz fading out over 1.2s)
      const frequencies = [880, 1320, 1760, 2200];
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = now + i * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(0.25 / (i + 1), startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 1.2);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 1.25);
      });
    } else {
      // Break habit: Heavy bass sub-thud (55Hz drop) followed by a crystalline metallic snap
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();

      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(110, now);
      subOsc.frequency.exponentialRampToValueAtTime(55, now + 0.15);
      subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

      subGain.gain.setValueAtTime(0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.4);

      // Crystalline metallic snap & triumphant chord
      const snapFreqs = [523.25, 659.25, 783.99, 1046.5]; // C5 Major
      snapFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const snapStart = now + 0.1 + i * 0.03;

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq * 1.5, snapStart);
        osc.frequency.exponentialRampToValueAtTime(freq, snapStart + 0.05);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2400, snapStart);
        filter.frequency.exponentialRampToValueAtTime(800, snapStart + 0.6);

        gain.gain.setValueAtTime(0.0001, snapStart);
        gain.gain.exponentialRampToValueAtTime(0.18, snapStart + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, snapStart + 0.8);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        osc.start(snapStart);
        osc.stop(snapStart + 0.85);
      });
    }
  } catch (err) {
    console.warn('Procedural Web Audio failed:', err);
  }
}

/**
 * Triggers tailored celebration particle effects based on habit category.
 */
export function triggerHabitParticlePreset(category: HabitCategory, habitColor: string): void {
  try {
    if (category === 'movement') {
      // Horizontal kinetic wind streaks and trail lines
      confetti({
        particleCount: 65,
        angle: 35,
        spread: 55,
        origin: { x: 0.1, y: 0.6 },
        colors: [habitColor, '#38bdf8', '#06b6d4', '#ffffff'],
        drift: 1,
      });
      confetti({
        particleCount: 65,
        angle: 145,
        spread: 55,
        origin: { x: 0.9, y: 0.6 },
        colors: [habitColor, '#38bdf8', '#06b6d4', '#ffffff'],
        drift: -1,
      });
    } else if (category === 'focus') {
      // Golden ambient dust & sparkles floating gently downward
      confetti({
        particleCount: 85,
        spread: 80,
        gravity: 0.6,
        ticks: 280,
        origin: { y: 0.35 },
        colors: [habitColor, '#fbbf24', '#f59e0b', '#fef08a', '#c084fc'],
      });
    } else {
      // Break: Shards of breaking chain/lock bursting radially outward from center icon
      confetti({
        particleCount: 120,
        spread: 360,
        startVelocity: 35,
        origin: { y: 0.45 },
        colors: [habitColor, '#f43f5e', '#ef4444', '#a855f7', '#ffffff'],
      });
    }
  } catch (err) {
    console.warn('Particle trigger failed:', err);
  }
}

/**
 * Dynamic Framer Motion entrance physics per habit archetype.
 */
export const HABIT_ENTRANCE_PHYSICS = {
  movement: {
    initial: { x: -120, scale: 0.7, opacity: 0 },
    animate: { x: [-120, 15, 0], scale: [0.7, 1.08, 1.0], opacity: 1 },
    transition: { type: 'spring' as const, stiffness: 360, damping: 20 },
  },
  focus: {
    initial: { rotateX: 70, y: -25, opacity: 0 },
    animate: { rotateX: [70, -5, 0], y: 0, opacity: 1 },
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const },
  },
  break: {
    initial: { y: -150, scale: 1.3, opacity: 0 },
    animate: { y: [-150, 10, 0], scale: [1.3, 0.95, 1.0], opacity: 1 },
    transition: { type: 'spring' as const, stiffness: 450, damping: 18 },
  },
};

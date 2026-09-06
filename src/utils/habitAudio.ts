import type { Habit } from '../types/habit';

export type HabitArchetype = 'movement' | 'focus' | 'break';

/**
 * Resolves a habit's DNA archetype based on type, name, category, or icon.
 */
export function getHabitArchetype(habit: Habit | null): HabitArchetype {
  if (!habit) return 'focus';
  if (habit.type === 'BREAK') return 'break';

  const name = (habit.name || '').toLowerCase();
  const icon = (habit.icon || '').toLowerCase();
  const category = (habit.category || '').toLowerCase();

  // Break / Abstinence habits
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
    name.includes('stretch') ||
    name.includes('steps') ||
    name.includes('bike') ||
    name.includes('swim') ||
    icon.includes('dumbbell') ||
    icon.includes('activity') ||
    icon.includes('bike') ||
    icon.includes('heart') ||
    icon.includes('footprints') ||
    icon.includes('flame') ||
    category.includes('fitness') ||
    category.includes('health')
  ) {
    return 'movement';
  }

  // Default Focus / Mind / Learning habits
  return 'focus';
}

/**
 * 1. Movement / Fitness: High-tempo double whoosh followed by energizing ascending synth glissando
 */
export function playKineticChime(baseFreq: number = 523.25): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Fast whoosh noise burst
    const bufferSize = ctx.sampleRate * 0.15;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(3200, now + 0.12);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);

    // Ascending kinetic synth arpeggio
    const freqs = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 1.875, baseFreq * 2.25];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const noteStart = now + 0.08 + idx * 0.055;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteStart);

      gain.gain.setValueAtTime(0.0001, noteStart);
      gain.gain.exponentialRampToValueAtTime(0.25, noteStart + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(noteStart);
      osc.stop(noteStart + 0.48);
    });
  } catch (err) {
    console.warn('Web Audio KineticChime failed:', err);
  }
}

/**
 * 2. Focus & Mind: Pure crystal glass bell chime with shimmering high harmonics and sustained fade
 */
export function playZenBell(baseFreq: number = 587.33): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell partials (fundamental + bell overtone ratios)
    const partials = [
      { ratio: 1.0, gain: 0.3, decay: 1.8 },
      { ratio: 2.0, gain: 0.18, decay: 1.4 },
      { ratio: 3.01, gain: 0.12, decay: 1.0 },
      { ratio: 4.17, gain: 0.08, decay: 0.7 },
      { ratio: 5.43, gain: 0.05, decay: 0.5 },
    ];

    partials.forEach(({ ratio, gain: partGain, decay }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq * ratio, now);

      gainNode.gain.setValueAtTime(0.0001, now);
      gainNode.gain.exponentialRampToValueAtTime(partGain, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + decay + 0.05);
    });
  } catch (err) {
    console.warn('Web Audio ZenBell failed:', err);
  }
}

/**
 * 3. Break Habit / Defense: Deep resonant impact hit transitioning into a triumphant major chord
 */
export function playShatterBass(baseFreq: number = 130.81): void {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Deep sub-bass punch
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(baseFreq, now);
    subOsc.frequency.exponentialRampToValueAtTime(45, now + 0.25);

    subGain.gain.setValueAtTime(0.4, now);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);

    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.42);

    // Triumphant resonant brass chord resolving after impact
    const chordFreqs = [261.63, 329.63, 392.00, 523.25]; // C4 Major
    chordFreqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = now + 0.08 + i * 0.04;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, start);
      filter.frequency.exponentialRampToValueAtTime(2400, start + 0.2);
      filter.frequency.exponentialRampToValueAtTime(800, start + 0.9);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 1.0);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 1.05);
    });
  } catch (err) {
    console.warn('Web Audio ShatterBass failed:', err);
  }
}

/**
 * Procedurally dispatches the right audio signature based on habit DNA.
 */
export function playHabitCelebrationAudio(habit: Habit | null, baseFreq: number = 523.25): void {
  const archetype = getHabitArchetype(habit);
  if (archetype === 'movement') {
    playKineticChime(baseFreq);
  } else if (archetype === 'break') {
    playShatterBass(baseFreq * 0.25);
  } else {
    playZenBell(baseFreq);
  }
}

// Synthesized Procedural Audio Engine for Ascension Ceremony using Web Audio API

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
      sharedAudioCtx = new AudioCtxClass();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

/**
 * Triggered at Phase 3 (1.8s) - The Leap
 * Ascending kinetic whoosh with aerodynamic glide
 */
export function playAscensionLeapSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Ascending Oscillator Glide (280Hz -> 640Hz)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(260, now);
  osc.frequency.exponentialRampToValueAtTime(640, now + 0.55);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(400, now);
  filter.frequency.exponentialRampToValueAtTime(2800, now + 0.5);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.12);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.7);

  // 2. Air Friction Whoosh Noise Burst
  try {
    const bufferSize = ctx.sampleRate * 0.4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(500, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(1800, now + 0.35);
    noiseFilter.Q.setValueAtTime(2.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.15);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.5);
  } catch {
    // Noise buffer fallback
  }
}

/**
 * Triggered at Phase 4 (2.8s) - Stomp Impact Landing & Mindset Unlock
 * Deep bass impact thump + Shimmering Major Chord Arpeggio that rings out
 */
export function playAscensionLandingSound(baseFrequency: number = 523.25) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Deep Bass Victory Sub-Thump (60Hz -> 32Hz)
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();

  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(75, now);
  subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.28);

  subGain.gain.setValueAtTime(0.35, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

  subOsc.connect(subGain);
  subGain.connect(ctx.destination);

  subOsc.start(now);
  subOsc.stop(now + 0.4);

  // 2. High-impact Metallic Click / Shield Contact
  const snapOsc = ctx.createOscillator();
  const snapGain = ctx.createGain();

  snapOsc.type = 'triangle';
  snapOsc.frequency.setValueAtTime(1100, now);
  snapOsc.frequency.exponentialRampToValueAtTime(380, now + 0.08);

  snapGain.gain.setValueAtTime(0.2, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

  snapOsc.connect(snapGain);
  snapGain.connect(ctx.destination);

  snapOsc.start(now);
  snapOsc.stop(now + 0.1);

  // 3. Shimmering Major Victory Arpeggio (Root, 3rd, 5th, Octave, 10th)
  // Ratios: 1.0 (Root), 1.25 (Major 3rd), 1.5 (Perfect 5th), 2.0 (Octave), 2.5 (High 3rd)
  const chordRatios = [1.0, 1.25, 1.5, 2.0, 2.5];
  const staggerDelays = [0.03, 0.08, 0.14, 0.21, 0.29];

  chordRatios.forEach((ratio, index) => {
    const noteTime = now + staggerDelays[index];
    const freq = baseFrequency * ratio;

    const bellOsc = ctx.createOscillator();
    const bellGain = ctx.createGain();

    bellOsc.type = index % 2 === 0 ? 'sine' : 'triangle';
    bellOsc.frequency.setValueAtTime(freq, noteTime);

    // Warm decay envelope
    bellGain.gain.setValueAtTime(0.0001, noteTime);
    bellGain.gain.linearRampToValueAtTime(0.12 / (1 + index * 0.2), noteTime + 0.02);
    bellGain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.2);

    bellOsc.connect(bellGain);
    bellGain.connect(ctx.destination);

    bellOsc.start(noteTime);
    bellOsc.stop(noteTime + 1.3);
  });
}

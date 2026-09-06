// Procedural Web Audio Engine for Rocket Launch & Balloon Pop Celebration

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
 * Triggered at Step 1/2: Rocket Ignition & Whoosh
 * Rising pitch oscillator (150Hz to 480Hz) + thruster rumble filter
 */
export function playRocketWhoosh() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Engine Pitch Glide (150Hz -> 480Hz)
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(460, now + 0.85);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(300, now);
  filter.frequency.exponentialRampToValueAtTime(1800, now + 0.75);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.15, now + 0.15);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + 0.95);

  // 2. Thruster White Noise Rumble
  try {
    const bufferSize = ctx.sampleRate * 0.8;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(250, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(800, now + 0.7);
    noiseFilter.Q.setValueAtTime(1.5, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.08, now + 0.1);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    noise.start(now);
    noise.stop(now + 0.85);
  } catch {
    // Fallback
  }
}

/**
 * Triggered at Step 3 (1.8s): Balloon POP! + Bright Major Fanfare
 * Crisp pop noise burst + Resonant rubber snap + Uplifting brass chord (C5, E5, G5, C6)
 */
export function playBalloonPopFanfare() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // 1. Sharp Balloon Pop Noise Burst (10ms transient)
  try {
    const popBufferSize = Math.floor(ctx.sampleRate * 0.04);
    const popBuffer = ctx.createBuffer(1, popBufferSize, ctx.sampleRate);
    const popOutput = popBuffer.getChannelData(0);
    for (let i = 0; i < popBufferSize; i++) {
      popOutput[i] = (Math.random() * 2 - 1) * Math.exp(-i / (popBufferSize * 0.2));
    }

    const popSource = ctx.createBufferSource();
    popSource.buffer = popBuffer;

    const popFilter = ctx.createBiquadFilter();
    popFilter.type = 'highpass';
    popFilter.frequency.setValueAtTime(800, now);

    const popGain = ctx.createGain();
    popGain.gain.setValueAtTime(0.4, now);
    popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    popSource.connect(popFilter);
    popFilter.connect(popGain);
    popGain.connect(ctx.destination);

    popSource.start(now);
    popSource.stop(now + 0.06);
  } catch {
    // Fallback
  }

  // 2. Resonant Rubber Snap Impact (Low sub thump)
  const snapOsc = ctx.createOscillator();
  const snapGain = ctx.createGain();

  snapOsc.type = 'triangle';
  snapOsc.frequency.setValueAtTime(320, now);
  snapOsc.frequency.exponentialRampToValueAtTime(45, now + 0.12);

  snapGain.gain.setValueAtTime(0.3, now);
  snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

  snapOsc.connect(snapGain);
  snapGain.connect(ctx.destination);

  snapOsc.start(now);
  snapOsc.stop(now + 0.16);

  // 3. Uplifting Bright Major Brass Fanfare (C5, E5, G5, C6)
  const notes = [523.25, 659.25, 783.99, 1046.5];
  const delays = [0.03, 0.07, 0.12, 0.18];

  notes.forEach((freq, idx) => {
    const noteTime = now + delays[idx];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);

    gain.gain.setValueAtTime(0.0001, noteTime);
    gain.gain.linearRampToValueAtTime(0.14 / (1 + idx * 0.15), noteTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 1.2);
  });
}

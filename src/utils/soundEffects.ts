export const playAscensionChime = (baseFreq: number = 523.25) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const chord = [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2];

    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);

      gain.gain.setValueAtTime(0.001, ctx.currentTime + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.07 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.07 + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.07);
      osc.stop(ctx.currentTime + i * 0.07 + 0.55);
    });
  } catch (err) {
    console.warn("Web Audio not available", err);
  }
};

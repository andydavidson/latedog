let _ctx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume();
  return _ctx;
}

function singleBark(ctx: AudioContext, startAt: number) {
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.type = 'sawtooth';
  osc1.frequency.setValueAtTime(260, startAt);
  osc1.frequency.exponentialRampToValueAtTime(85, startAt + 0.14);

  osc2.type = 'square';
  osc2.frequency.setValueAtTime(200, startAt);
  osc2.frequency.exponentialRampToValueAtTime(70, startAt + 0.14);

  filter.type = 'lowpass';
  filter.frequency.value = 900;
  filter.Q.value = 2;

  gain.gain.setValueAtTime(0.0, startAt);
  gain.gain.linearRampToValueAtTime(0.38, startAt + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.18);

  osc1.start(startAt);
  osc1.stop(startAt + 0.18);
  osc2.start(startAt);
  osc2.stop(startAt + 0.18);
}

export function playBark(count: number = 1): void {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;
    for (let i = 0; i < count; i++) {
      singleBark(ctx, t + i * 0.24);
    }
  } catch (_) {
    // Audio unavailable — silently ignore
  }
}

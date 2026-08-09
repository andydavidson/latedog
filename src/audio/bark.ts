// Dog bark synthesizer using Web Audio API.
//
// A real bark has three layers:
//   1. Tonal body  — sawtooth oscillator with a fast frequency sweep ("WOOF" vowel)
//   2. Chest thump — sine sub-oscillator for low-frequency weight
//   3. Noise burst  — white noise through formant-shaped bandpass filters
//                     to create the rough, airy texture of the initial attack
//
// The noise buffer is generated once and reused (BufferSource nodes are
// single-use but the underlying AudioBuffer can be shared across them).

let _ctx: AudioContext | null = null;
let _noiseBuffer: AudioBuffer | null = null;

function getCtx(): AudioContext {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') void _ctx.resume();
  return _ctx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (_noiseBuffer) return _noiseBuffer;
  const length = Math.ceil(ctx.sampleRate * 0.6);
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  _noiseBuffer = buf;
  return buf;
}

function singleBark(ctx: AudioContext, t: number, pitchMult: number) {
  const base = 230 * pitchMult; // fundamental, ~230 Hz for a medium dog

  // ── 1. Tonal body ────────────────────────────────────────────────────────
  // Sawtooth rich in harmonics, sweeps downward like a real "WOOF".
  const bodyOsc    = ctx.createOscillator();
  const bodyFilter = ctx.createBiquadFilter();
  const bodyGain   = ctx.createGain();

  bodyOsc.type = 'sawtooth';
  // Starts ~2.5x pitch (bright attack), drops to base, then falls further
  bodyOsc.frequency.setValueAtTime(base * 2.5, t);
  bodyOsc.frequency.exponentialRampToValueAtTime(base,        t + 0.035);
  bodyOsc.frequency.exponentialRampToValueAtTime(base * 0.65, t + 0.20);

  // Resonant low-pass shaped to emphasise the 300–600 Hz "oo" vowel region
  bodyFilter.type = 'lowpass';
  bodyFilter.frequency.setValueAtTime(1400, t);
  bodyFilter.frequency.exponentialRampToValueAtTime(360, t + 0.20);
  bodyFilter.Q.value = 5;

  bodyGain.gain.setValueAtTime(0,    t);
  bodyGain.gain.linearRampToValueAtTime(0.50, t + 0.006);
  bodyGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

  bodyOsc.connect(bodyFilter);
  bodyFilter.connect(bodyGain);

  // ── 2. Sub / chest thump ─────────────────────────────────────────────────
  // Pure sine an octave below for the physical weight of the bark.
  const subOsc  = ctx.createOscillator();
  const subGain = ctx.createGain();

  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(base * 0.55, t);
  subOsc.frequency.exponentialRampToValueAtTime(base * 0.28, t + 0.14);

  subGain.gain.setValueAtTime(0,    t);
  subGain.gain.linearRampToValueAtTime(0.40, t + 0.005);
  subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

  subOsc.connect(subGain);

  // ── 3. Noise burst (breath / roughness) ──────────────────────────────────
  // Two bandpass filters at the first two formant frequencies of "oo"
  // give the noise a dog-like timbral quality rather than pure hiss.
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = getNoiseBuffer(ctx);

  const f1 = ctx.createBiquadFilter(); // first formant  ~320 Hz
  f1.type = 'bandpass';
  f1.frequency.value = 320 * pitchMult;
  f1.Q.value = 3.5;

  const f2 = ctx.createBiquadFilter(); // second formant ~860 Hz
  f2.type = 'bandpass';
  f2.frequency.value = 860 * pitchMult;
  f2.Q.value = 2.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0,    t);
  noiseGain.gain.linearRampToValueAtTime(0.45, t + 0.004);
  // Short attack, decays before the tonal tail so the roughness leads
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

  noiseSrc.connect(f1);
  noiseSrc.connect(f2);
  f1.connect(noiseGain);
  f2.connect(noiseGain);

  // ── Master mix ───────────────────────────────────────────────────────────
  // A compressor prevents clipping when multiple barks overlap.
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12;
  comp.knee.value      = 6;
  comp.ratio.value     = 4;
  comp.attack.value    = 0.001;
  comp.release.value   = 0.08;

  const master = ctx.createGain();
  master.gain.value = 0.82;

  bodyGain.connect(comp);
  subGain.connect(comp);
  noiseGain.connect(comp);
  comp.connect(master);
  master.connect(ctx.destination);

  const end = t + 0.28;
  bodyOsc.start(t);   bodyOsc.stop(end);
  subOsc.start(t);    subOsc.stop(end);
  noiseSrc.start(t);  noiseSrc.stop(end);
}

export function playBark(count: number = 1): void {
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;
    for (let i = 0; i < count; i++) {
      // Slight random pitch variation each bark — dogs aren't monotone
      const pitchMult = 0.88 + Math.random() * 0.28;
      singleBark(ctx, t + i * 0.30, pitchMult);
    }
  } catch (_) {
    // Audio unavailable — silently ignore
  }
}

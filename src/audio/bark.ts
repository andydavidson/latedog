// Dog bark synthesizer — Web Audio API
//
// Three layered components:
//   1. Tonal body   — sawtooth oscillator with fast pitch sweep ("WOOF" shape)
//   2. Chest thump  — sub-sine for low-frequency physical weight
//   3. Noise burst  — white noise through formant bandpass filters for texture
//
// AudioContext resume() is async; playBark awaits it before scheduling so
// audio is never silently dropped when the context is suspended.

let _ctx: AudioContext | null = null;
let _noiseBuffer: AudioBuffer | null = null;

// Returns a running AudioContext, properly awaiting resume if suspended.
async function getRunningCtx(): Promise<AudioContext> {
  if (!_ctx) {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    _ctx = new Ctx();
  }
  if (_ctx.state === 'suspended') await _ctx.resume();
  return _ctx;
}

function getNoiseBuffer(ctx: AudioContext): AudioBuffer {
  if (_noiseBuffer) return _noiseBuffer;
  const length = Math.ceil(ctx.sampleRate * 0.6);
  const buf    = ctx.createBuffer(1, length, ctx.sampleRate);
  const data   = buf.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  _noiseBuffer = buf;
  return buf;
}

function singleBark(ctx: AudioContext, t: number, pitchMult: number) {
  const base = 230 * pitchMult; // ~230 Hz fundamental for a medium dog

  // ── 1. Tonal body ────────────────────────────────────────────────────────
  const bodyOsc    = ctx.createOscillator();
  const bodyFilter = ctx.createBiquadFilter();
  const bodyGain   = ctx.createGain();

  bodyOsc.type = 'sawtooth';
  bodyOsc.frequency.setValueAtTime(base * 2.5, t);
  bodyOsc.frequency.exponentialRampToValueAtTime(base,        t + 0.035);
  bodyOsc.frequency.exponentialRampToValueAtTime(base * 0.65, t + 0.20);

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
  const subOsc  = ctx.createOscillator();
  const subGain = ctx.createGain();

  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(base * 0.55, t);
  subOsc.frequency.exponentialRampToValueAtTime(base * 0.28, t + 0.14);

  subGain.gain.setValueAtTime(0,    t);
  subGain.gain.linearRampToValueAtTime(0.40, t + 0.005);
  subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

  subOsc.connect(subGain);

  // ── 3. Noise burst ───────────────────────────────────────────────────────
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = getNoiseBuffer(ctx);

  const f1 = ctx.createBiquadFilter();
  f1.type = 'bandpass';
  f1.frequency.value = 320 * pitchMult;
  f1.Q.value = 3.5;

  const f2 = ctx.createBiquadFilter();
  f2.type = 'bandpass';
  f2.frequency.value = 860 * pitchMult;
  f2.Q.value = 2.5;

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0,    t);
  noiseGain.gain.linearRampToValueAtTime(0.45, t + 0.004);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.11);

  noiseSrc.connect(f1);
  noiseSrc.connect(f2);
  f1.connect(noiseGain);
  f2.connect(noiseGain);

  // ── Master mix with compressor ───────────────────────────────────────────
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

  const end = t + 0.30;
  bodyOsc.start(t);  bodyOsc.stop(end);
  subOsc.start(t);   subOsc.stop(end);
  noiseSrc.start(t); noiseSrc.stop(end);
}

// Call this directly inside a user-gesture handler (button click / tap).
// Safari requires the AudioContext to be created AND resumed within a gesture;
// lazy creation on the first bark (a timer event) won't satisfy it.
export function primeAudio(): void {
  getRunningCtx().catch(err => console.warn('[bark] prime failed:', err));
}

export function playBark(count: number = 1): void {
  getRunningCtx()
    .then(ctx => {
      // Schedule 60 ms in the future to guarantee we're not in the past
      // regardless of how long getRunningCtx took to resolve.
      const t = ctx.currentTime + 0.06;
      for (let i = 0; i < count; i++) {
        try {
          const pitchMult = 0.88 + Math.random() * 0.28;
          singleBark(ctx, t + i * 0.30, pitchMult);
        } catch (err) {
          console.warn('[bark] singleBark failed:', err);
        }
      }
    })
    .catch(err => {
      console.warn('[bark] AudioContext error:', err);
    });
}

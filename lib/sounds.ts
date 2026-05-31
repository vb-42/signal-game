let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

// ─── Primitives ──────────────────────────────────────────────────────────────

function noiseBurst(options: {
  duration?: number;
  filterType?: BiquadFilterType;
  filterFreq?: number;
  filterQ?: number;
  gain?: number;
  decay?: number;
  startAt?: number;
}) {
  const ctx = getAudioContext();
  const t = options.startAt ?? ctx.currentTime;
  const dur = options.duration ?? 0.01;
  const decay = options.decay ?? 50;

  const noise = ctx.createBufferSource();
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / decay);
  }
  noise.buffer = buf;

  const filter = ctx.createBiquadFilter();
  filter.type = options.filterType ?? "bandpass";
  filter.frequency.value = options.filterFreq ?? 3000;
  filter.Q.value = options.filterQ ?? 2;

  const gain = ctx.createGain();
  gain.gain.value = options.gain ?? 0.3;

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noise.start(t);
}

function toneBlip(options: {
  freqStart: number;
  freqEnd: number;
  duration?: number;
  type?: OscillatorType;
  gain?: number;
  startAt?: number;
}) {
  const ctx = getAudioContext();
  const t = options.startAt ?? ctx.currentTime;
  const dur = options.duration ?? 0.05;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = options.type ?? "sine";
  osc.frequency.setValueAtTime(options.freqStart, t);
  osc.frequency.exponentialRampToValueAtTime(options.freqEnd, t + dur);

  gain.gain.setValueAtTime(options.gain ?? 0.25, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + dur);
}

function chime(notes: number[], spacing = 0.08, duration = 0.15, startAt?: number) {
  const ctx = getAudioContext();
  const t = startAt ?? ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    osc.frequency.value = freq;
    filter.type = "lowpass";
    filter.frequency.value = 3000;

    const start = t + i * spacing;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

    osc.connect(gain);
    gain.connect(filter);
    filter.connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  });
}

// ─── Boot Sound ──────────────────────────────────────────────────────────────
// Retro-futuristic startup sequence timed to the boot video duration.
// Layers: capacitor charge → drone build → scan sweeps → data beeps → resolution chime.

export function playBootSound(duration = 7) {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    // 1. Power-on capacitor burst (0.0s)
    {
      const noise = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.4, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(200, t);
      filter.frequency.exponentialRampToValueAtTime(4000, t + 0.4);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.4, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(t);
    }

    // 2. Low drone hum builds up (0.1s → lasts most of the video)
    {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 55;
      osc2.type = "sine";
      osc2.frequency.value = 56.5; // slight detune for beating
      gain.gain.setValueAtTime(0, t + 0.1);
      gain.gain.linearRampToValueAtTime(0.18, t + 1.0);
      gain.gain.setValueAtTime(0.18, t + duration - 1.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration - 0.1);
      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + 0.1);
      osc2.start(t + 0.1);
      osc.stop(t + duration);
      osc2.stop(t + duration);
    }

    // 3. Rising synth sweep (0.3s)
    {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, t + 0.3);
      osc.frequency.exponentialRampToValueAtTime(800, t + 1.8);
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(300, t + 0.3);
      filter.frequency.exponentialRampToValueAtTime(2000, t + 1.8);
      filter.Q.value = 3;
      gain.gain.setValueAtTime(0, t + 0.3);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.5);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + 0.3);
      osc.stop(t + 1.8);
    }

    // 4. Data scan beeps (1.5s → 3.5s) — irregular high-freq chirps
    {
      const beepTimes = [1.5, 1.72, 1.88, 2.1, 2.35, 2.52, 2.68, 2.9, 3.1, 3.35];
      beepTimes.forEach((offset, i) => {
        const freq = 800 + i * 120 + Math.random() * 200;
        toneBlip({
          freqStart: freq,
          freqEnd: freq * 1.3,
          duration: 0.03 + Math.random() * 0.02,
          type: "square",
          gain: 0.06 + Math.random() * 0.05,
          startAt: t + offset,
        });
      });
    }

    // 5. Mid-point identity tone (3.2s) — two-note Interhuman ping
    {
      chime([220, 440], 0.12, 0.25, t + 3.2);
    }

    // 6. Second sweep, faster (3.8s) — data ready
    {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, t + 3.8);
      osc.frequency.exponentialRampToValueAtTime(1600, t + 4.6);
      gain.gain.setValueAtTime(0, t + 3.8);
      gain.gain.linearRampToValueAtTime(0.1, t + 3.85);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 4.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + 3.8);
      osc.stop(t + 4.6);
    }

    // 7. Rapid startup stutter (4.5s) — boot complete indicator
    {
      const stutterTimes = [4.5, 4.56, 4.62, 4.7, 4.78];
      stutterTimes.forEach((offset) => {
        noiseBurst({
          duration: 0.025,
          filterFreq: 3500 + Math.random() * 2000,
          filterType: "bandpass",
          filterQ: 4,
          gain: 0.12,
          decay: 80,
          startAt: t + offset,
        });
      });
    }

    // 8. Resolution chime (duration - 1.5s) — arrival
    {
      const resolveAt = t + duration - 1.4;
      chime([261.63, 329.63, 392.0, 523.25], 0.1, 0.4, resolveAt);
    }

    // 9. Final shimmer (duration - 0.8s)
    {
      noiseBurst({
        duration: 0.04,
        filterFreq: 8000,
        filterType: "highpass",
        gain: 0.2,
        decay: 150,
        startAt: t + duration - 0.8,
      });
    }
  } catch {
    // audio not available
  }
}

// ─── Game Result Sounds ──────────────────────────────────────────────────────

// Success — bright ascending chime with a shimmer
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    // Rising chord chime: C5 → E5 → G5 → C6
    chime([523.25, 659.25, 783.99, 1046.5], 0.07, 0.22, t);

    // Bright shimmer on top
    noiseBurst({
      duration: 0.04,
      filterFreq: 9000,
      filterType: "highpass",
      gain: 0.18,
      decay: 120,
      startAt: t + 0.18,
    });
  } catch {}
}

// Fail — dissonant descending tone with a dull thud
export function playFailSound() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    // Descending tritone: Bb4 → E4
    toneBlip({ freqStart: 466.16, freqEnd: 329.63, duration: 0.14, type: "sawtooth", gain: 0.2, startAt: t });
    toneBlip({ freqStart: 440, freqEnd: 293.66, duration: 0.18, type: "sine", gain: 0.12, startAt: t + 0.04 });

    // Low thud for weight
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.12);
    g.gain.setValueAtTime(0.28, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.14);

    // Short noise scratch
    noiseBurst({
      duration: 0.015,
      filterFreq: 900,
      filterType: "bandpass",
      filterQ: 2,
      gain: 0.22,
      decay: 80,
      startAt: t,
    });
  } catch {}
}



export const signalSounds = {
  agreement: () => {
    try {
      chime([523.25, 659.25], 0.06, 0.12);
      noiseBurst({ duration: 0.006, filterFreq: 4000, gain: 0.2, decay: 40 });
    } catch {}
  },

  confidence: () => {
    try {
      toneBlip({ freqStart: 220, freqEnd: 440, duration: 0.08, type: "triangle", gain: 0.3 });
      noiseBurst({ duration: 0.005, filterFreq: 5000, filterType: "highpass", gain: 0.15, decay: 30 });
    } catch {}
  },

  confusion: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.setValueAtTime(400, t + 0.04);
      osc.frequency.setValueAtTime(550, t + 0.08);
      osc.frequency.setValueAtTime(350, t + 0.12);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  },

  disagreement: () => {
    try {
      toneBlip({ freqStart: 300, freqEnd: 150, duration: 0.08, type: "sawtooth", gain: 0.2 });
      noiseBurst({ duration: 0.012, filterFreq: 1500, filterQ: 3, gain: 0.25, decay: 60 });
    } catch {}
  },

  disengagement: () => {
    try {
      toneBlip({ freqStart: 400, freqEnd: 100, duration: 0.12, type: "sine", gain: 0.12 });
    } catch {}
  },

  engagement: () => {
    try {
      chime([440, 554.37, 659.25], 0.05, 0.1);
      noiseBurst({ duration: 0.008, filterFreq: 6000, filterType: "highpass", gain: 0.15, decay: 35 });
    } catch {}
  },

  frustration: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      const dist = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) curve[i] = Math.tanh(((i / 128) - 1) * 3);
      dist.curve = curve;
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
      osc2.type = "square";
      osc2.frequency.setValueAtTime(185, t);
      osc2.frequency.exponentialRampToValueAtTime(95, t + 0.12);
      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(dist); osc2.connect(dist);
      dist.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc2.start(t);
      osc.stop(t + 0.15); osc2.stop(t + 0.15);
    } catch {}
  },

  hesitation: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(350, t);
      osc.frequency.exponentialRampToValueAtTime(280, t + 0.03);
      osc.frequency.setValueAtTime(320, t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(250, t + 0.08);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.1);
    } catch {}
  },

  interest: () => {
    try {
      toneBlip({ freqStart: 300, freqEnd: 600, duration: 0.06, type: "triangle", gain: 0.25 });
      noiseBurst({ duration: 0.005, filterFreq: 5000, gain: 0.12, decay: 25 });
    } catch {}
  },

  skepticism: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(350, t + 0.06);
      osc.frequency.setValueAtTime(450, t + 0.07);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.12);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.14);
    } catch {}
  },

  stress: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const noise = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((i / data.length) * Math.PI);
      noise.buffer = buf;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.setValueAtTime(3000, t);
      filter.frequency.exponentialRampToValueAtTime(800, t + 0.06);
      filter.Q.value = 2;
      const gain = ctx.createGain();
      gain.gain.value = 0.25;
      noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
      noise.start(t);
      toneBlip({ freqStart: 200, freqEnd: 80, duration: 0.08, type: "sawtooth", gain: 0.2 });
    } catch {}
  },

  uncertainty: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(380, t);
      osc.frequency.linearRampToValueAtTime(420, t + 0.04);
      osc.frequency.linearRampToValueAtTime(360, t + 0.08);
      osc.frequency.linearRampToValueAtTime(400, t + 0.12);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.14);
    } catch {}
  },
} as const;

// ─── Reaction Sounds ─────────────────────────────────────────────────────────

export const reactionSounds = {
  smile: () => { try { chime([523.25, 659.25], 0.06, 0.12); } catch {} },

  laugh: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const notes = [350, 420, 350, 450, 380];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = freq + Math.random() * 30;
        const start = t + i * 0.05;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.06);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(start); osc.stop(start + 0.06);
      });
    } catch {}
  },

  silence: () => { try { noiseBurst({ duration: 0.02, filterFreq: 800, filterType: "lowpass", gain: 0.08, decay: 200 }); } catch {} },
  hello: () => { try { chime([440, 554.37, 659.25], 0.07, 0.12); } catch {} },

  thanks: () => {
    try {
      chime([392, 493.88], 0.08, 0.15);
      noiseBurst({ duration: 0.008, filterFreq: 3000, gain: 0.15, decay: 60 });
    } catch {}
  },

  vulnerable: () => { try { toneBlip({ freqStart: 350, freqEnd: 200, duration: 0.15, type: "sine", gain: 0.12 }); } catch {} },

  idea: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.03);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.3, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.12);
      noiseBurst({ duration: 0.006, filterFreq: 8000, filterType: "highpass", gain: 0.15, decay: 20 });
    } catch {}
  },

  love: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const notes = [261.63, 329.63, 392.0, 523.25];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        const start = t + i * 0.1;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.15, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(start); osc.stop(start + 0.2);
      });
    } catch {}
  },

  surprise: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(1200, t + 0.04);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.08);
      noiseBurst({ duration: 0.01, filterFreq: 6000, filterType: "highpass", gain: 0.2, decay: 30 });
    } catch {}
  },

  sleep: () => { try { toneBlip({ freqStart: 300, freqEnd: 100, duration: 0.2, type: "sine", gain: 0.08 }); } catch {} },

  wink: () => {
    try {
      noiseBurst({ duration: 0.008, filterFreq: 4500, filterQ: 4, gain: 0.35, decay: 40 });
      toneBlip({ freqStart: 600, freqEnd: 800, duration: 0.03, type: "sine", gain: 0.2 });
    } catch {}
  },

  thinking: () => {
    try {
      const ctx = getAudioContext();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.linearRampToValueAtTime(450, t + 0.05);
      osc.frequency.linearRampToValueAtTime(380, t + 0.1);
      osc.frequency.linearRampToValueAtTime(420, t + 0.15);
      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(t); osc.stop(t + 0.18);
    } catch {}
  },
} as const;

// ─── Convenience ─────────────────────────────────────────────────────────────

export type SignalSoundName = keyof typeof signalSounds;
export type ReactionSoundName = keyof typeof reactionSounds;

export function playSignalSound(signal: SignalSoundName) {
  signalSounds[signal]?.();
}

export function playReactionSound(reaction: ReactionSoundName) {
  reactionSounds[reaction]?.();
}

// ─── UI Click Sounds ──────────────────────────────────────────────────────────

// Button click — light high-frequency snap
export function playClickA() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.004, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 25);
    }
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 6800 + Math.random() * 1200;
    filter.Q.value = 5;

    const gain = ctx.createGain();
    gain.gain.value = 0.28 + Math.random() * 0.08;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);

    // Bright tick on top
    const tick = ctx.createOscillator();
    const tickGain = ctx.createGain();
    tick.type = "sine";
    tick.frequency.setValueAtTime(3200 + Math.random() * 400, t);
    tick.frequency.exponentialRampToValueAtTime(1800, t + 0.012);
    tickGain.gain.setValueAtTime(0.12, t);
    tickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.014);
    tick.connect(tickGain);
    tickGain.connect(ctx.destination);
    tick.start(t);
    tick.stop(t + 0.015);
  } catch {}
}

export const playClickB = playClickA;

// D-pad click — crisp, lighter than A/B
export function playClickDpad() {
  try {
    const ctx = getAudioContext();
    const t = ctx.currentTime;

    const noise = ctx.createBufferSource();
    const buf = ctx.createBuffer(1, ctx.sampleRate * 0.03, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / 10);
    }
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 5200 + Math.random() * 100;
    filter.Q.value = 6;

    const gain = ctx.createGain();
    gain.gain.value = 0.22 + Math.random() * 0.06;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(t);
  } catch {}
}

export interface AmbientHandle {
  stop(): void;
  setLevel(level: number): void;
}

const GAME_BPM_MIN = 80;
const GAME_BPM_MAX = 190;

export function getGameBpm(level: number): number {
  const clamped = Math.max(1, Math.min(12, level));
  return GAME_BPM_MIN + ((clamped - 1) / 11) * (GAME_BPM_MAX - GAME_BPM_MIN);
}

export function startStreamingAmbient(initialLevel = 1): AmbientHandle {
  try {
    const ctx = getAudioContext();
    let currentBpm = getGameBpm(initialLevel);

    const master = ctx.createGain();
    master.gain.value = 0;

    const lpf = ctx.createBiquadFilter();
    lpf.type = "lowpass";
    lpf.frequency.value = 3000;
    master.connect(lpf);
    lpf.connect(ctx.destination);

    // Exact frequencies for an A-Minor scale
    const n = {
      E5: 659.25, D5: 587.33, C5: 523.25, B4: 493.88, A4: 440.00,
      A3: 220.00, E3: 164.81, A2: 110.00, E2: 82.41, 0: 0
    };

    // 64-step sequence (4 bars of 16th notes)
    const melody = [
      n.E5, 0, 0, 0, n.B4, 0, n.C5, 0, n.D5, 0, 0, 0, n.C5, 0, n.B4, 0,
      n.A4, 0, 0, 0, n.A4, 0, n.C5, 0, n.E5, 0, 0, 0, n.D5, 0, n.C5, 0,
      n.B4, 0, 0, 0, 0, 0, n.C5, 0, n.D5, 0, 0, 0, n.E5, 0, 0, 0,
      n.C5, 0, 0, 0, n.A4, 0, 0, 0, n.A4, 0, 0, 0, 0, 0, 0, 0
    ];

    const bass = [
      n.A2, 0, 0, 0, n.A3, 0, 0, 0, n.E2, 0, 0, 0, n.E3, 0, 0, 0,
      n.A2, 0, 0, 0, n.A3, 0, 0, 0, n.A2, 0, 0, 0, n.A3, 0, 0, 0,
      n.E2, 0, 0, 0, n.E3, 0, 0, 0, n.E2, 0, 0, 0, n.E3, 0, 0, 0,
      n.A2, 0, 0, 0, n.A3, 0, 0, 0, n.A2, 0, 0, 0, 0, 0, 0, 0
    ];

    let step = 0;
    let nextTime = ctx.currentTime + 0.2;
    let stopped = false;
    let schedulerId: ReturnType<typeof setInterval> | null = null;

    function getSixteenth() {
      return 60 / currentBpm / 4;
    }

    function playKick(time: number) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(180, time);
      osc.frequency.exponentialRampToValueAtTime(40, time + 0.08);
      gain.gain.setValueAtTime(0.25, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
      osc.connect(gain);
      gain.connect(master);
      osc.start(time);
      osc.stop(time + 0.12);
    }

    function playBass(freq: number, time: number) {
      if (!freq) return;
      const sixteenth = getSixteenth();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.4, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + sixteenth * 3);

      osc.connect(gain);
      gain.connect(master);
      osc.start(time);
      osc.stop(time + sixteenth * 3.5);
    }

    function playLead(freq: number, time: number) {
      if (!freq) return;
      const sixteenth = getSixteenth();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "square";
      osc.frequency.value = freq;

      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(0.08, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + sixteenth * 2.5);

      osc.connect(gain);
      gain.connect(master);
      osc.start(time);
      osc.stop(time + sixteenth * 3);
    }

    function playHat(time: number) {
      const noise = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate * 0.02, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
      noise.buffer = buf;

      const filter = ctx.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 7000;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.02, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.02);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      noise.start(time);
    }

    function schedule() {
      if (stopped) return;
      const horizon = ctx.currentTime + 0.12;
      const sixteenth = getSixteenth();

      while (nextTime < horizon) {
        const seqStep = step % 64;

        playLead(melody[seqStep], nextTime);
        playBass(bass[seqStep], nextTime);

        if (step % 4 === 0) playKick(nextTime);
        if (step % 2 === 0 && step % 4 !== 0) playHat(nextTime);

        step++;
        nextTime += sixteenth;
      }
    }

    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 1.0);

    schedulerId = setInterval(schedule, 25);
    schedule();

    return {
      setLevel(level: number) {
        currentBpm = getGameBpm(level);
      },
      stop() {
        stopped = true;
        if (schedulerId) clearInterval(schedulerId);
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.0);
      },
    };
  } catch {
    return { stop() {}, setLevel() {} };
  }
}
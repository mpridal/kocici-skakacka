// Zvuky a hudba generované přes Web Audio (žádné soubory).
// AudioContext vzniká až po prvním dotyku (požadavek prohlížečů).
import { CONFIG } from './config.js';

const NOTE = (midi) => 440 * 2 ** ((midi - 69) / 12);

// Veselá smyčka v C dur, osminy (null = pauza). 4 takty po 8 osminách.
const MELODY = [
  72, null, 76, 79, 76, null, 72, 74,
  76, null, 77, 79, 81, 79, 76, null,
  77, null, 81, 84, 81, 79, 77, 76,
  74, 76, 77, 74, 72, null, null, null,
];
const BASS = [48, 48, 53, 53, 55, 55, 48, 48]; // jedna nota na půl taktu
const EIGHTH = 0.2; // s (tempo 150 BPM)

// Tempo hudby roste se zrychlováním hry: start = 1, nejvyšší rychlost = MAX_TEMPO.
export const MAX_TEMPO = 1.3;
export function tempoForSpeed(speed) {
  const { start, max } = CONFIG.speed;
  const k = Math.min(1, Math.max(0, (speed - start) / (max - start)));
  return 1 + k * (MAX_TEMPO - 1);
}

// Úvodní obrazovka: „Hrací skříňka“ – klidná cinkavá melodie, na konci frází tiché mňau.
// Čistá data (čas v sekundách od začátku smyčky), přehrává je createAudio().startIntro().
export function introSong() {
  const e = 0.333;
  const mel = [72, 76, 79, 76, 74, 77, 79, 77, 72, 76, 79, 84, 83, 79, 77, 74];
  const events = [];
  mel.forEach((m, i) => {
    events.push({ kind: 'tone', t: i * e, freq: NOTE(m), dur: 0.5, type: 'triangle', vol: 0.16 });
    if (i % 4 === 0) events.push({ kind: 'tone', t: i * e, freq: NOTE(m - 24), dur: 0.9, type: 'sine', vol: 0.12 });
  });
  events.push({ kind: 'meow', t: 2.5, freq: 560, dur: 0.55, vol: 0.35 });
  events.push({ kind: 'meow', t: 5.0, freq: 470, dur: 0.6, vol: 0.3 });
  return { len: mel.length * e, events };
}
const INTRO = introSong();

export function createAudio() {
  let ctx = null;
  let master = null;
  let sfx = null;
  let music = null;
  let muted = false;
  let musicTimer = null;
  let nextNoteTime = 0;
  let step = 0;
  let tempo = 1;        // právě hrané tempo
  let wantedTempo = 1;  // nové tempo se použije od začátku dalšího taktu
  let intro = null;     // hudba úvodní obrazovky
  let introTimer = null;
  let introNext = 0;

  function unlock() {
    try {
      if (!ctx) {
        const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
        if (!AC) return;
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0 : 1;
        master.connect(ctx.destination);
        sfx = ctx.createGain();
        sfx.gain.value = 0.5;
        sfx.connect(master);
        music = ctx.createGain();
        music.gain.value = 0.08;
        music.connect(master);
      }
      if (ctx.state === 'suspended') ctx.resume();
    } catch {
      ctx = null;
    }
  }

  function tone(freq, start, dur, { type = 'sine', vol = 0.3, slideTo = 0, dest = sfx } = {}) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.02);
  }

  // Mňau: pila s klouzavou výškou přes pásmový filtr (nahoru a zase dolů).
  function meow(t, base, len, vol, dest) {
    const o = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o2.type = 'triangle';
    [o, o2].forEach((x, i) => {
      const k = i ? 2 : 1;
      x.frequency.setValueAtTime(base * k, t);
      x.frequency.linearRampToValueAtTime(base * 1.45 * k, t + len * 0.22);
      x.frequency.linearRampToValueAtTime(base * 0.82 * k, t + len);
    });
    f.type = 'bandpass';
    f.Q.value = 4;
    f.frequency.setValueAtTime(700, t);
    f.frequency.linearRampToValueAtTime(1700, t + len * 0.3);
    f.frequency.linearRampToValueAtTime(800, t + len);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    g.gain.setValueAtTime(vol * 0.85, t + len * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(f);
    o2.connect(f);
    f.connect(g);
    g.connect(dest);
    o.start(t);
    o2.start(t);
    o.stop(t + len + 0.05);
    o2.stop(t + len + 0.05);
  }

  function scheduleIntro() {
    while (introNext < ctx.currentTime + 1) {
      for (const ev of INTRO.events) {
        const t = introNext + ev.t;
        if (ev.kind === 'meow') meow(t, ev.freq, ev.dur, ev.vol, intro);
        else tone(ev.freq, t, ev.dur, { type: ev.type, vol: ev.vol, dest: intro });
      }
      introNext += INTRO.len;
    }
  }

  const SOUNDS = {
    jump: (t) => tone(420, t, 0.14, { type: 'triangle', vol: 0.25, slideTo: 840 }),
    fish: (t) => { tone(1320, t, 0.12, { vol: 0.25 }); tone(1760, t + 0.07, 0.18, { vol: 0.22 }); },
    heart: (t) => [660, 880, 1100, 1320].forEach((f, i) => tone(f, t + i * 0.07, 0.16, { type: 'triangle', vol: 0.22 })),
    hit: (t) => tone(520, t, 0.3, { type: 'sine', vol: 0.2, slideTo: 260 }),
    record: (t) => {
      [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.14, 0.16, { type: 'square', vol: 0.12 }));
      tone(1046, t + 0.42, 0.5, { type: 'square', vol: 0.12 });
    },
    levelUp: (t) => [523, 784, 1046].forEach((f, i) => tone(f, t + i * 0.08, 0.14, { type: 'triangle', vol: 0.2 })),
    click: (t) => tone(700, t, 0.05, { type: 'triangle', vol: 0.15 }),
  };

  function scheduleMusic() {
    while (nextNoteTime < ctx.currentTime + 0.3) {
      if (step % 8 === 0) tempo = wantedTempo;
      const eighth = EIGHTH / tempo;
      const m = MELODY[step % MELODY.length];
      if (m) tone(NOTE(m), nextNoteTime, eighth * 0.9, { type: 'triangle', vol: 0.5, dest: music });
      if (step % 4 === 0) {
        const b = BASS[Math.floor(step / 4) % BASS.length];
        tone(NOTE(b), nextNoteTime, eighth * 3.6, { type: 'sine', vol: 0.6, dest: music });
      }
      nextNoteTime += eighth;
      step++;
    }
  }

  return {
    unlock,
    get muted() { return muted; },
    setMuted(m) {
      muted = m;
      if (master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.02);
    },
    play(name) {
      if (!ctx || muted || !SOUNDS[name]) return;
      try { SOUNDS[name](ctx.currentTime + 0.01); } catch { /* bez zvuku */ }
    },
    // Hudba úvodní obrazovky (volá se opakovaně; spustí se jen jednou, po odemčení zvuku).
    startIntro() {
      if (!ctx || introTimer) return;
      intro = ctx.createGain();
      intro.gain.value = 0.35;
      intro.connect(master);
      introNext = ctx.currentTime + 0.1;
      scheduleIntro();
      introTimer = setInterval(scheduleIntro, 250);
    },
    stopIntro() {
      if (!introTimer) return;
      clearInterval(introTimer);
      introTimer = null;
      const g = intro;
      intro = null;
      g.gain.setTargetAtTime(0, ctx.currentTime, 0.05); // naplánované tóny tiše doznějí
      setTimeout(() => g.disconnect(), 400);
    },
    get introPlaying() { return !!introTimer; },
    setTempo(t) { wantedTempo = t; },
    get tempo() { return tempo; },
    startMusic() {
      if (!ctx || musicTimer) return;
      step = 0;
      tempo = wantedTempo;
      nextNoteTime = ctx.currentTime + 0.05;
      scheduleMusic();
      musicTimer = setInterval(scheduleMusic, 100);
    },
    stopMusic() {
      if (musicTimer) clearInterval(musicTimer);
      musicTimer = null;
    },
  };
}

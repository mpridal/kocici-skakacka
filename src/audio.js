// Zvuky a hudba generované přes Web Audio (žádné soubory).
// AudioContext vzniká až po prvním dotyku (požadavek prohlížečů).

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

export function createAudio() {
  let ctx = null;
  let master = null;
  let sfx = null;
  let music = null;
  let muted = false;
  let musicTimer = null;
  let nextNoteTime = 0;
  let step = 0;

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
      const m = MELODY[step % MELODY.length];
      if (m) tone(NOTE(m), nextNoteTime, EIGHTH * 0.9, { type: 'triangle', vol: 0.5, dest: music });
      if (step % 4 === 0) {
        const b = BASS[Math.floor(step / 4) % BASS.length];
        tone(NOTE(b), nextNoteTime, EIGHTH * 3.6, { type: 'sine', vol: 0.6, dest: music });
      }
      nextNoteTime += EIGHTH;
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
    startMusic() {
      if (!ctx || musicTimer) return;
      step = 0;
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

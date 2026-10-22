// Logika obrazovek a tlačítek (bez kreslení – to je v ui-draw.js).
// Souřadnice jsou logické (šířka podle displeje, výška 720), čas `now` v milisekundách.
// Rozvržení je navržené pro šířku 1280; na širším displeji se střed posune
// na střed a tlačítka označená a: 'r' zůstanou u pravého okraje.
import { CONFIG, LOGICAL_W } from './config.js';
import { unlockedAccessories } from './accessories.js';

export const SCREENS = ['intro', 'playing', 'paused', 'over', 'parent', 'bye'];
const JUMP_GUARD_MS = 250; // po startu/pokračování chvíli neskákat

const SKIN_ROW_Y = 470;
const skinButtons = CONFIG.skins.map((s, i) => ({ id: `skin-${i}`, x: 382 + i * 110, y: SKIN_ROW_Y, w: 96, h: 96 }));

const LAYOUT = {
  intro: [
    { id: 'acc', x: 150, y: 280, w: 110, h: 110 },
    { id: 'prev', x: 300, y: 280, w: 110, h: 110 },
    { id: 'next', x: 870, y: 280, w: 110, h: 110 },
    ...skinButtons,
    // Hraj! a Konec: stejně velké, jako dvojice uprostřed (mezera 24)
    { id: 'play', x: 348, y: 592, w: 280, h: 108 },
    { id: 'exit', x: 652, y: 592, w: 280, h: 108 },
    { id: 'sound', x: 1160, y: 24, w: 96, h: 96, a: 'r' },
    { id: 'gear', x: 1160, y: 600, w: 96, h: 96, a: 'r' },
  ],
  playing: [
    { id: 'sound', x: 1048, y: 16, w: 100, h: 100, a: 'r' },
    { id: 'pause', x: 1164, y: 16, w: 100, h: 100, a: 'r' },
  ],
  paused: [
    { id: 'resume', x: 390, y: 320, w: 500, h: 116 },
    { id: 'home', x: 390, y: 470, w: 240, h: 104 },
    { id: 'exit', x: 650, y: 470, w: 240, h: 104 },
  ],
  over: [
    { id: 'again', x: 350, y: 540, w: 280, h: 116 },
    { id: 'home', x: 650, y: 540, w: 280, h: 116 },
  ],
  bye: [{ id: 'stay', x: 465, y: 470, w: 350, h: 104 }],
  parent: [
    { id: 'save', x: 370, y: 450, w: 260, h: 104 },
    { id: 'back', x: 650, y: 450, w: 260, h: 104 },
  ],
};

const layoutCache = new Map();
export function layoutButtons(screen, w = LOGICAL_W) {
  const key = `${screen}@${w}`;
  let list = layoutCache.get(key);
  if (!list) {
    const dx = (w - LOGICAL_W) / 2;
    list = (LAYOUT[screen] || []).map((b) => ({ ...b, x: b.x + (b.a === 'r' ? 2 * dx : dx) }));
    layoutCache.set(key, list);
  }
  return list;
}

// Kočička pozdraví dítě a představí se.
export const greeting = (name, catName) => `${name ? `Ahoj, ${name}!` : 'Ahoj!'} Já jsem ${catName}.`;
export const recordText = (name) => (name ? `Nový rekord, ${name}!` : 'Nový rekord!');

function hit(screen, w, x, y) {
  for (const b of layoutButtons(screen, w)) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
  }
  return null;
}

export function createUI(storage, cb = {}) {
  const call = (name, ...a) => cb[name] && cb[name](...a);
  const ui = {
    screen: 'intro',
    viewW: LOGICAL_W,  // logická šířka displeje (nastavuje main.js)
    overAt: 0,
    isRecord: false,
    unlocked: null,    // ozdoba odemčená v poslední hře
    pressed: null,     // id právě stisknutého tlačítka (pro vizuální odezvu)
    holdStart: -1,     // začátek držení ozubeného kolečka
    jumpGuardUntil: 0,
    byeReturn: 'intro', // kam se vrátí „Hrát dál“ z rozloučení
    settings: storage.getSettings(),

    get skinIndex() {
      return Math.max(0, CONFIG.skins.findIndex((s) => s.id === ui.settings.skin));
    },
    get skin() { return CONFIG.skins[ui.skinIndex]; },

    setSkin(i) {
      const n = CONFIG.skins.length;
      storage.saveSettings({ skin: CONFIG.skins[((i % n) + n) % n].id });
      ui.settings = storage.getSettings();
    },
    setMuted(m) {
      storage.saveSettings({ muted: m });
      ui.settings = storage.getSettings();
    },
    toggleMute() {
      ui.setMuted(!ui.settings.muted);
      call('onMute', ui.settings.muted);
    },
    nextAccessory() {
      const list = unlockedAccessories(ui.settings.totalFish);
      const i = list.findIndex((a) => a.id === ui.settings.accessory);
      storage.saveSettings({ accessory: list[(i + 1) % list.length].id });
      ui.settings = storage.getSettings();
    },
    setName(name) {
      storage.saveSettings({ name });
      ui.settings = storage.getSettings();
    },

    setViewWidth(w) { ui.viewW = w; },

    go(screen, now) {
      ui.screen = screen;
      if (screen === 'playing') ui.jumpGuardUntil = now + JUMP_GUARD_MS;
    },

    // Rozloučení, když prohlížeč nedovolí okno zavřít.
    showBye(now) {
      ui.byeReturn = ui.screen === 'paused' ? 'paused' : 'intro';
      ui.go('bye', now);
    },

    pause(now) {
      if (ui.screen !== 'playing') return;
      ui.go('paused', now);
      call('onPause');
    },

    gameOver(now, isRecord, unlocked = null) {
      ui.overAt = now;
      ui.isRecord = isRecord;
      ui.unlocked = unlocked;
      ui.go('over', now);
    },

    overButtonsActive(now) {
      return now - ui.overAt >= CONFIG.ui.gameOverDelay * 1000;
    },

    // Vrací 'jump', pokud má ťuk skočit, jinak 'consumed'.
    pointerDown(x, y, now) {
      const id = hit(ui.screen, ui.viewW, x, y);
      ui.pressed = id;
      switch (ui.screen) {
        case 'playing':
          if (id === 'pause') { ui.pause(now); return 'consumed'; }
          if (id === 'sound') { ui.toggleMute(); return 'consumed'; }
          return now < ui.jumpGuardUntil ? 'consumed' : 'jump';
        case 'intro':
          if (id === 'play') { ui.go('playing', now); call('onStart'); }
          else if (id === 'exit') call('onExit');
          else if (id === 'acc') ui.nextAccessory();
          else if (id === 'prev') ui.setSkin(ui.skinIndex - 1);
          else if (id === 'next') ui.setSkin(ui.skinIndex + 1);
          else if (id && id.startsWith('skin-')) ui.setSkin(Number(id.slice(5)));
          else if (id === 'sound') ui.toggleMute();
          else if (id === 'gear') ui.holdStart = now;
          return 'consumed';
        case 'paused':
          if (id === 'resume') { ui.go('playing', now); call('onResume'); }
          else if (id === 'home') { ui.go('intro', now); call('onHome'); }
          else if (id === 'exit') call('onExit');
          return 'consumed';
        case 'over':
          if (!ui.overButtonsActive(now)) { ui.pressed = null; return 'consumed'; }
          if (id === 'again') { ui.go('playing', now); call('onRestart'); }
          else if (id === 'home') { ui.go('intro', now); call('onHome'); }
          return 'consumed';
        case 'bye':
          if (id === 'stay') ui.go(ui.byeReturn, now);
          return 'consumed';
        case 'parent':
          if (id === 'save') { call('onSave'); ui.go('intro', now); call('onParentClose'); }
          else if (id === 'back') { ui.go('intro', now); call('onParentClose'); }
          return 'consumed';
        default:
          return 'consumed';
      }
    },

    pointerUp() {
      ui.pressed = null;
      ui.holdStart = -1;
    },

    update(now) {
      if (ui.screen === 'intro' && ui.holdStart >= 0 && now - ui.holdStart >= CONFIG.ui.parentHoldTime * 1000) {
        ui.holdStart = -1;
        ui.pressed = null;
        ui.go('parent', now);
        call('onParentOpen');
      }
    },
  };
  return ui;
}

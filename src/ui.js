// Logika obrazovek a tlačítek (bez kreslení – to je v ui-draw.js).
// Souřadnice jsou logické (1280×720), čas `now` v milisekundách.
import { CONFIG } from './config.js';

export const SCREENS = ['intro', 'playing', 'paused', 'over', 'parent'];
const JUMP_GUARD_MS = 250; // po startu/pokračování chvíli neskákat

const SKIN_ROW_Y = 470;
const skinButtons = CONFIG.skins.map((s, i) => ({ id: `skin-${i}`, x: 382 + i * 110, y: SKIN_ROW_Y, w: 96, h: 96 }));

const LAYOUT = {
  intro: [
    { id: 'prev', x: 300, y: 280, w: 110, h: 110 },
    { id: 'next', x: 870, y: 280, w: 110, h: 110 },
    ...skinButtons,
    { id: 'play', x: 490, y: 592, w: 300, h: 108 },
    { id: 'sound', x: 1160, y: 24, w: 96, h: 96 },
    { id: 'gear', x: 1160, y: 600, w: 96, h: 96 },
  ],
  playing: [{ id: 'pause', x: 1164, y: 16, w: 100, h: 100 }],
  paused: [
    { id: 'resume', x: 390, y: 320, w: 500, h: 116 },
    { id: 'home', x: 490, y: 470, w: 300, h: 104 },
  ],
  over: [
    { id: 'again', x: 350, y: 540, w: 280, h: 116 },
    { id: 'home', x: 650, y: 540, w: 280, h: 116 },
  ],
  parent: [
    { id: 'save', x: 370, y: 450, w: 260, h: 104 },
    { id: 'back', x: 650, y: 450, w: 260, h: 104 },
  ],
};

export function layoutButtons(screen) {
  return LAYOUT[screen] || [];
}

export const greeting = (name) => (name ? `Ahoj, ${name}!` : '');
export const recordText = (name) => (name ? `Nový rekord, ${name}!` : 'Nový rekord!');

function hit(screen, x, y) {
  for (const b of LAYOUT[screen]) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return b.id;
  }
  return null;
}

export function createUI(storage, cb = {}) {
  const call = (name, ...a) => cb[name] && cb[name](...a);
  const ui = {
    screen: 'intro',
    overAt: 0,
    isRecord: false,
    pressed: null,     // id právě stisknutého tlačítka (pro vizuální odezvu)
    holdStart: -1,     // začátek držení ozubeného kolečka
    jumpGuardUntil: 0,
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
    setName(name) {
      storage.saveSettings({ name });
      ui.settings = storage.getSettings();
    },

    go(screen, now) {
      ui.screen = screen;
      if (screen === 'playing') ui.jumpGuardUntil = now + JUMP_GUARD_MS;
    },

    pause(now) {
      if (ui.screen !== 'playing') return;
      ui.go('paused', now);
      call('onPause');
    },

    gameOver(now, isRecord) {
      ui.overAt = now;
      ui.isRecord = isRecord;
      ui.go('over', now);
    },

    overButtonsActive(now) {
      return now - ui.overAt >= CONFIG.ui.gameOverDelay * 1000;
    },

    // Vrací 'jump', pokud má ťuk skočit, jinak 'consumed'.
    pointerDown(x, y, now) {
      const id = hit(ui.screen, x, y);
      ui.pressed = id;
      switch (ui.screen) {
        case 'playing':
          if (id === 'pause') { ui.pause(now); return 'consumed'; }
          return now < ui.jumpGuardUntil ? 'consumed' : 'jump';
        case 'intro':
          if (id === 'play') { ui.go('playing', now); call('onStart'); }
          else if (id === 'prev') ui.setSkin(ui.skinIndex - 1);
          else if (id === 'next') ui.setSkin(ui.skinIndex + 1);
          else if (id && id.startsWith('skin-')) ui.setSkin(Number(id.slice(5)));
          else if (id === 'sound') { ui.setMuted(!ui.settings.muted); call('onMute', ui.settings.muted); }
          else if (id === 'gear') ui.holdStart = now;
          return 'consumed';
        case 'paused':
          if (id === 'resume') { ui.go('playing', now); call('onResume'); }
          else if (id === 'home') { ui.go('intro', now); call('onHome'); }
          return 'consumed';
        case 'over':
          if (!ui.overButtonsActive(now)) { ui.pressed = null; return 'consumed'; }
          if (id === 'again') { ui.go('playing', now); call('onRestart'); }
          else if (id === 'home') { ui.go('intro', now); call('onHome'); }
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

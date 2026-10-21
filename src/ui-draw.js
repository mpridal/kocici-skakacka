// Kreslení obrazovek, tlačítek a HUD ve stejném kresleném stylu jako postavičky.
import { CONFIG, LOGICAL_W, LOGICAL_H } from './config.js';
import { layoutButtons, greeting, recordText } from './ui.js';
import { OUTLINE, prepare } from './art/shapes.js';
import { drawCat } from './art/cat.js';
import { drawHeart } from './art/heart.js';
import { drawFish } from './art/fish.js';

const FONT = '"Nunito", "Arial Rounded MT Bold", "Comic Sans MS", system-ui, sans-serif';
const TEXT = '#3A2F45';
const BTN = {
  play: '#FF8FA5', again: '#FF8FA5', resume: '#FF8FA5', save: '#AEDDA2',
  home: '#FFE9A3', back: '#FFE9A3', pause: '#FFFFFF', sound: '#FFFFFF', gear: '#FFFFFF',
  prev: '#FFFFFF', next: '#FFFFFF',
};
const LABEL = { play: 'Hraj!', again: 'Znovu', resume: 'Pokračovat', home: 'Domů', save: 'Uložit', back: 'Zpět' };

export function text(ctx, s, x, y, size, { color = TEXT, align = 'center', outline = '#FFFFFF', weight = 800 } = {}) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  if (outline) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.18;
    ctx.strokeStyle = outline;
    ctx.strokeText(s, x, y);
  }
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// ---------- ikony (střed cx, cy; velikost s) ----------
function iconPlay(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.3, cy - s * 0.4);
  ctx.lineTo(cx + s * 0.42, cy);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.4);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}
function iconPause(ctx, cx, cy, s) {
  ctx.fillStyle = OUTLINE;
  roundRect(ctx, cx - s * 0.3, cy - s * 0.36, s * 0.2, s * 0.72, 4); ctx.fill();
  roundRect(ctx, cx + s * 0.1, cy - s * 0.36, s * 0.2, s * 0.72, 4); ctx.fill();
}
function iconHome(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.42, cy - s * 0.02);
  ctx.lineTo(cx, cy - s * 0.42);
  ctx.lineTo(cx + s * 0.42, cy - s * 0.02);
  ctx.lineTo(cx + s * 0.3, cy - s * 0.02);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.38);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.38);
  ctx.lineTo(cx - s * 0.3, cy - s * 0.02);
  ctx.closePath();
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.fillStyle = '#FF8FA5';
  roundRect(ctx, cx - s * 0.09, cy + s * 0.1, s * 0.18, s * 0.28, 3); ctx.fill();
}
function iconAgain(ctx, cx, cy, s) {
  ctx.lineWidth = s * 0.14;
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.arc(cx, cy, s * 0.3, -Math.PI * 0.2, Math.PI * 1.45);
  ctx.stroke();
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  const ax = cx + s * 0.3 * Math.cos(-Math.PI * 0.2);
  const ay = cy + s * 0.3 * Math.sin(-Math.PI * 0.2);
  ctx.moveTo(ax + s * 0.18, ay - s * 0.05);
  ctx.lineTo(ax - s * 0.02, ay - s * 0.24);
  ctx.lineTo(ax - s * 0.1, ay + s * 0.08);
  ctx.closePath();
  ctx.fill();
}
function iconSound(ctx, cx, cy, s, muted) {
  ctx.fillStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.38, cy - s * 0.14);
  ctx.lineTo(cx - s * 0.18, cy - s * 0.14);
  ctx.lineTo(cx + s * 0.06, cy - s * 0.36);
  ctx.lineTo(cx + s * 0.06, cy + s * 0.36);
  ctx.lineTo(cx - s * 0.18, cy + s * 0.14);
  ctx.lineTo(cx - s * 0.38, cy + s * 0.14);
  ctx.closePath();
  ctx.fill();
  ctx.lineWidth = s * 0.08;
  ctx.strokeStyle = OUTLINE;
  if (muted) {
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.18, cy - s * 0.16); ctx.lineTo(cx + s * 0.42, cy + s * 0.16);
    ctx.moveTo(cx + s * 0.42, cy - s * 0.16); ctx.lineTo(cx + s * 0.18, cy + s * 0.16);
    ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(cx + s * 0.08, cy, s * 0.2, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + s * 0.08, cy, s * 0.36, -0.9, 0.9); ctx.stroke();
  }
}
function iconGear(ctx, cx, cy, s) {
  ctx.fillStyle = '#B9BAC2';
  ctx.beginPath();
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? s * 0.3 : s * 0.22;
    const a = (i / 16) * Math.PI * 2;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath(); ctx.arc(cx, cy, s * 0.09, 0, Math.PI * 2); ctx.fill();
}
function iconChevron(ctx, cx, cy, s, dir) {
  ctx.lineWidth = s * 0.14;
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(cx - dir * s * 0.12, cy - s * 0.26);
  ctx.lineTo(cx + dir * s * 0.14, cy);
  ctx.lineTo(cx - dir * s * 0.12, cy + s * 0.26);
  ctx.stroke();
}
function iconCheck(ctx, cx, cy, s) {
  ctx.lineWidth = s * 0.14;
  ctx.strokeStyle = OUTLINE;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.28, cy);
  ctx.lineTo(cx - s * 0.06, cy + s * 0.22);
  ctx.lineTo(cx + s * 0.3, cy - s * 0.24);
  ctx.stroke();
}
export function iconTrophy(ctx, cx, cy, s) {
  ctx.fillStyle = '#FFD45E';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.32, cy - s * 0.38);
  ctx.lineTo(cx + s * 0.32, cy - s * 0.38);
  ctx.quadraticCurveTo(cx + s * 0.3, cy + s * 0.08, cx, cy + s * 0.12);
  ctx.quadraticCurveTo(cx - s * 0.3, cy + s * 0.08, cx - s * 0.32, cy - s * 0.38);
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, cx - s * 0.08, cy + s * 0.1, s * 0.16, s * 0.18, 2); ctx.fill(); ctx.stroke();
  roundRect(ctx, cx - s * 0.26, cy + s * 0.26, s * 0.52, s * 0.14, 4); ctx.fill(); ctx.stroke();
}

const ICONS = {
  play: iconPlay, again: iconAgain, resume: iconPlay, home: iconHome, pause: iconPause,
  gear: iconGear, save: iconCheck, back: (c, x, y, s) => iconChevron(c, x, y, s, -1),
  prev: (c, x, y, s) => iconChevron(c, x, y, s, -1), next: (c, x, y, s) => iconChevron(c, x, y, s, 1),
};

function button(ctx, b, ui, active = true) {
  const down = ui.pressed === b.id ? 4 : 0;
  const r = Math.min(b.h / 2, 28);
  ctx.save();
  ctx.globalAlpha = active ? 1 : 0.45;
  roundRect(ctx, b.x, b.y + 6, b.w, b.h, r);
  ctx.fillStyle = 'rgba(74,63,69,0.25)';
  ctx.fill();
  roundRect(ctx, b.x, b.y + down, b.w, b.h, r);
  ctx.fillStyle = BTN[b.id] || '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  const cy = b.y + b.h / 2 + down;
  const label = LABEL[b.id];
  if (b.id === 'sound') iconSound(ctx, b.x + b.w / 2, cy, b.h * 0.7, ui.settings.muted);
  else if (label) {
    const iconSize = b.h * 0.55;
    ctx.font = `800 ${Math.round(b.h * 0.42)}px ${FONT}`;
    const tw = ctx.measureText(label).width;
    const total = iconSize + 14 + tw;
    const x0 = b.x + (b.w - total) / 2;
    ICONS[b.id](ctx, x0 + iconSize / 2, cy, iconSize);
    text(ctx, label, x0 + iconSize + 14 + tw / 2, cy + 2, Math.round(b.h * 0.42), { outline: null });
  } else if (ICONS[b.id]) ICONS[b.id](ctx, b.x + b.w / 2, cy, b.h * 0.7);
  ctx.restore();
}

// Ztmavení pod panelem kreslí main.js přes celé plátno (i letterbox).
export const DIM = 'rgba(58,47,69,0.35)';

function panel(ctx, x, y, w, h) {
  roundRect(ctx, x, y, w, h, 36);
  ctx.fillStyle = '#FFFBF4';
  ctx.fill();
  ctx.lineWidth = 5;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
}

// ---------- obrazovky ----------
export function drawIntro(ctx, ui, best, t) {
  prepare(ctx);
  text(ctx, 'Kočičí skákačka', 640, 78, 76);
  const g = greeting(ui.settings.name);
  if (g) text(ctx, g, 640, 156, 48, { color: '#D4537E' });
  const blink = t % 3.4 < 0.16;
  drawCat(ctx, 618, 430, 3.2, ui.skin, blink ? 'blink' : 'idle', t);

  for (const b of layoutButtons('intro')) {
    if (b.id.startsWith('skin-')) {
      const skin = CONFIG.skins[Number(b.id.slice(5))];
      const sel = skin.id === ui.skin.id;
      ctx.beginPath();
      ctx.arc(b.x + b.w / 2, b.y + b.h / 2, sel ? 42 : 34, 0, Math.PI * 2);
      ctx.fillStyle = skin.fur;
      ctx.fill();
      ctx.lineWidth = sel ? 7 : 4;
      ctx.strokeStyle = sel ? '#FF7590' : OUTLINE;
      ctx.stroke();
      ctx.lineWidth = 4;
      ctx.strokeStyle = skin.stripe;
      ctx.beginPath();
      ctx.moveTo(b.x + b.w / 2 - 10, b.y + 30); ctx.lineTo(b.x + b.w / 2 - 10, b.y + 42);
      ctx.moveTo(b.x + b.w / 2 + 10, b.y + 30); ctx.lineTo(b.x + b.w / 2 + 10, b.y + 42);
      ctx.stroke();
    } else if (b.id === 'gear') {
      ctx.globalAlpha = 0.55;
      iconGear(ctx, b.x + b.w / 2, b.y + b.h / 2, 52);
      if (ui.holdStart >= 0) {
        ctx.globalAlpha = 1;
        const k = Math.min(1, (performance.now() - ui.holdStart) / (CONFIG.ui.parentHoldTime * 1000));
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#FF7590';
        ctx.beginPath();
        ctx.arc(b.x + b.w / 2, b.y + b.h / 2, 36, -Math.PI / 2, -Math.PI / 2 + k * Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    } else {
      button(ctx, b, ui);
    }
  }
  text(ctx, CONFIG.skins[ui.skinIndex].label, 640, 590 - 14, 30, { color: '#6F717C' });

  iconTrophy(ctx, 70, 66, 70);
  text(ctx, String(best), 118, 70, 48, { align: 'left' });
}

export function drawHud(ctx, game, ui) {
  prepare(ctx);
  const shown = Math.max(game.lives, CONFIG.lives.start);
  for (let i = 0; i < shown; i++) {
    drawHeart(ctx, 52 + i * 62, 56, 2.4, i < game.lives ? '#FF7590' : '#FFFFFF', 1.8);
  }
  drawFish(ctx, 52, 122, 1.6, 0, 0);
  text(ctx, String(game.fish), 100, 124, 44, { align: 'left' });
  text(ctx, String(game.score), 1140, 66, 64, { align: 'right' });
  button(ctx, layoutButtons('playing')[0], ui);
}

export function drawPaused(ctx, ui) {
  panel(ctx, 340, 150, 600, 460);
  text(ctx, 'Pauza', 640, 240, 80, { outline: null });
  for (const b of layoutButtons('paused')) button(ctx, b, ui);
}

export function drawOver(ctx, ui, game, best, now) {
  panel(ctx, 260, 70, 760, 610);
  text(ctx, 'Konec hry!', 640, 150, 76, { outline: null });
  text(ctx, String(game.score), 640, 260, 110, { outline: null, color: '#D4537E' });
  drawFish(ctx, 575, 360, 2.2, 0, 0);
  text(ctx, `× ${game.fish}`, 640, 362, 50, { align: 'left', outline: null });
  if (ui.isRecord) {
    text(ctx, recordText(ui.settings.name), 640, 450, 54, { color: '#E08A3C', outline: null });
  } else {
    iconTrophy(ctx, 560, 448, 56);
    text(ctx, String(best), 600, 452, 46, { align: 'left', outline: null });
  }
  const active = ui.overButtonsActive(now);
  for (const b of layoutButtons('over')) button(ctx, b, ui, active);
}

export function drawParent(ctx, ui) {
  panel(ctx, 300, 120, 680, 480);
  text(ctx, 'Pro rodiče', 640, 190, 54, { outline: null });
  text(ctx, 'Jméno dítěte (zobrazí se jen na tomto tabletu):', 640, 262, 26, { outline: null, weight: 600, color: '#6F717C' });
  roundRect(ctx, 390, 300, 500, 100, 20);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  for (const b of layoutButtons('parent')) button(ctx, b, ui);
}

export const NAME_BOX = { x: 400, y: 308, w: 480, h: 84 };

export function drawRotate(ctx, t) {
  const a = (Math.sin(t * 2) * 0.5 + 0.5) * (Math.PI / 2);
  ctx.save();
  ctx.translate(640, 300);
  ctx.rotate(-a);
  roundRect(ctx, -70, -120, 140, 240, 24);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  ctx.restore();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#FF7590';
  ctx.beginPath();
  ctx.arc(640, 300, 190, -2.4, -1.0);
  ctx.stroke();
  text(ctx, 'Otoč tablet', 640, 580, 80);
}

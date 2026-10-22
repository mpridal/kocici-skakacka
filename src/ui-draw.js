// Kreslení obrazovek, tlačítek a HUD ve stejném kresleném stylu jako postavičky.
import { CONFIG, LOGICAL_W, LOGICAL_H } from './config.js';
import { layoutButtons, greeting, recordText } from './ui.js';
import { OUTLINE, prepare } from './art/shapes.js';
import { drawCat, drawAccessoryIcon } from './art/cat.js';
import { nextUnlock } from './accessories.js';
import { drawHeart } from './art/heart.js';
import { drawFish } from './art/fish.js';

const FONT = '"Nunito", "Arial Rounded MT Bold", "Comic Sans MS", system-ui, sans-serif';
const TEXT = '#3A2F45';
const BTN = {
  play: '#FF8FA5', again: '#FF8FA5', resume: '#FF8FA5', save: '#AEDDA2',
  home: '#FFE9A3', back: '#FFE9A3', exit: '#B6DDF7', stay: '#FF8FA5', pause: '#FFFFFF', sound: '#FFFFFF', gear: '#FFFFFF',
  prev: '#FFFFFF', next: '#FFFFFF',
};
const LABEL = { stay: 'Hrát dál', exit: 'Konec', play: 'Hraj!', again: 'Znovu', resume: 'Pokračovat', home: 'Domů', save: 'Uložit', back: 'Zpět' };

// Řetězce fontů se skládají jen jednou (méně práce v herní smyčce).
const fontCache = new Map();
function font(weight, size) {
  const key = weight * 1000 + size;
  let f = fontCache.get(key);
  if (!f) { f = `${weight} ${size}px ${FONT}`; fontCache.set(key, f); }
  return f;
}

export function text(ctx, s, x, y, size, { color = TEXT, align = 'center', outline = '#FFFFFF', weight = 800 } = {}) {
  ctx.font = font(weight, size);
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

// Dveře se šipkou ven.
function iconExit(ctx, cx, cy, s) {
  ctx.fillStyle = '#FFFFFF';
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  roundRect(ctx, cx - s * 0.34, cy - s * 0.42, s * 0.44, s * 0.84, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = OUTLINE;
  ctx.beginPath(); ctx.arc(cx + s * 0.02, cy, s * 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = s * 0.11;
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.12, cy); ctx.lineTo(cx + s * 0.44, cy);
  ctx.moveTo(cx + s * 0.3, cy - s * 0.15); ctx.lineTo(cx + s * 0.44, cy); ctx.lineTo(cx + s * 0.3, cy + s * 0.15);
  ctx.stroke();
}

const ICONS = {
  exit: iconExit,
  stay: iconPlay,
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

// Tlačítko ozdoby: ukáže vybranou ozdobu a pod ním kolik rybiček zbývá do další.
function drawAccButton(ctx, b, ui) {
  roundRect(ctx, b.x, b.y + 6, b.w, b.h, 28);
  ctx.fillStyle = 'rgba(74,63,69,0.25)';
  ctx.fill();
  roundRect(ctx, b.x, b.y + (ui.pressed === b.id ? 4 : 0), b.w, b.h, 28);
  ctx.fillStyle = '#FFFFFF';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2;
  if (ui.settings.accessory === 'none') {
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#B4B2A9';
    ctx.beginPath();
    ctx.arc(cx, cy, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    drawAccessoryIcon(ctx, ui.settings.accessory, cx, cy, 70);
  }
  const next = nextUnlock(ui.settings.totalFish);
  drawFish(ctx, b.x + 22, b.y + b.h + 30, 1.1, 0, 0);
  text(ctx, next ? `${ui.settings.totalFish}/${next.need}` : String(ui.settings.totalFish), b.x + 54, b.y + b.h + 32, 26, { align: 'left' });
}

// ---------- obrazovky ----------
// Posun středu obrazovky proti základní šířce 1280 (širší displeje).
const centerShift = (ui) => (ui.viewW - LOGICAL_W) / 2;

export function drawIntro(ctx, ui, best, t) {
  prepare(ctx);
  const cx = 640 + centerShift(ui);
  text(ctx, 'Kočičí skákačka', cx, 78, 76);
  text(ctx, greeting(ui.settings.name, ui.skin.label), cx, 160, 44, { color: '#D4537E' });
  const blink = t % 3.4 < 0.16;
  drawCat(ctx, cx - 22, 430, 3.2, ui.skin, blink ? 'blink' : 'idle', t, false, ui.settings.accessory);

  for (const b of layoutButtons('intro', ui.viewW)) {
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
    } else if (b.id === 'acc') {
      drawAccButton(ctx, b, ui);
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

  iconTrophy(ctx, 70, 66, 70);
  text(ctx, String(best), 118, 70, 48, { align: 'left' });
}

// Nápis „Rychleji!“ po zrychlení: krátce vyskočí a zmizí. age = sekundy od zrychlení.
export function drawLevelUp(ctx, age, cx) {
  if (age < 0 || age > 1.6) return;
  const pop = age < 0.25 ? 0.6 + (age / 0.25) * 0.5 : age < 0.4 ? 1.1 - ((age - 0.25) / 0.15) * 0.1 : 1;
  ctx.save();
  ctx.globalAlpha = age > 1.2 ? 1 - (age - 1.2) / 0.4 : 1;
  ctx.translate(cx, 250);
  ctx.scale(pop, pop);
  text(ctx, 'Rychleji!', 0, 0, 84, { color: '#FF7590' });
  ctx.restore();
}

// Nápověda pro začátečníka: ručička ťuká (tap) nebo drží (hold) a velký nápis.
export function drawHint(ctx, kind, t, cx) {
  if (!kind) return;
  if (kind === 'run') {
    // pod vysokou veverkou se neskáče – jen běžet dál (šipka vpřed se pohupuje)
    ctx.save();
    ctx.translate(cx, 300);
    text(ctx, 'Běž dál!', 0, -70, 64, { color: '#2E8B57' });
    const dx = Math.sin(t * 6) * 10;
    ctx.fillStyle = '#AEDDA2';
    ctx.strokeStyle = OUTLINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-50 + dx, 10); ctx.lineTo(10 + dx, 10); ctx.lineTo(10 + dx, -10); ctx.lineTo(50 + dx, 25);
    ctx.lineTo(10 + dx, 60); ctx.lineTo(10 + dx, 40); ctx.lineTo(-50 + dx, 40); ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    return;
  }
  const hold = kind === 'hold';
  const press = hold ? Math.min(1, (t % 1.4) / 0.25) : Math.abs(Math.sin(t * 6));
  ctx.save();
  ctx.translate(cx, 300);
  text(ctx, hold ? 'Podrž prst!' : 'Ťukni!', 0, -70, 64, { color: '#D4537E' });
  // ručička ukazuje prstem dolů na displej; při stisku se posune dolů a pod prstem se rozsvítí kroužek
  const dy = press * 12;
  ctx.globalAlpha = 0.35 + 0.35 * press;
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(0, 96, 20 + press * (hold ? 18 : 9), 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#FFE3C9';
  ctx.strokeStyle = OUTLINE;
  ctx.lineWidth = 4;
  roundRect(ctx, -9, 24 + dy, 20, 62, 10);    // ukazováček dolů
  ctx.fill();
  ctx.stroke();
  roundRect(ctx, -30, -22 + dy, 64, 58, 22);  // dlaň se zatnutými prsty
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();                              // klouby zatnutých prstů
  ctx.moveTo(14, 4 + dy); ctx.lineTo(28, 4 + dy);
  ctx.moveTo(14, 20 + dy); ctx.lineTo(28, 20 + dy);
  ctx.stroke();
  roundRect(ctx, -44, -6 + dy, 22, 34, 11);   // palec stranou
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function drawHud(ctx, game, ui) {
  prepare(ctx);
  const shown = Math.max(game.lives, CONFIG.lives.start);
  for (let i = 0; i < shown; i++) {
    drawHeart(ctx, 52 + i * 62, 56, 2.4, i < game.lives ? '#FF7590' : '#FFFFFF', 1.8);
  }
  drawFish(ctx, 52, 122, 1.6, 0, 0);
  text(ctx, String(game.fish), 100, 124, 44, { align: 'left' });
  const buttons = layoutButtons('playing', ui.viewW);
  text(ctx, String(game.score), buttons[0].x - 24, 66, 64, { align: 'right' });
  for (const b of buttons) button(ctx, b, ui);
}

export function drawPaused(ctx, ui) {
  ctx.save();
  ctx.translate(centerShift(ui), 0);
  panel(ctx, 340, 150, 600, 460);
  text(ctx, 'Pauza', 640, 240, 80, { outline: null });
  for (const b of layoutButtons('paused')) button(ctx, b, ui);
  ctx.restore();
}

export function drawOver(ctx, ui, game, best, now) {
  ctx.save();
  ctx.translate(centerShift(ui), 0);
  panel(ctx, 260, 70, 760, 610);
  text(ctx, 'Konec hry!', 640, 150, 76, { outline: null });
  text(ctx, String(game.score), 640, 260, 110, { outline: null, color: '#D4537E' });
  drawFish(ctx, 575, 360, 2.2, 0, 0);
  text(ctx, `× ${game.fish}`, 640, 362, 50, { align: 'left', outline: null });
  if (ui.unlocked) {
    text(ctx, `Nová ozdoba: ${ui.unlocked.label}!`, 640, ui.isRecord ? 500 : 450, 40, { color: '#B98AE0', outline: null });
  }
  if (ui.isRecord) {
    text(ctx, recordText(ui.settings.name), 640, ui.unlocked ? 445 : 450, ui.unlocked ? 46 : 54, { color: '#E08A3C', outline: null });
  } else if (ui.unlocked) {
    // místo rekordu ukážeme jen ozdobu
  } else {
    iconTrophy(ctx, 560, 448, 56);
    text(ctx, String(best), 600, 452, 46, { align: 'left', outline: null });
  }
  const active = ui.overButtonsActive(now);
  for (const b of layoutButtons('over')) button(ctx, b, ui, active);
  ctx.restore();
}

export function drawParent(ctx, ui) {
  ctx.save();
  ctx.translate(centerShift(ui), 0);
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
  ctx.restore();
}

export function drawBye(ctx, ui, t) {
  ctx.save();
  ctx.translate(centerShift(ui), 0);
  panel(ctx, 300, 90, 680, 540);
  text(ctx, ui.settings.name ? `Pa pa, ${ui.settings.name}!` : 'Pa pa!', 640, 160, 64, { outline: null, color: '#D4537E' });
  drawCat(ctx, 620, 330, 2, ui.skin, t % 2.4 < 0.2 ? 'blink' : 'idle', t);
  text(ctx, 'Hru zavřeš tlačítkem Zpět', 640, 382, 32, { outline: null, weight: 700 });
  text(ctx, 'nebo Domů na telefonu.', 640, 424, 32, { outline: null, weight: 700 });
  for (const b of layoutButtons('bye')) button(ctx, b, ui);
  ctx.restore();
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
  text(ctx, 'Otoč displej', 640, 580, 80);
}

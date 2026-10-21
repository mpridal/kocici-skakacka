// Bonusy: rybičky (oblouk ve vzduchu) a vzácné srdíčko. Vznikají v mezerách mezi překážkami.
import { CONFIG } from './config.js';

// Obrysy kreseb v jednotkách vzoru, vztažené ke středu.
export const FISH_ART = { left: -14, right: 22, top: -10, bottom: 10 };
export const HEART_ART = { left: -13, right: 13, top: -10, bottom: 10 };

const FISH_SPACING = 64;
const ARC_LOW = 110;   // výška krajních rybiček nad zemí
const ARC_HIGH = 200;  // výška prostřední rybičky
const HEART_HEIGHT = 190;

export function createPickupPool(size = 24) {
  return Array.from({ length: size }, () => ({ active: false, kind: 'fish', x: 0, y: 0, phase: 0 }));
}

function spawn(pool, kind, x, y, phase) {
  const p = pool.find((q) => !q.active);
  if (!p) return;
  p.active = true;
  p.kind = kind;
  p.x = x;
  p.y = y;
  p.phase = phase;
}

// Mezera mezi překážkami začíná na `startX` (obrazovka) a je široká `gapPx`.
export function placePickups(pool, startX, gapPx, rng) {
  const cx = startX + gapPx / 2;
  const c = CONFIG.pickups;
  if (rng() < c.heartChance) {
    spawn(pool, 'heart', cx, HEART_HEIGHT, 0);
    return;
  }
  if (rng() >= c.fishChance) return;
  const n = 3 + Math.floor(rng() * 3);
  const first = cx - ((n - 1) * FISH_SPACING) / 2;
  for (let i = 0; i < n; i++) {
    const y = ARC_LOW + (ARC_HIGH - ARC_LOW) * Math.sin((Math.PI * i) / (n - 1));
    spawn(pool, 'fish', first + i * FISH_SPACING, y, i * 0.07);
  }
}

export function pickupBox(p, out = { x: 0, y: 0, w: 0, h: 0 }) {
  const fish = p.kind === 'fish';
  const art = fish ? FISH_ART : HEART_ART;
  const s = fish ? CONFIG.pickups.fishScale : CONFIG.pickups.heartScale;
  out.x = p.x + art.left * s;
  out.y = CONFIG.groundY - p.y + art.top * s;
  out.w = (art.right - art.left) * s;
  out.h = (art.bottom - art.top) * s;
  return out;
}

export function updatePickups(pool, dx) {
  for (const p of pool) {
    if (!p.active) continue;
    p.x -= dx;
    if (p.x < -100) p.active = false;
  }
}

// Pozadí: nebe, slunce/měsíc, hvězdy, mraky a kopečky ve vrstvách (paralaxa), cestička.
import { CONFIG, LOGICAL_W, LOGICAL_H } from './config.js';
import { dayPhase, skyPalette } from './daynight.js';
import { path, OUTLINE } from './art/shapes.js';

const TILE = LOGICAL_W;
const FAR_HILLS = 'M0,600 V480 Q213,400 427,480 Q640,420 853,480 Q1067,390 1280,480 V600Z';
const NEAR_HILLS = 'M0,600 V548 Q160,488 320,548 Q480,508 640,548 Q800,484 960,548 Q1120,502 1280,548 V600Z';
const CLOUDS = [[120, 90, 1], [520, 60, 1.2], [880, 120, 0.9], [1180, 70, 1.1]];
const PEBBLES = [[60, 640, 6], [250, 660, 8], [430, 632, 5], [610, 655, 7], [820, 645, 6], [1010, 668, 8], [1170, 636, 5]];

function seeded(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function createWorld() {
  const r = seeded(7);
  const stars = Array.from({ length: 45 }, () => ({ x: r() * LOGICAL_W, y: 20 + r() * 330, s: 1.5 + r() * 2.5, p: r() * 6 }));
  return { far: 0, near: 0, ground: 0, clouds: 0, time: 0, stars, palette: skyPalette(0, {}), paletteScore: -1, gradient: null, gradientKey: '' };
}

export function updateWorld(world, dt, speed, score) {
  world.time += dt;
  world.clouds = (world.clouds + (speed * 0.1 + 12) * dt) % (TILE + 400);
  world.far = (world.far + speed * 0.25 * dt) % TILE;
  world.near = (world.near + speed * 0.5 * dt) % TILE;
  world.ground = (world.ground + speed * dt) % TILE;
  const s = Math.floor(score);
  if (s !== world.paletteScore) {
    world.paletteScore = s;
    skyPalette(dayPhase(s), world.palette);
  }
}

function cloud(ctx, x, y, k) {
  ctx.beginPath();
  ctx.moveTo(x + 52 * k, y);
  ctx.ellipse(x, y, 52 * k, 20 * k, 0, 0, Math.PI * 2);
  ctx.moveTo(x + 60 * k, y - 14 * k);
  ctx.ellipse(x + 28 * k, y - 14 * k, 32 * k, 20 * k, 0, 0, Math.PI * 2);
  ctx.moveTo(x, y - 6 * k);
  ctx.ellipse(x - 26 * k, y - 6 * k, 26 * k, 16 * k, 0, 0, Math.PI * 2);
  ctx.fill();
}

function tiled(ctx, d, offset, fill) {
  ctx.fillStyle = fill;
  const p = path(d);
  ctx.save();
  ctx.translate(-offset, 0);
  ctx.fill(p);
  ctx.translate(TILE, 0);
  ctx.fill(p);
  ctx.restore();
}

export function drawWorld(ctx, world) {
  const pal = world.palette;
  const key = pal.skyTop + pal.skyBottom;
  if (key !== world.gradientKey) {
    world.gradientKey = key;
    world.gradient = ctx.createLinearGradient(0, 0, 0, CONFIG.groundY);
    world.gradient.addColorStop(0, pal.skyTop);
    world.gradient.addColorStop(1, pal.skyBottom);
  }
  ctx.fillStyle = world.gradient;
  ctx.fillRect(0, 0, LOGICAL_W, CONFIG.groundY);

  if (pal.starsAlpha > 0.01) {
    ctx.fillStyle = '#FFF6C8';
    for (const st of world.stars) {
      ctx.globalAlpha = pal.starsAlpha * (0.6 + 0.4 * Math.sin(world.time * 2 + st.p));
      ctx.beginPath();
      ctx.arc(st.x, st.y, st.s, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  const arcY = 130 - 40 * Math.sin(pal.phase * Math.PI * 2);
  if (pal.sunAlpha > 0.01) {
    ctx.globalAlpha = pal.sunAlpha;
    ctx.fillStyle = '#FFE9A3';
    ctx.beginPath();
    ctx.arc(1040, arcY, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (pal.moonAlpha > 0.01) {
    ctx.globalAlpha = pal.moonAlpha;
    ctx.fillStyle = '#FFF6D6';
    ctx.beginPath();
    ctx.arc(1040, 120, 36, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#F1E5B8';
    ctx.beginPath();
    ctx.arc(1028, 110, 7, 0, Math.PI * 2);
    ctx.moveTo(1057, 132);
    ctx.arc(1052, 132, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.globalAlpha = 0.6 + 0.4 * (1 - pal.starsAlpha);
  for (const [cx, cy, k] of CLOUDS) {
    const x = ((cx - world.clouds) % (TILE + 400) + TILE + 400) % (TILE + 400) - 200;
    cloud(ctx, x, cy, k);
  }
  ctx.globalAlpha = 1;

  tiled(ctx, FAR_HILLS, world.far, pal.hillFar);
  tiled(ctx, NEAR_HILLS, world.near, pal.hillNear);

  ctx.fillStyle = pal.grass;
  ctx.fillRect(0, CONFIG.groundY - 16, LOGICAL_W, 18);
  ctx.fillStyle = pal.path;
  ctx.fillRect(0, CONFIG.groundY, LOGICAL_W, LOGICAL_H - CONFIG.groundY);
  ctx.fillStyle = OUTLINE;
  ctx.globalAlpha = 0.12;
  for (const [px, py, r] of PEBBLES) {
    const x = ((px - world.ground) % TILE + TILE) % TILE;
    ctx.beginPath();
    ctx.ellipse(x, py, r, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

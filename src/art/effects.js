// Drobné efekty: hvězdičky po sebrání bonusu a konfety při rekordu (předem alokované).
import { prepare, OUTLINE } from './shapes.js';

const CONFETTI_COLORS = ['#FF8FA5', '#FFE38A', '#B6DDF7', '#AEDDA2', '#DDB3F2', '#F6B26B'];

export function createEffects(size = 160) {
  return Array.from({ length: size }, () => ({
    active: false, kind: 'star', x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, rot: 0, color: '#FFF3A0',
  }));
}

function take(fx) {
  return fx.find((p) => !p.active) || null;
}

export function spawnSparkles(fx, x, y, color = '#FFF3A0') {
  for (let i = 0; i < 7; i++) {
    const p = take(fx);
    if (!p) return;
    const a = (i / 7) * Math.PI * 2;
    p.active = true;
    p.kind = 'star';
    p.x = x;
    p.y = y;
    p.vx = Math.cos(a) * 160;
    p.vy = Math.sin(a) * 160 - 40;
    p.life = p.maxLife = 0.55;
    p.rot = a;
    p.color = color;
  }
}

export function spawnConfetti(fx, width, rng = Math.random) {
  for (let i = 0; i < 90; i++) {
    const p = take(fx);
    if (!p) return;
    p.active = true;
    p.kind = 'confetti';
    p.x = rng() * width;
    p.y = -20 - rng() * 300;
    p.vx = (rng() - 0.5) * 80;
    p.vy = 140 + rng() * 120;
    p.life = p.maxLife = 4;
    p.rot = rng() * Math.PI;
    p.color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
  }
}

export function updateEffects(fx, dt) {
  for (const p of fx) {
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) { p.active = false; continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rot += dt * 4;
    if (p.kind === 'star') { p.vx *= 0.92; p.vy *= 0.92; }
  }
}

export function clearEffects(fx) {
  for (const p of fx) p.active = false;
}

function star(ctx, r) {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.3, -r * 0.3);
  ctx.lineTo(r, 0);
  ctx.lineTo(r * 0.3, r * 0.3);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.3, r * 0.3);
  ctx.lineTo(-r, 0);
  ctx.lineTo(-r * 0.3, -r * 0.3);
  ctx.closePath();
}

export function drawEffects(ctx, fx) {
  prepare(ctx);
  for (const p of fx) {
    if (!p.active) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = Math.min(1, p.life / (p.maxLife * 0.4));
    if (p.kind === 'star') {
      star(ctx, 11);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#E0B840';
      ctx.stroke();
    } else {
      ctx.fillStyle = p.color;
      ctx.fillRect(-7, -4, 14, 8);
      ctx.lineWidth = 1;
      ctx.strokeStyle = OUTLINE;
      ctx.globalAlpha *= 0.4;
      ctx.strokeRect(-7, -4, 14, 8);
    }
    ctx.restore();
  }
}

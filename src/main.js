// Start hry, herní smyčka a přepínání obrazovek.
import { CONFIG, LOGICAL_W, LOGICAL_H } from './config.js';
import { computeViewport } from './viewport.js';
import { createInput } from './input.js';
import { createGame, stepGame, resetGame } from './game.js';
import { catHitbox } from './cat.js';
import { obstacleHitbox } from './obstacles.js';
import { drawObstacle, drawGameCat, drawPickup } from './art/scene.js';
import { createAudio } from './audio.js';
import { createWorld, updateWorld, drawWorld } from './world.js';
import { createEffects, spawnSparkles, updateEffects, drawEffects } from './art/effects.js';

const debugBoxes = new URLSearchParams(location.search).has('boxes');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let vp = null;
const game = createGame();
const effects = createEffects();
const world = createWorld();
const audio = createAudio();
if (debugBoxes) window.__audio = audio;
const fastDays = new URLSearchParams(location.search).has('fast');
if (debugBoxes) window.__game = game;

const input = createInput(canvas, () => {
  audio.unlock();
  audio.startMusic();
  if (game.status === 'over') {
    resetGame(game);
    return false;
  }
  return true;
});
input.attach();

function resize() {
  vp = computeViewport(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  canvas.width = vp.canvasW;
  canvas.height = vp.canvasH;
  draw();
}
window.addEventListener('resize', resize);
window.addEventListener('contextmenu', (e) => e.preventDefault());

const box = { x: 0, y: 0, w: 0, h: 0 };

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // letterbox: nahoře barva nebe, dole barva cestičky
  ctx.fillStyle = world.palette.skyTop;
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = world.palette.path;
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
  const s = vp.scale * vp.dpr;
  ctx.setTransform(s, 0, 0, s, vp.offsetX * vp.dpr, vp.offsetY * vp.dpr);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, LOGICAL_W, LOGICAL_H);
  ctx.clip();
  drawWorld(ctx, world);

  for (const o of game.obstacles) if (o.active) drawObstacle(ctx, o);
  for (const p of game.pickups) if (p.active) drawPickup(ctx, p, game.time);
  drawGameCat(ctx, game, CONFIG.skins[0]);
  drawEffects(ctx, effects);
  ctx.restore();
  if (debugBoxes) {
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    for (const o of game.obstacles) {
      if (!o.active) continue;
      obstacleHitbox(o, box);
      ctx.strokeRect(box.x, box.y, box.w, box.h);
    }
    catHitbox(game.cat, box);
    ctx.strokeRect(box.x, box.y, box.w, box.h);
  }

  ctx.fillStyle = '#3A2F45';
  ctx.font = '600 40px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('♥'.repeat(game.lives), 30, 60);
  ctx.textAlign = 'right';
  ctx.fillText(String(game.score), LOGICAL_W - 30, 60);
  if (game.status === 'over') {
    ctx.textAlign = 'center';
    ctx.fillText('Konec hry! Ťukni pro novou hru', LOGICAL_W / 2, 330);
  }
}

resize();

let last = performance.now();
function frame(now) {
  const dt = (now - last) / 1000;
  last = now;
  stepGame(game, dt, input.held, input.consumePress());
  for (const e of game.events) {
    if (e === 'jump' || e === 'fish' || e === 'heart' || e === 'hit') audio.play(e);
    else if (e === 'heartBonus') audio.play('heart');
    else if (e === 'over') audio.stopMusic();
    if (e === 'fish') spawnSparkles(effects, game.pickupAt.x, game.pickupAt.y);
    else if (e === 'heart' || e === 'heartBonus') spawnSparkles(effects, game.pickupAt.x, game.pickupAt.y, '#FF8FA5');
  }
  updateEffects(effects, Math.min(dt, CONFIG.maxDt));
  const worldDt = Math.min(dt, CONFIG.maxDt);
  updateWorld(world, worldDt, game.status === 'playing' ? game.speed : 0, fastDays ? game.time * 60 : game.score);
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

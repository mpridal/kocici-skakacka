// Start hry, herní smyčka a přepínání obrazovek.
import { CONFIG, LOGICAL_W, LOGICAL_H } from './config.js';
import { computeViewport } from './viewport.js';
import { createInput } from './input.js';
import { createGame, stepGame, resetGame } from './game.js';
import { catHitbox } from './cat.js';
import { obstacleHitbox } from './obstacles.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let vp = null;
const game = createGame();

const input = createInput(canvas, () => {
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
  ctx.fillStyle = '#CDEBFA';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const s = vp.scale * vp.dpr;
  ctx.setTransform(s, 0, 0, s, vp.offsetX * vp.dpr, vp.offsetY * vp.dpr);
  ctx.fillStyle = '#F7E6C4';
  ctx.fillRect(0, CONFIG.groundY, LOGICAL_W, LOGICAL_H - CONFIG.groundY);

  // Zástupné tvary (nahradí je grafika v dalším kroku).
  for (const o of game.obstacles) {
    if (!o.active) continue;
    obstacleHitbox(o, box);
    ctx.fillStyle = o.kind === 'squirrel' ? '#C7743A' : '#6FA552';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  catHitbox(game.cat, box);
  const blink = game.invuln > 0 && Math.floor(game.time * 10) % 2 === 0;
  if (!blink) {
    ctx.fillStyle = '#B9BAC2';
    ctx.fillRect(box.x, box.y, box.w, box.h);
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
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

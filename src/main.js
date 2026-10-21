// Start hry, herní smyčka a přepínání obrazovek.
import { LOGICAL_W, LOGICAL_H } from './config.js';
import { computeViewport } from './viewport.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let vp = null;

function resize() {
  vp = computeViewport(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  canvas.width = vp.canvasW;
  canvas.height = vp.canvasH;
  draw();
}
window.addEventListener('resize', resize);
window.addEventListener('contextmenu', (e) => e.preventDefault());

function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#CDEBFA';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const s = vp.scale * vp.dpr;
  ctx.setTransform(s, 0, 0, s, vp.offsetX * vp.dpr, vp.offsetY * vp.dpr);
  ctx.fillStyle = '#F7E6C4';
  ctx.fillRect(0, 600, LOGICAL_W, LOGICAL_H - 600);
}

resize();

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, 1 / 30);
  last = now;
  void dt;
  draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

// Start hry, herní smyčka a přepínání obrazovek.
import { CONFIG, LOGICAL_W, LOGICAL_H } from './config.js';
import { computeViewport, toLogical } from './viewport.js';
import { createInput } from './input.js';
import { createStorage } from './storage.js';
import { createGame, stepGame, resetGame } from './game.js';
import { catHitbox } from './cat.js';
import { obstacleHitbox } from './obstacles.js';
import { createUI, layoutButtons } from './ui.js';
import { drawIntro, drawHud, drawPaused, drawOver, drawParent, drawRotate, drawLevelUp, drawHint, drawBye, NAME_BOX, DIM } from './ui-draw.js';
import { drawObstacle, drawGameCat, drawPickup } from './art/scene.js';
import { createAudio, tempoForSpeed } from './audio.js';
import { hintFor, tutorialActive } from './tutorial.js';
import { newlyUnlocked } from './accessories.js';
import { startAutoUpdate } from './update.js';
import { vibrateFor } from './haptics.js';
import { hitFeedback } from './feedback.js';
import { createWorld, updateWorld, drawWorld } from './world.js';
import { createEffects, spawnSparkles, spawnConfetti, updateEffects, drawEffects, clearEffects } from './art/effects.js';

const params = new URLSearchParams(location.search);
const debugBoxes = params.has('boxes');
const fastDays = params.has('fast');

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const nameInput = document.getElementById('name');
nameInput.maxLength = CONFIG.ui.nameMaxLength;
let vp = null;

const storage = createStorage();
const game = createGame();
const effects = createEffects();
const world = createWorld();
const audio = createAudio();

const startRun = () => {
  resetGame(game);
  hitAt = -1e9;
  audio.setTempo(1);
  levelUpAt = -1e9;
  clearEffects(effects);
  audio.startMusic();
};

const ui = createUI(storage, {
  onStart: startRun,
  onRestart: startRun,
  onResume: () => audio.startMusic(),
  onPause: () => audio.stopMusic(),
  onHome: () => { audio.stopMusic(); resetGame(game); clearEffects(effects); },
  onMute: (m) => audio.setMuted(m),
  onParentOpen: () => showNameInput(true),
  onParentClose: () => showNameInput(false),
  onSave: () => ui.setName(nameInput.value),
  onExit: exitApp,
});
if (debugBoxes) Object.assign(window, { __game: game, __audio: audio, __ui: ui });
audio.setMuted(ui.settings.muted);

// ---------- ukončení aplikace ----------
// Nainstalovanou aplikaci prohlížeč zavřít dovolí; v panelu Chrome ne – pak rozloučení s radou.
function exitApp() {
  audio.stopMusic();
  try { window.close(); } catch { /* nejde */ }
  setTimeout(() => {
    if (!document.hidden) ui.showBye(performance.now());
  }, 400);
}

// ---------- rodičovské pole pro jméno (HTML input přes canvas) ----------
function placeNameInput() {
  const s = vp.scale;
  Object.assign(nameInput.style, {
    left: `${vp.offsetX + (NAME_BOX.x + (vp.logicalW - LOGICAL_W) / 2) * s}px`,
    top: `${vp.offsetY + NAME_BOX.y * s}px`,
    width: `${NAME_BOX.w * s}px`,
    height: `${NAME_BOX.h * s}px`,
    fontSize: `${48 * s}px`,
  });
}
function showNameInput(show) {
  if (show) {
    nameInput.value = ui.settings.name;
    placeNameInput();
    nameInput.style.display = 'block';
    nameInput.focus();
  } else {
    nameInput.blur();
    nameInput.style.display = 'none';
  }
}
nameInput.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') {
    ui.setName(nameInput.value);
    ui.go('intro', performance.now());
    showNameInput(false);
  }
});
nameInput.addEventListener('keyup', (e) => e.stopPropagation());

// ---------- fullscreen po prvním dotyku (pokud to neudělal manifest) ----------
let triedFullscreen = false;
canvas.addEventListener('pointerdown', (e) => {
  if (triedFullscreen || e.pointerType !== 'touch') return;
  triedFullscreen = true;
  const standalone = matchMedia('(display-mode: fullscreen)').matches;
  if (!standalone && document.fullscreenEnabled && !document.fullscreenElement) {
    document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
  }
});

// ---------- vstup ----------
const pt = { x: 0, y: 0 };
// Klávesnice (testování na PC): mezerník = skok, nebo hlavní tlačítko obrazovky.
const KEY_BUTTON = { intro: 'play', paused: 'resume', over: 'again' };
function keyboardAction(now) {
  if (ui.screen === 'playing') return ui.pointerDown(-100, -100, now) === 'jump';
  const id = KEY_BUTTON[ui.screen];
  if (id) {
    const b = layoutButtons(ui.screen, ui.viewW).find((x) => x.id === id);
    ui.pointerDown(b.x + b.w / 2, b.y + b.h / 2, now);
    ui.pointerUp();
  }
  return false;
}
// Požádat prohlížeč, ať data hry (rekord, jméno) při nedostatku místa nemaže.
let askedPersist = false;
function askPersist() {
  if (askedPersist) return;
  askedPersist = true;
  try { navigator.storage?.persist?.().catch(() => {}); } catch { /* nejde */ }
}

const input = createInput(canvas, (clientX, clientY) => {
  audio.unlock();
  askPersist();
  if (vp.portrait) return false;
  const now = performance.now();
  if (clientX < 0) return keyboardAction(now);
  toLogical(vp, clientX, clientY, pt);
  return ui.pointerDown(pt.x, pt.y, now) === 'jump';
});
input.attach();
window.addEventListener('pointerup', () => ui.pointerUp());
window.addEventListener('pointercancel', () => ui.pointerUp());
window.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { ui.pause(performance.now()); audio.stopMusic(); }
});

// ---------- velikost ----------
// Zámek na šířku až za běhu a jen když už zařízení na šířku je (nic se tím neotáčí).
// Vynucená orientace v manifestu zavírala aplikaci spuštěnou na výšku.
function lockLandscape() {
  try {
    if (!vp.portrait && screen.orientation && screen.orientation.lock) {
      screen.orientation.lock('landscape').catch(() => {});
    }
  } catch { /* zámek není k dispozici */ }
}
document.addEventListener('fullscreenchange', lockLandscape);

function resize() {
  vp = computeViewport(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
  game.viewW = vp.logicalW;
  world.w = vp.logicalW;
  ui.setViewWidth(vp.logicalW);
  lockLandscape();
  canvas.width = vp.canvasW;
  canvas.height = vp.canvasH;
  if (nameInput.style.display === 'block') placeNameInput();
  if (vp.portrait) ui.pause(performance.now());
  draw(performance.now());
}
window.addEventListener('resize', resize);

// ---------- kreslení ----------
const box = { x: 0, y: 0, w: 0, h: 0 };

function drawDebugBoxes() {
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

function draw(now) {
  const t = now / 1000;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // letterbox: nahoře barva nebe, dole barva cestičky
  ctx.fillStyle = vp.portrait ? '#CDEBFA' : world.palette.skyTop;
  ctx.fillRect(0, 0, canvas.width, canvas.height / 2);
  ctx.fillStyle = vp.portrait ? '#CDEBFA' : world.palette.path;
  ctx.fillRect(0, canvas.height / 2, canvas.width, canvas.height / 2);
  const s = vp.scale * vp.dpr;
  ctx.setTransform(s, 0, 0, s, vp.offsetX * vp.dpr, vp.offsetY * vp.dpr);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, vp.logicalW, LOGICAL_H);
  ctx.clip();

  if (vp.portrait) {
    // na výšku: výzva přes celou šířku displeje, vycentrovaná
    ctx.restore();
    const k = (vp.cssW / 760) * vp.dpr;
    ctx.setTransform(k, 0, 0, k, canvas.width / 2 - 640 * k, canvas.height / 2 - 400 * k);
    drawRotate(ctx, t);
    return;
  }
  hitFeedback(ui.screen === 'playing' ? (now - hitAt) / 1000 : -1, fx);
  ctx.translate(fx.dx, fx.dy);
  drawWorld(ctx, world);
  const best = storage.getBest();
  const onIntro = ui.screen === 'intro' || ui.screen === 'parent' || (ui.screen === 'bye' && ui.byeReturn === 'intro');
  if (onIntro) {
    drawIntro(ctx, ui, best, t);
  } else {
    for (const o of game.obstacles) if (o.active) drawObstacle(ctx, o);
    for (const p of game.pickups) if (p.active) drawPickup(ctx, p, game.time);
    drawGameCat(ctx, game, ui.skin, ui.settings.accessory);
    if (debugBoxes) drawDebugBoxes();
    if (ui.screen === 'playing') {
      drawHud(ctx, game, ui);
      drawLevelUp(ctx, (now - levelUpAt) / 1000, vp.logicalW / 2);
      if (tutorialActive(game.score, ui.settings.tutorialDone)) drawHint(ctx, hintFor(game), t, vp.logicalW / 2);
    }
  }
  ctx.restore();
  if (fx.flash > 0) drawHitFlash(fx.flash);

  if (ui.screen === 'paused' || ui.screen === 'over' || ui.screen === 'parent' || ui.screen === 'bye') {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = DIM;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(s, 0, 0, s, vp.offsetX * vp.dpr, vp.offsetY * vp.dpr);
    if (ui.screen === 'paused') drawPaused(ctx, ui);
    if (ui.screen === 'over') drawOver(ctx, ui, game, best, now);
    if (ui.screen === 'parent') drawParent(ctx, ui);
    if (ui.screen === 'bye') drawBye(ctx, ui, t);
  }
  drawEffects(ctx, effects);
}

// Zčervenání okrajů obrazovky při zásahu (přes celé plátno).
function drawHitFlash(alpha) {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const w = canvas.width;
  const h = canvas.height;
  const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.hypot(w, h) / 2);
  g.addColorStop(0, 'rgba(255,90,119,0)');
  g.addColorStop(1, `rgba(255,90,119,${alpha})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ---------- smyčka ----------
let levelUpAt = -1e9;
let hitAt = -1e9;
const fx = { dx: 0, dy: 0, flash: 0 };
function handleEvents(now) {
  for (const e of game.events) {
    if (e === 'levelUp') { levelUpAt = now; audio.play('levelUp'); }
    if (e === 'jump' || e === 'fish' || e === 'hit') audio.play(e);
    if (e === 'hit' || e === 'over') vibrateFor(e);
    if (e === 'hit') hitAt = now;
    if (e === 'fish') spawnSparkles(effects, game.pickupAt.x, game.pickupAt.y);
    if (e === 'heart' || e === 'heartBonus') {
      audio.play('heart');
      spawnSparkles(effects, game.pickupAt.x, game.pickupAt.y, '#FF8FA5');
    }
    if (e === 'over') {
      audio.stopMusic();
      const record = game.score > storage.getBest();
      storage.setBest(game.score);
      const before = ui.settings.totalFish;
      storage.saveSettings({ totalFish: before + game.fish });
      ui.settings = storage.getSettings();
      const unlocked = newlyUnlocked(before, ui.settings.totalFish);
      ui.gameOver(now, record, unlocked);
      if (unlocked) audio.play('heart');
      if (record) {
        spawnConfetti(effects, vp.logicalW);
        audio.play('record');
      }
    }
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min((now - last) / 1000, CONFIG.maxDt);
  last = now;
  ui.update(now);
  if (ui.screen === 'playing' && !vp.portrait) {
    stepGame(game, dt, input.held, input.consumePress());
    if (!ui.settings.tutorialDone && !tutorialActive(game.score, false)) {
      storage.saveSettings({ tutorialDone: true }); // limit dosažen → nápověda už nikdy
      ui.settings = storage.getSettings();
    }
    audio.setTempo(tempoForSpeed(game.speed));
    handleEvents(now);
  } else {
    input.clearPress();
  }
  updateEffects(effects, dt);
  const speed = ui.screen === 'playing' ? game.speed : ui.screen === 'intro' ? 40 : 0;
  updateWorld(world, dt, speed, fastDays ? (now / 1000) * 60 : game.score);
  draw(now);
  requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
if (!params.has('nosw')) startAutoUpdate(() => ui.screen);

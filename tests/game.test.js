import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { createGame, stepGame, resetGame } from '../src/game.js';
import { makeObstacle } from '../src/obstacles.js';

const noSpawn = () => 0.999; // RNG pro testy
const dt = 1 / 60;

// Položí velké avokádo přímo pod kočku.
function obstacleOnCat(game) {
  const o = game.obstacles[0];
  makeObstacle('avo-big', null, o);
  o.active = true;
  o.x = CONFIG.cat.x - o.w / 2;
  return o;
}

function clearObstacles(game) {
  for (const o of game.obstacles) o.active = false;
}

test('dlouhý snímek se ořízne na maxDt', () => {
  const a = createGame(noSpawn);
  const b = createGame(noSpawn);
  stepGame(a, 0.5, false, false);
  stepGame(b, CONFIG.maxDt, false, false);
  assert.equal(a.distance, b.distance);
  assert.equal(a.time, b.time);
});

test('skóre = vzdálenost + rybičky', () => {
  const g = createGame(noSpawn);
  for (let i = 0; i < 120; i++) { stepGame(g, dt, false, false); clearObstacles(g); }
  g.fish = 3;
  stepGame(g, dt, false, false);
  assert.equal(g.score, Math.floor(g.distance * CONFIG.score.pointsPerPx) + 3 * CONFIG.score.fish);
});

// Nastaví skóre přes vzdálenost (bez rybiček) a nechá hru běžet bez překážek.
function runAtScore(g, score, seconds) {
  g.distance = score / CONFIG.score.pointsPerPx;
  for (let i = 0; i < seconds * 60; i++) { clearObstacles(g); g.invuln = 1; stepGame(g, dt, false, false); }
}

test('v rámci úrovně je rychlost stálá', () => {
  const g = createGame(noSpawn);
  runAtScore(g, 10, 1);
  assert.equal(g.speed, CONFIG.speed.start);
  assert.equal(g.level, 0);
});

test('po každých levelEvery bodech hra zrychlí o krok a ohlásí to jednou', () => {
  const sp = CONFIG.speed;
  const g = createGame(noSpawn);
  runAtScore(g, 10, 0.2);
  g.distance = (sp.levelEvery + 1) / CONFIG.score.pointsPerPx;
  clearObstacles(g);
  stepGame(g, dt, false, false);
  assert.ok(g.events.includes('levelUp'));
  assert.equal(g.level, 1);
  const right = g.speed;
  assert.ok(right < sp.start + sp.levelStep, 'zrychlení je plynulé, ne skokové');
  let ups = 0;
  for (let i = 0; i < 60 * (sp.rampTime + 0.5); i++) {
    clearObstacles(g);
    stepGame(g, dt, false, false);
    if (g.events.includes('levelUp')) ups++;
  }
  assert.equal(ups, 0);
  assert.equal(g.speed, sp.start + sp.levelStep);
});

test('rychlost nepřekročí strop a nad ním už nehlásí další úrovně', () => {
  const g = createGame(noSpawn);
  runAtScore(g, 1e6, 20); // rozjezd o všechny úrovně najednou trvá déle
  assert.equal(g.speed, CONFIG.speed.max);
  let ups = 0;
  for (let k = 1; k < 5; k++) {
    g.distance = (1e6 + k * CONFIG.speed.levelEvery) / CONFIG.score.pointsPerPx;
    clearObstacles(g);
    stepGame(g, dt, false, false);
    if (g.events.includes('levelUp')) ups++;
  }
  assert.equal(ups, 0);
});

test('zásah ubere život a dá dočasnou nezranitelnost', () => {
  const g = createGame(noSpawn);
  obstacleOnCat(g);
  stepGame(g, dt, false, false);
  assert.equal(g.lives, CONFIG.lives.start - 1);
  assert.ok(g.events.includes('hit'));
  assert.ok(g.invuln > 1.9);
  for (let i = 0; i < 60; i++) { obstacleOnCat(g); stepGame(g, dt, false, false); }
  assert.equal(g.lives, CONFIG.lives.start - 1, 'během nezranitelnosti se život neubírá');
  for (let i = 0; i < 70; i++) { clearObstacles(g); stepGame(g, dt, false, false); }
  obstacleOnCat(g);
  stepGame(g, dt, false, false);
  assert.equal(g.lives, CONFIG.lives.start - 2);
});

test('bez životů konec hry, událost over jen jednou', () => {
  const g = createGame(noSpawn);
  g.lives = 1;
  obstacleOnCat(g);
  stepGame(g, dt, false, false);
  assert.equal(g.status, 'over');
  assert.ok(g.events.includes('over'));
  const snapshot = { score: g.score, distance: g.distance };
  stepGame(g, dt, false, false);
  assert.equal(g.events.includes('over'), false);
  assert.deepEqual({ score: g.score, distance: g.distance }, snapshot);
});

test('skok vyvolá událost jump', () => {
  const g = createGame(noSpawn);
  stepGame(g, dt, true, true);
  assert.ok(g.events.includes('jump'));
});

test('resetGame vrátí hru na začátek', () => {
  const g = createGame(noSpawn);
  g.lives = 1;
  obstacleOnCat(g);
  stepGame(g, dt, false, false);
  resetGame(g);
  assert.equal(g.status, 'playing');
  assert.equal(g.lives, CONFIG.lives.start);
  assert.equal(g.score, 0);
  assert.equal(g.obstacles.some((o) => o.active), false);
});

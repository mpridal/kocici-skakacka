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

test('rychlost roste se skóre a nepřekročí strop', () => {
  const g = createGame(noSpawn);
  stepGame(g, dt, false, false);
  const s0 = g.speed;
  g.distance = 1e7;
  stepGame(g, dt, false, false);
  assert.ok(g.speed > s0);
  assert.equal(g.speed, CONFIG.speed.max);
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

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { createCat, updateCat, catHitbox, jumpAirtime } from '../src/cat.js';
import { overlaps } from '../src/collision.js';
import {
  createObstaclePool, createSpawner, obstacleHitbox, makeObstacle, randomBlink, updateBlink, eyesClosed,
} from '../src/obstacles.js';

function seeded(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Projede spawner a vrátí všechny vzniklé překážky v pořadí (kopie).
function runSpawner(seed, speed, score, spawns) {
  const pool = createObstaclePool();
  const spawner = createSpawner(seeded(seed));
  const seen = [];
  const dt = 1 / 20;
  for (let i = 0; i < 400000 && seen.length < spawns; i++) {
    spawner.update(pool, dt, speed, score);
    for (const o of pool) {
      if (o.active && !o._seen) { o._seen = true; seen.push({ ...o }); }
    }
    for (const o of pool) if (!o.active) o._seen = false;
  }
  return seen;
}

const speeds = [CONFIG.speed.start, (CONFIG.speed.start + CONFIG.speed.max) / 2, CONFIG.speed.max];

test('mezi překážkami je vždy dost místa na přistání a reakci', () => {
  const need = jumpAirtime(CONFIG.cat.maxHoldTime) + CONFIG.obstacles.reactionTime;
  for (let seed = 1; seed <= 20; seed++) {
    for (const speed of speeds) {
      const list = runSpawner(seed, speed, 1000, 2000);
      assert.equal(list.length, 2000);
      for (let i = 1; i < list.length; i++) {
        const gapPx = list[i].spawnDistance - (list[i - 1].spawnDistance + list[i - 1].w);
        assert.ok(gapPx / speed >= need - 1e-9, `seed ${seed} speed ${speed} i ${i}: ${gapPx / speed} < ${need}`);
      }
    }
  }
});

test('veverky až od daného skóre', () => {
  const before = runSpawner(3, CONFIG.speed.start, CONFIG.obstacles.squirrelFromScore - 1, 2000);
  assert.equal(before.some((o) => o.kind === 'squirrel'), false);
  const after = runSpawner(3, CONFIG.speed.start, CONFIG.obstacles.squirrelFromScore, 2000);
  assert.equal(after.some((o) => o.kind === 'squirrel'), true);
  for (const lane of ['low', 'mid', 'high']) {
    assert.ok(after.some((o) => o.lane === lane), `chybí dráha ${lane}`);
  }
});

// Existuje okamžik odrazu, při kterém kočka překážku mine?
function canPass(obstacle, holdFor, speed) {
  const dt = 1 / 120;
  const cb = {};
  const ob = {};
  for (let start = 0; start < 3; start += 0.01) {
    const cat = createCat();
    const o = { ...obstacle, x: CONFIG.cat.x + 600 };
    let hit = false;
    for (let t = 0; t < 4 && !hit; t += dt) {
      const jumpNow = t >= start && t < start + dt;
      const held = t >= start && t < start + holdFor;
      updateCat(cat, dt, held, jumpNow);
      o.x -= speed * dt;
      if (overlaps(catHitbox(cat, cb), obstacleHitbox(o, ob))) hit = true;
    }
    if (!hit) return true;
  }
  return false;
}

function hitsWhenRunning(obstacle, speed) {
  const dt = 1 / 120;
  const cat = createCat();
  const o = { ...obstacle, x: CONFIG.cat.x + 600 };
  for (let t = 0; t < 4; t += dt) {
    updateCat(cat, dt, false, false);
    o.x -= speed * dt;
    if (overlaps(catHitbox(cat, {}), obstacleHitbox(o, {}))) return true;
  }
  return false;
}

test('každá překážka je zvládnutelná a dráhy veverek fungují jak mají', () => {
  const tap = 0.05;
  const full = CONFIG.cat.maxHoldTime;
  for (const speed of speeds) {
    const small = makeObstacle('avo-small', null);
    const big = makeObstacle('avo-big', null);
    const pair = makeObstacle('avo-pair', null);
    assert.ok(canPass(small, tap, speed), `malé avokádo ťuknutím @${speed}`);
    assert.ok(canPass(big, full, speed), `velké avokádo @${speed}`);
    assert.ok(canPass(pair, full, speed), `dvojice @${speed}`);
    assert.ok(hitsWhenRunning(small, speed), 'malé avokádo se nedá proběhnout');

    const low = makeObstacle('squirrel', 'low');
    const mid = makeObstacle('squirrel', 'mid');
    const high = makeObstacle('squirrel', 'high');
    assert.ok(hitsWhenRunning(low, speed), 'nízká veverka se musí přeskočit');
    assert.ok(canPass(low, tap, speed), `nízká veverka krátkým skokem @${speed}`);
    assert.ok(hitsWhenRunning(mid, speed), 'pod střední veverkou nejde proběhnout');
    // Na startovní rychlosti je potřeba vyšší skok; při vyšší rychlosti stačí i kratší (shovívavost).
    if (speed === CONFIG.speed.start) {
      assert.equal(canPass(mid, tap, speed), false, `střední veverka nesmí jít krátkým skokem @${speed}`);
    }
    assert.ok(canPass(mid, full, speed), `střední veverka vyšším skokem @${speed}`);
    assert.equal(hitsWhenRunning(high, speed), false, 'pod vysokou veverkou jde proběhnout');
  }
});

test('avokáda mrkají každé samo a oči zavřou na 0,13 s', () => {
  const rng = seeded(42);
  const a = makeObstacle('avo-big', null);
  const b = makeObstacle('avo-big', null);
  a.blinkTimer = randomBlink(rng);
  b.blinkTimer = randomBlink(rng);
  const dt = 1 / 120;
  const closedA = [];
  const closedB = [];
  let run = 0;
  let longest = 0;
  for (let i = 0; i < 120 * 20; i++) {
    updateBlink(a, dt, rng);
    updateBlink(b, dt, rng);
    closedA.push(eyesClosed(a));
    closedB.push(eyesClosed(b));
    run = eyesClosed(a) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  assert.ok(closedA.some(Boolean) && closedB.some(Boolean), 'obě avokáda mrknou');
  assert.notDeepEqual(closedA, closedB, 'nemrkají současně');
  assert.ok(Math.abs(longest * dt - 0.13) <= dt + 1e-9, `zavřené ${longest * dt}`);
});

test('plný pool nealokuje a spawn počká', () => {
  const pool = createObstaclePool(16);
  for (const o of pool) { o.active = true; o.x = 5000; }
  const spawner = createSpawner(seeded(1));
  spawner.update(pool, 10, 330, 0);
  assert.equal(pool.length, 16);
  pool[0].active = false;
  spawner.update(pool, 1 / 60, 330, 0);
  assert.equal(pool[0].active, true);
});

test('dvojice avokád se objevují až od pairFromScore bodů', () => {
  const before = runSpawner(5, CONFIG.speed.start, CONFIG.obstacles.pairFromScore - 1, 2000);
  assert.equal(before.some((o) => o.kind === 'avo-pair'), false);
  const after = runSpawner(5, CONFIG.speed.start, CONFIG.obstacles.pairFromScore, 2000);
  assert.equal(after.some((o) => o.kind === 'avo-pair'), true);
});

test('každý herní den jsou překážky hustší, ale pořád přeskočitelné', () => {
  const day = CONFIG.dayNight.cyclePoints;
  const speed = CONFIG.speed.start;
  const need = jumpAirtime(CONFIG.cat.maxHoldTime) + CONFIG.obstacles.reactionTime;
  const avgGap = (score) => {
    const list = runSpawner(9, speed, score, 1500);
    let sum = 0;
    for (let i = 1; i < list.length; i++) {
      const gap = (list[i].spawnDistance - (list[i - 1].spawnDistance + list[i - 1].w)) / speed;
      assert.ok(gap >= need - 1e-9, `den ${Math.floor(score / day)}: mezera ${gap} < ${need}`);
      sum += gap;
    }
    return sum / (list.length - 1);
  };
  const d0 = avgGap(10);
  const d1 = avgGap(day + 10);
  const d3 = avgGap(3 * day + 10);
  const d20 = avgGap(20 * day + 10);
  assert.ok(d1 < d0 - 0.05, `den 1 (${d1}) hustší než den 0 (${d0})`);
  assert.ok(d3 < d1, `den 3 (${d3}) hustší než den 1 (${d1})`);
  assert.ok(d20 >= need, 'ani po mnoha dnech nejsou mezery pod minimem');
});

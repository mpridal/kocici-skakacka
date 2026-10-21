import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { createGame, stepGame } from '../src/game.js';
import { jumpPeak } from '../src/cat.js';
import { overlaps } from '../src/collision.js';
import { obstacleHitbox } from '../src/obstacles.js';
import { pickupBox } from '../src/pickups.js';

const dt = 1 / 60;

function seeded(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function placeOnCat(game, kind) {
  for (const o of game.obstacles) o.active = false;
  for (const p of game.pickups) p.active = false;
  const p = game.pickups[0];
  p.active = true;
  p.kind = kind;
  p.x = CONFIG.cat.x;
  p.y = 50;
  return p;
}

test('rybička: +1 rybička, +10 bodů, událost fish', () => {
  const g = createGame(() => 0.999);
  stepGame(g, dt, false, false);
  placeOnCat(g, 'fish');
  const before = g.score;
  stepGame(g, dt, false, false);
  assert.equal(g.fish, 1);
  assert.ok(g.events.includes('fish'));
  assert.ok(g.score - before >= CONFIG.score.fish);
  assert.equal(g.pickups[0].active, false);
});

test('srdíčko přidá život, při plných životech dá body', () => {
  const g = createGame(() => 0.999);
  placeOnCat(g, 'heart');
  stepGame(g, dt, false, false);
  assert.equal(g.lives, CONFIG.lives.start + 1);
  assert.ok(g.events.includes('heart'));

  g.lives = CONFIG.lives.max;
  placeOnCat(g, 'heart');
  const before = g.score;
  stepGame(g, dt, false, false);
  assert.equal(g.lives, CONFIG.lives.max);
  assert.ok(g.events.includes('heartBonus'));
  assert.ok(g.score - before >= CONFIG.score.heartBonus);
});

test('bonusy jsou dosažitelné skokem a nikdy nejsou v překážce', () => {
  const peak = jumpPeak(CONFIG.cat.maxHoldTime);
  let fishSeen = 0;
  let heartSeen = 0;
  for (let seed = 1; seed <= 10; seed++) {
    const g = createGame(seeded(seed));
    g.lives = 1e9; // ať hra neskončí
    const pb = {};
    const ob = {};
    for (let i = 0; i < 60 * 300; i++) {
      stepGame(g, dt, false, false);
      g.invuln = 10;
      for (const p of g.pickups) {
        if (!p.active) continue;
        if (p._checked) continue;
        p._checked = true;
        if (p.kind === 'fish') fishSeen++; else heartSeen++;
        assert.ok(p.y >= 40 && p.y <= peak, `výška ${p.y} mimo 40–${peak}`);
        pickupBox(p, pb);
        for (const o of g.obstacles) {
          if (o.active) assert.equal(overlaps(pb, obstacleHitbox(o, ob)), false, 'bonus v překážce');
        }
      }
      for (const p of g.pickups) if (!p.active) p._checked = false;
    }
  }
  assert.ok(fishSeen > 50, `rybiček ${fishSeen}`);
  assert.ok(heartSeen > 0, 'aspoň jedno srdíčko');
});

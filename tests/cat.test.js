import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { createCat, updateCat } from '../src/cat.js';

// Odsimuluje jeden skok: prst držený `holdFor` sekund. Vrátí max. výšku.
function jumpHeight(holdFor, dt = 1 / 60) {
  const cat = createCat();
  const holdFrames = Math.round(holdFor / dt);
  let maxY = 0;
  updateCat(cat, dt, true, true);
  for (let i = 1; i < 2000 && !cat.onGround; i++) {
    updateCat(cat, dt, i < holdFrames, false);
    maxY = Math.max(maxY, cat.y);
  }
  return maxY;
}

test('stisk na zemi odstartuje skok', () => {
  const cat = createCat();
  updateCat(cat, 1 / 60, true, true);
  assert.equal(cat.onGround, false);
  assert.ok(cat.vy > 0);
  assert.ok(cat.y > 0);
});

test('delší držení = vyšší skok, ale jen do maxHoldTime', () => {
  const tap = jumpHeight(0.05);
  const full = jumpHeight(CONFIG.cat.maxHoldTime);
  const long = jumpHeight(1);
  assert.ok(full > tap + 40, `full ${full} vs tap ${tap}`);
  assert.ok(Math.abs(long - full) < 2, `long ${long} vs full ${full}`);
});

test('výšky skoku odpovídají startovní konfiguraci', () => {
  const tap = jumpHeight(0.05);
  const full = jumpHeight(CONFIG.cat.maxHoldTime);
  assert.ok(tap >= 150 && tap <= 190, `tap ${tap}`);
  assert.ok(full >= 230 && full <= 300, `full ${full}`);
});

test('ve vzduchu nejde skočit znovu, po dopadu ano', () => {
  const cat = createCat();
  updateCat(cat, 1 / 60, true, true);
  const vyBefore = cat.vy;
  updateCat(cat, 1 / 60, true, true);
  assert.ok(cat.vy < vyBefore, 'druhý stisk ve vzduchu nesmí přidat rychlost');
  for (let i = 0; i < 300 && !cat.onGround; i++) updateCat(cat, 1 / 60, false, false);
  assert.equal(cat.onGround, true);
  assert.equal(cat.y, 0);
  updateCat(cat, 1 / 60, true, true);
  assert.equal(cat.onGround, false);
});

test('stejná výška skoku na 60 i 120 Hz', () => {
  for (const hold of [0.05, 0.3]) {
    const a = jumpHeight(hold, 1 / 60);
    const b = jumpHeight(hold, 1 / 120);
    assert.ok(Math.abs(a - b) <= 2, `hold ${hold}: ${a} vs ${b}`);
  }
});

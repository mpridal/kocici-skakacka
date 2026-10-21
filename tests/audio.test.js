import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { tempoForSpeed, MAX_TEMPO } from '../src/audio.js';

test('na startovní rychlosti hraje hudba původním tempem', () => {
  assert.equal(tempoForSpeed(CONFIG.speed.start), 1);
});

test('na nejvyšší rychlosti je hudba asi o 30 % rychlejší a víc ne', () => {
  assert.ok(Math.abs(tempoForSpeed(CONFIG.speed.max) - MAX_TEMPO) < 1e-9);
  assert.ok(MAX_TEMPO >= 1.25 && MAX_TEMPO <= 1.35);
  assert.equal(tempoForSpeed(CONFIG.speed.max + 500), MAX_TEMPO);
  assert.equal(tempoForSpeed(0), 1);
});

test('tempo roste spolu s rychlostí', () => {
  const mid = (CONFIG.speed.start + CONFIG.speed.max) / 2;
  const t = tempoForSpeed(mid);
  assert.ok(t > 1 && t < MAX_TEMPO);
});

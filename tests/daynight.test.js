import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { dayPhase, skyPalette, phaseName } from '../src/daynight.js';

const cycle = CONFIG.dayNight.cyclePoints;
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = (hex) => { const [r, g, b] = rgb(hex); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const COLOR_KEYS = ['skyTop', 'skyBottom', 'hillFar', 'hillNear', 'grass', 'path'];

test('den → večer → noc → ráno → den, cyklus se opakuje', () => {
  const order = [];
  for (let s = 0; s <= cycle; s += 5) {
    const n = phaseName(dayPhase(s));
    if (order[order.length - 1] !== n) order.push(n);
  }
  assert.deepEqual(order, ['day', 'evening', 'night', 'morning', 'day']);
  assert.equal(dayPhase(cycle), dayPhase(0));
  assert.equal(dayPhase(cycle * 3 + 123), dayPhase(123));
});

test('denní paleta odpovídá návrhu', () => {
  const p = skyPalette(dayPhase(0), {});
  assert.equal(p.skyTop, '#CDEBFA');
  assert.equal(p.hillFar, '#D5EFCB');
  assert.equal(p.hillNear, '#AEDDA2');
  assert.equal(p.grass, '#92CD7E');
  assert.equal(p.path, '#F7E6C4');
  assert.equal(p.starsAlpha, 0);
});

test('přechody jsou plynulé', () => {
  const a = {};
  const b = {};
  for (let s = 0; s < cycle * 2; s++) {
    skyPalette(dayPhase(s), a);
    skyPalette(dayPhase(s + 1), b);
    for (const k of COLOR_KEYS) {
      const ca = rgb(a[k]);
      const cb = rgb(b[k]);
      for (let i = 0; i < 3; i++) assert.ok(Math.abs(ca[i] - cb[i]) <= 8, `${k} skok u skóre ${s}`);
    }
  }
});

test('noc je jemná a s hvězdami', () => {
  let darkest = Infinity;
  const p = {};
  for (let s = 0; s < cycle; s++) {
    skyPalette(dayPhase(s), p);
    darkest = Math.min(darkest, lum(p.skyTop));
    if (phaseName(dayPhase(s)) === 'night') assert.ok(p.starsAlpha > 0.5);
  }
  assert.ok(darkest >= lum('#2E3A6B'), 'noční nebe nesmí být tmavší než #2E3A6B');
  const mid = Math.round(cycle * 0.72);
  assert.equal(skyPalette(dayPhase(mid), {}).starsAlpha, 1);
});

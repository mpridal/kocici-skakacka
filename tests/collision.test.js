import { test } from 'node:test';
import assert from 'node:assert/strict';
import { overlaps, shrinkBox } from '../src/collision.js';

test('dotýkající se hrany se nepřekrývají', () => {
  assert.equal(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 10, y: 0, w: 10, h: 10 }), false);
  assert.equal(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 0, y: 10, w: 10, h: 10 }), false);
});

test('překryv o 1 px je kolize', () => {
  assert.equal(overlaps({ x: 0, y: 0, w: 10, h: 10 }, { x: 9, y: 9, w: 10, h: 10 }), true);
});

test('shrinkBox zmenší box se středem na místě', () => {
  const b = shrinkBox({ x: 0, y: 0, w: 100, h: 40 }, 0.25, 0.5, {});
  assert.deepEqual(b, { x: 12.5, y: 10, w: 75, h: 20 });
});

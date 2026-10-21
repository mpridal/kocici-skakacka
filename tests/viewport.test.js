import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeViewport, toLogical } from '../src/viewport.js';

test('přesný poměr 16:9 bez letterboxu', () => {
  const vp = computeViewport(1280, 720, 1);
  assert.equal(vp.scale, 1);
  assert.equal(vp.offsetX, 0);
  assert.equal(vp.offsetY, 0);
  assert.equal(vp.portrait, false);
});

test('užší displej 5:3 se vycentruje svisle a respektuje DPR', () => {
  const vp = computeViewport(2000, 1200, 2);
  const scale = 2000 / 1280;
  assert.ok(Math.abs(vp.scale - scale) < 1e-9);
  assert.equal(vp.offsetX, 0);
  assert.ok(Math.abs(vp.offsetY - (1200 - 720 * scale) / 2) < 1e-9);
  assert.equal(vp.canvasW, 4000);
  assert.equal(vp.canvasH, 2400);
});

test('tablet na výšku je rozpoznán', () => {
  assert.equal(computeViewport(800, 1280, 1).portrait, true);
});

test('střed obrazovky odpovídá středu logické plochy', () => {
  for (const [w, h] of [[1280, 720], [2000, 1200]]) {
    const vp = computeViewport(w, h, 1);
    const p = toLogical(vp, w / 2, h / 2);
    assert.ok(Math.abs(p.x - 640) < 1e-9);
    assert.ok(Math.abs(p.y - 360) < 1e-9);
  }
});

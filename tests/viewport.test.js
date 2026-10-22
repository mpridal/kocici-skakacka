import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeViewport, toLogical, MAX_LOGICAL_W } from '../src/viewport.js';

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

test('telefon 20:9 využije celou šířku (širší logická plocha, bez rámečku)', () => {
  const vp = computeViewport(2400, 1080, 1);
  assert.equal(vp.logicalW, 1600);
  assert.ok(Math.abs(vp.scale - 1.5) < 1e-9);
  assert.equal(vp.offsetX, 0);
  assert.equal(vp.offsetY, 0);
});

test('poměr 16:9 a užší zůstává 1280 široký', () => {
  assert.equal(computeViewport(1280, 720, 1).logicalW, 1280);
  assert.equal(computeViewport(2000, 1200, 1).logicalW, 1280);
});

test('extrémně široký displej má strop šířky a zbytek vycentruje', () => {
  const vp = computeViewport(3000, 1000, 1);
  assert.equal(vp.logicalW, MAX_LOGICAL_W);
  assert.ok(vp.offsetX > 0);
});

test('rozlišení plátna je omezené (šetří výkon slabších telefonů)', () => {
  const vp = computeViewport(915, 412, 2.75);
  assert.equal(vp.dpr, 2);
  assert.equal(vp.canvasW, 1830);
  assert.equal(computeViewport(1280, 800, 1).dpr, 1);
});

test('výřez kamery / zaoblené rohy se převedou na logické okraje', () => {
  const vp = computeViewport(2400, 1080, 1, { l: 90, r: 0, t: 0, b: 0 });
  assert.ok(Math.abs(vp.safeL - 60) < 1e-9, `vlevo ${vp.safeL}`); // 90 css px / měřítko 1,5
  assert.equal(vp.safeR, 0);
  const none = computeViewport(1280, 720, 1);
  assert.equal(none.safeL, 0);
});

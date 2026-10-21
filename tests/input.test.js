import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPointerState, reducePointer } from '../src/input.js';

test('první prst dolů vytvoří jeden stisk a drží', () => {
  const s = createPointerState();
  reducePointer(s, 'down', 1, true);
  assert.equal(s.held, true);
  assert.equal(s.pressCount, 1);
});

test('dva prsty, jeden zvednut → pořád drženo', () => {
  const s = createPointerState();
  reducePointer(s, 'down', 1, true);
  reducePointer(s, 'down', 2, true);
  reducePointer(s, 'up', 1);
  assert.equal(s.held, true);
  reducePointer(s, 'up', 2);
  assert.equal(s.held, false);
});

test('druhý prst během držení nevytvoří nový stisk', () => {
  const s = createPointerState();
  reducePointer(s, 'down', 1, true);
  reducePointer(s, 'down', 2, true);
  assert.equal(s.pressCount, 1);
});

test('opakovaný keydown (autorepeat) stejné klávesy nevytvoří nový stisk', () => {
  const s = createPointerState();
  reducePointer(s, 'down', 'key', true);
  reducePointer(s, 'down', 'key', true);
  assert.equal(s.pressCount, 1);
});

test('ťuk, který spotřebuje tlačítko, neskáče ani nedrží', () => {
  const s = createPointerState();
  reducePointer(s, 'down', 1, false);
  assert.equal(s.held, false);
  assert.equal(s.pressCount, 0);
});

test('cancel uvolní prst', () => {
  const s = createPointerState();
  reducePointer(s, 'down', 5, true);
  reducePointer(s, 'cancel', 5);
  assert.equal(s.held, false);
});

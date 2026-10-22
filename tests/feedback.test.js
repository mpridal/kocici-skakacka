import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hitFeedback, SHAKE_TIME, FLASH_TIME } from '../src/feedback.js';

test('hned po zásahu se obraz třese a okraje zčervenají', () => {
  const f = hitFeedback(0.02, {});
  assert.ok(Math.hypot(f.dx, f.dy) > 2, 'obraz se hýbe');
  assert.ok(f.flash > 0.3, 'okraje jsou výrazně červené');
});

test('efekt plynule zmizí a pak je obraz v klidu', () => {
  const late = hitFeedback(Math.max(SHAKE_TIME, FLASH_TIME) + 0.01, {});
  assert.deepEqual(late, { dx: 0, dy: 0, flash: 0 });
  assert.deepEqual(hitFeedback(-1, {}), { dx: 0, dy: 0, flash: 0 }, 'bez zásahu nic');
  let maxShake = 0;
  for (let t = 0; t < SHAKE_TIME; t += 0.005) {
    const f = hitFeedback(t, {});
    maxShake = Math.max(maxShake, Math.abs(f.dx), Math.abs(f.dy));
  }
  assert.ok(maxShake <= 12, `zátřes je jemný (max ${maxShake})`);
  assert.ok(hitFeedback(FLASH_TIME * 0.8, {}).flash < hitFeedback(FLASH_TIME * 0.2, {}).flash, 'červená slábne');
});

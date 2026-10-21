import { test } from 'node:test';
import assert from 'node:assert/strict';
import { vibrateFor, PATTERNS } from '../src/haptics.js';

function fakeNav() {
  const calls = [];
  return { calls, vibrate: (p) => { calls.push(p); return true; } };
}

test('ztráta života krátce zavibruje, konec hry delší vibrací', () => {
  const nav = fakeNav();
  vibrateFor('hit', nav);
  vibrateFor('over', nav);
  assert.deepEqual(nav.calls, [PATTERNS.hit, PATTERNS.over]);
  assert.ok(PATTERNS.over.reduce((a, b) => a + b, 0) > PATTERNS.hit.reduce((a, b) => a + b, 0));
});

test('ostatní události nevibrují', () => {
  const nav = fakeNav();
  for (const e of ['jump', 'fish', 'heart', 'levelUp']) vibrateFor(e, nav);
  assert.deepEqual(nav.calls, []);
});

test('zařízení bez vibrace ani chyba prohlížeče hru neshodí', () => {
  assert.doesNotThrow(() => vibrateFor('hit', {}));
  assert.doesNotThrow(() => vibrateFor('hit', undefined));
  assert.doesNotThrow(() => vibrateFor('hit', { vibrate() { throw new Error('blocked'); } }));
});

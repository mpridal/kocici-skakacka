import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findNameLeaks } from '../tools/check-names.mjs';

const words = ['Ema'];

test('najde jméno bez ohledu na velikost písmen', () => {
  const leaks = findNameLeaks([{ path: 'a.js', text: 'const x = "EMA";' }], words);
  assert.equal(leaks.length, 1);
  assert.equal(leaks[0].path, 'a.js');
  assert.equal(leaks[0].line, 1);
});

test('najde jméno i když se liší diakritikou', () => {
  const leaks = findNameLeaks([{ path: 'b.md', text: 'ahoj\nÉmo, pojď' }], ['Emo']);
  assert.equal(leaks.length, 1);
  assert.equal(leaks[0].line, 2);
});

test('čistý soubor nemá žádné nálezy', () => {
  assert.deepEqual(findNameLeaks([{ path: 'c.js', text: 'kočička skáče' }], words), []);
});

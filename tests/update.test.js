import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { shouldApplyUpdate } from '../src/update.js';

test('nová verze se použije jen na úvodní obrazovce', () => {
  assert.equal(shouldApplyUpdate('intro', true, true), true);
  for (const screen of ['playing', 'paused', 'over', 'parent', 'bye']) {
    assert.equal(shouldApplyUpdate(screen, true, true), false, screen);
  }
});

test('bez čekající verze nebo při první instalaci se nic nepřepíná', () => {
  assert.equal(shouldApplyUpdate('intro', false, true), false);
  assert.equal(shouldApplyUpdate('intro', true, false), false);
});

test('service worker umí na požádání převzít řízení (skipWaiting)', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  assert.match(sw, /addEventListener\('message'[\s\S]*skipWaiting\(\)/);
});

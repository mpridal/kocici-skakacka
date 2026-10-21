import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createStorage } from '../src/storage.js';

function memoryBackend(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    data,
  };
}

const DEFAULTS = { skin: 'mourek', muted: false, name: '' };

test('prázdné úložiště vrací výchozí hodnoty', () => {
  const s = createStorage(memoryBackend());
  assert.equal(s.getBest(), 0);
  assert.deepEqual(s.getSettings(), DEFAULTS);
});

test('rekord se uloží a nikdy nesníží', () => {
  const backend = memoryBackend();
  const s = createStorage(backend);
  s.setBest(1240);
  assert.equal(s.getBest(), 1240);
  s.setBest(500);
  assert.equal(s.getBest(), 1240);
  assert.equal(createStorage(backend).getBest(), 1240);
});

test('uložení jména zachová ostatní nastavení a jméno ořízne', () => {
  const s = createStorage(memoryBackend());
  s.saveSettings({ skin: 'zrzka' });
  s.saveSettings({ name: '  Ema  ' });
  assert.deepEqual(s.getSettings(), { skin: 'zrzka', muted: false, name: 'Ema' });
  s.saveSettings({ name: 'Emanuela-Kristýna' });
  assert.equal(s.getSettings().name, 'Emanuela-Kri');
});

test('úložiště, které vyhazuje výjimky, hru neshodí', () => {
  const s = createStorage({
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  });
  assert.equal(s.getBest(), 0);
  assert.deepEqual(s.getSettings(), DEFAULTS);
  assert.doesNotThrow(() => s.setBest(10));
  assert.doesNotThrow(() => s.saveSettings({ muted: true }));
  assert.equal(s.getBest(), 10);
  assert.equal(s.getSettings().muted, true);
});

test('poškozená data vedou na výchozí hodnoty', () => {
  assert.deepEqual(createStorage(memoryBackend({ 'kocka.v1': '{nejde' })).getSettings(), DEFAULTS);
  const bad = createStorage(memoryBackend({ 'kocka.v1': JSON.stringify({ best: -5, skin: 'drak', muted: 'ano', name: 42 }) }));
  assert.equal(bad.getBest(), 0);
  assert.deepEqual(bad.getSettings(), DEFAULTS);
});

test('bez backendu funguje jen v paměti', () => {
  const s = createStorage(undefined);
  s.setBest(7);
  assert.equal(s.getBest(), 7);
});

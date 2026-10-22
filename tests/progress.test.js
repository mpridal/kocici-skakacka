import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../src/game.js';
import { createStorage } from '../src/storage.js';
import { creditRun } from '../src/progress.js';

function run(fish, score) {
  const g = createGame(() => 0.999);
  g.fish = fish;
  g.score = score;
  return g;
}

test('rybičky a rekord se připíšou i bez prohry (Domů, Konec, odchod)', () => {
  const s = createStorage(undefined);
  const r = creditRun(run(40, 320), s);
  assert.equal(s.getSettings().totalFish, 40);
  assert.equal(s.getBest(), 320);
  assert.equal(r.record, true);
});

test('stejné rybičky se nepřipíšou dvakrát', () => {
  const s = createStorage(undefined);
  const g = run(25, 100);
  creditRun(g, s);
  const again = creditRun(g, s);
  assert.equal(s.getSettings().totalFish, 25);
  assert.equal(again.unlocked, null);
});

test('po odchodu do pozadí a návratu se připíšou i další rybičky a rekord platí', () => {
  const s = createStorage(undefined);
  s.setBest(200);
  const g = run(10, 150);
  creditRun(g, s);             // aplikace odešla do pozadí
  g.fish = 16;
  g.score = 260;               // hráč pokračoval a prohrál
  const end = creditRun(g, s);
  assert.equal(s.getSettings().totalFish, 16);
  assert.equal(s.getBest(), 260);
  assert.equal(end.record, true, 'rekord se počítá proti rekordu ze začátku hry');
});

test('připsání vrátí nově odemčenou ozdobu', () => {
  const s = createStorage(undefined);
  s.saveSettings({ totalFish: 55 });
  const r = creditRun(run(10, 50), s);
  assert.equal(r.unlocked.id, 'bow');
});

test('nová hra se dá zase připsat', async () => {
  const { resetGame } = await import('../src/game.js');
  const s = createStorage(undefined);
  const g = run(5, 10);
  creditRun(g, s);
  resetGame(g);
  g.fish = 7;
  creditRun(g, s);
  assert.equal(s.getSettings().totalFish, 12);
});

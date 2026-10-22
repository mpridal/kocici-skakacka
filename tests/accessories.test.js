import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { unlockedAccessories, nextUnlock, newlyUnlocked } from '../src/accessories.js';
import { createStorage } from '../src/storage.js';
import { createUI, layoutButtons } from '../src/ui.js';

const ids = (list) => list.map((a) => a.id);

test('bez rybiček je dostupné jen „nic“, ozdoby se odemykají podle celkového počtu rybiček', () => {
  assert.deepEqual(ids(unlockedAccessories(0)), ['none']);
  assert.deepEqual(ids(unlockedAccessories(63)), ['none', 'bow']);
  assert.deepEqual(ids(unlockedAccessories(1000)), CONFIG.accessories.map((a) => a.id));
});

test('ukazatel další ozdoby', () => {
  assert.deepEqual(nextUnlock(12), { id: 'bow', label: 'Mašle', remaining: 48, need: 60 });
  assert.equal(nextUnlock(1000), null);
});

test('nově odemčená ozdoba po hře', () => {
  assert.equal(newlyUnlocked(55, 70).id, 'bow');
  assert.equal(newlyUnlocked(64, 100), null);
  assert.equal(newlyUnlocked(100, 200).id, 'flower', 'při přeskočení více prahů se ukáže ta nejvyšší');
});

test('úložiště drží celkový počet rybiček a vybranou ozdobu', () => {
  const s = createStorage(undefined);
  assert.equal(s.getSettings().totalFish, 0);
  assert.equal(s.getSettings().accessory, 'none');
  s.saveSettings({ totalFish: 45, accessory: 'bow' });
  assert.equal(s.getSettings().totalFish, 45);
  assert.equal(s.getSettings().accessory, 'bow');
  s.saveSettings({ accessory: 'drak', totalFish: -3 });
  assert.equal(s.getSettings().accessory, 'none');
  assert.equal(s.getSettings().totalFish, 0);
});

test('tlačítko ozdoby na úvodu přepíná jen mezi odemčenými', () => {
  const s = createStorage(undefined);
  s.saveSettings({ totalFish: 130 });
  const ui = createUI(s, {});
  const b = layoutButtons('intro').find((x) => x.id === 'acc');
  assert.ok(b, 'na úvodu je tlačítko ozdoby');
  const tap = () => ui.pointerDown(b.x + b.w / 2, b.y + b.h / 2, 0);
  tap(); assert.equal(s.getSettings().accessory, 'bow');
  tap(); assert.equal(s.getSettings().accessory, 'glasses');
  tap(); assert.equal(s.getSettings().accessory, 'none');
});

test('konec hry si pamatuje nově odemčenou ozdobu', () => {
  const ui = createUI(createStorage(undefined), {});
  ui.gameOver(0, false, { id: 'bow', label: 'Mašle' });
  assert.equal(ui.unlocked.id, 'bow');
  ui.gameOver(5000, false, null);
  assert.equal(ui.unlocked, null);
});

test('k odměnám přibyla maska, knír a sukýnka a prahy stoupají', () => {
  const list = CONFIG.accessories;
  for (const id of ['mask', 'mustache', 'skirt']) assert.ok(list.some((a) => a.id === id), `chybí ${id}`);
  for (let i = 1; i < list.length; i++) assert.ok(list[i].fish > list[i - 1].fish, 'prahy stoupají');
  assert.equal(nextUnlock(260).id, 'mask');
});

test('mezi odměnami je mobil a prahy jsou rovnoměrně rozložené až do 500 rybiček', () => {
  const rewards = CONFIG.accessories.filter((a) => a.id !== 'none');
  assert.ok(rewards.some((a) => a.id === 'phone'), 'chybí mobil');
  assert.equal(rewards[rewards.length - 1].fish, 500);
  const step = 500 / rewards.length;
  rewards.forEach((a, i) => {
    assert.equal(a.fish % 10, 0, `${a.id}: ${a.fish} není na celé desítky`);
    assert.ok(Math.abs(a.fish - step * (i + 1)) <= 5, `${a.id}: ${a.fish}`);
  });
});

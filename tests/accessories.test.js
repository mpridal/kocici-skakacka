import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { unlockedAccessories, nextUnlock, newlyUnlocked } from '../src/accessories.js';
import { createStorage } from '../src/storage.js';
import { createUI, layoutButtons } from '../src/ui.js';

const ids = (list) => list.map((a) => a.id);

test('bez rybiček je dostupné jen „nic“, ozdoby se odemykají podle celkového počtu rybiček', () => {
  assert.deepEqual(ids(unlockedAccessories(0)), ['none']);
  assert.deepEqual(ids(unlockedAccessories(10)), ['none', 'bow']);
  assert.deepEqual(ids(unlockedAccessories(1000)), CONFIG.accessories.map((a) => a.id));
});

test('ukazatel další ozdoby', () => {
  assert.deepEqual(nextUnlock(4), { id: 'bow', label: 'Mašle', remaining: 6, need: 10 });
  assert.deepEqual(nextUnlock(12), { id: 'glasses', label: 'Brýle', remaining: 18, need: 30 });
  assert.equal(nextUnlock(1000), null);
});

test('nově odemčená ozdoba po hře', () => {
  assert.equal(newlyUnlocked(5, 12).id, 'bow');
  assert.equal(newlyUnlocked(11, 25), null);
  assert.equal(newlyUnlocked(20, 70).id, 'flower', 'při přeskočení více prahů se ukáže ta nejvyšší');
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
  s.saveSettings({ totalFish: 35 });
  const ui = createUI(s, {});
  const b = layoutButtons('intro').find((x) => x.id === 'acc');
  assert.ok(b, 'na úvodu je tlačítko ozdoby');
  const tap = () => { ui.pointerDown(b.x + b.w / 2, b.y + b.h / 2, 0); ui.pointerUp(b.x + b.w / 2, b.y + b.h / 2, 0); };
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

test('odměny bez sukýnky: první brzy, pak se latka postupně zvedá až do 350', () => {
  const rewards = CONFIG.accessories.filter((x) => x.id !== 'none');
  assert.deepEqual(rewards.map((x) => [x.id, x.fish]), [
    ['bow', 10], ['glasses', 30], ['flower', 60], ['crown', 100], ['mask', 160], ['mustache', 240], ['phone', 350],
  ]);
  assert.equal(rewards.some((x) => x.id === 'skirt'), false, 'sukýnka je zrušená');
  for (let i = 2; i < rewards.length; i++) {
    assert.ok(rewards[i].fish - rewards[i - 1].fish >= rewards[i - 1].fish - (rewards[i - 2]?.fish ?? 0), 'rozestupy rostou');
  }
});

test('uložená sukýnka se po zrušení změní na „bez ozdoby“', () => {
  const s = createStorage(undefined);
  s.saveSettings({ accessory: 'skirt' });
  assert.equal(s.getSettings().accessory, 'none');
});

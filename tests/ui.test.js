import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG, LOGICAL_W, LOGICAL_H } from '../src/config.js';
import { createUI, layoutButtons, greeting, recordText, SCREENS } from '../src/ui.js';
import { createStorage } from '../src/storage.js';

const center = (b) => [b.x + b.w / 2, b.y + b.h / 2];
// ťuknutí = stisk a puštění prstu na stejném místě
const tap = (ui, x, y, now) => { const r = ui.pointerDown(x, y, now); ui.pointerUp(x, y, now); return r; };
const btn = (screen, id) => layoutButtons(screen).find((b) => b.id === id);

function makeUI() {
  const calls = [];
  const ui = createUI(createStorage(undefined), {
    onStart: () => calls.push('start'),
    onResume: () => calls.push('resume'),
    onPause: () => calls.push('pause'),
    onHome: () => calls.push('home'),
    onRestart: () => calls.push('restart'),
    onParentOpen: () => calls.push('parent'),
    onParentClose: () => calls.push('parentClose'),
  });
  return { ui, calls };
}

test('pozdrav a text rekordu se jménem i bez', () => {
  assert.equal(greeting('Ema', 'Pusheen'), 'Ahoj, Ema! Já jsem Pusheen.');
  assert.equal(greeting('', 'Mašlička'), 'Ahoj! Já jsem Mašlička.');
  assert.equal(recordText('Ema'), 'Nový rekord, Ema!');
  assert.equal(recordText(''), 'Nový rekord!');
});

test('ťuk na Hraj! spustí hru a chvíli neskáče', () => {
  const { ui, calls } = makeUI();
  assert.equal(ui.screen, 'intro');
  assert.equal(tap(ui, ...center(btn('intro', 'play')), 1000), 'consumed');
  assert.equal(ui.screen, 'playing');
  assert.deepEqual(calls, ['start']);
  assert.equal(tap(ui, 640, 400, 1200), 'consumed');
  assert.equal(tap(ui, 640, 400, 1300), 'jump');
});

test('pauza: tlačítko pauzy neskáče, ťuk mimo tlačítka skáče', () => {
  const { ui, calls } = makeUI();
  tap(ui, ...center(btn('intro', 'play')), 0);
  assert.equal(tap(ui, 640, 400, 1000), 'jump');
  assert.equal(tap(ui, ...center(btn('playing', 'pause')), 2000), 'consumed');
  assert.equal(ui.screen, 'paused');
  assert.ok(calls.includes('pause'));
  assert.equal(tap(ui, ...center(btn('paused', 'resume')), 3000), 'consumed');
  assert.equal(ui.screen, 'playing');
  assert.equal(tap(ui, 640, 400, 3100), 'consumed', 'hned po pokračování neskáče');
});

test('konec hry: tlačítka reagují až po prodlevě', () => {
  const { ui, calls } = makeUI();
  tap(ui, ...center(btn('intro', 'play')), 0);
  ui.gameOver(5000, false);
  assert.equal(ui.screen, 'over');
  tap(ui, ...center(btn('over', 'again')), 5000 + CONFIG.ui.gameOverDelay * 1000 - 50);
  assert.equal(ui.screen, 'over');
  assert.equal(calls.includes('restart'), false);
  tap(ui, ...center(btn('over', 'again')), 5000 + CONFIG.ui.gameOverDelay * 1000 + 10);
  assert.equal(ui.screen, 'playing');
  assert.ok(calls.includes('restart'));
});

test('rodičovské nastavení jen po podržení ozubeného kolečka', () => {
  const { ui, calls } = makeUI();
  const gear = center(btn('intro', 'gear'));
  ui.pointerDown(...gear, 0);
  ui.update(CONFIG.ui.parentHoldTime * 1000 - 100);
  ui.pointerUp(...gear, CONFIG.ui.parentHoldTime * 1000 - 50);
  ui.update(CONFIG.ui.parentHoldTime * 1000 + 500);
  assert.equal(ui.screen, 'intro');
  ui.pointerDown(...gear, 10000);
  ui.update(10000 + CONFIG.ui.parentHoldTime * 1000);
  assert.equal(ui.screen, 'parent');
  assert.ok(calls.includes('parent'));
});

test('výběr barvy kočky se uloží', () => {
  const storage = createStorage(undefined);
  const ui = createUI(storage, {});
  tap(ui, ...center(btn('intro', 'next')), 0);
  assert.equal(storage.getSettings().skin, CONFIG.skins[1].id);
  tap(ui, ...center(btn('intro', 'skin-4')), 10);
  assert.equal(storage.getSettings().skin, CONFIG.skins[4].id);
  tap(ui, ...center(btn('intro', 'prev')), 20);
  assert.equal(storage.getSettings().skin, CONFIG.skins[3].id);
});

test('tlačítka jsou na obrazovce, dost velká a nepřekrývají se', () => {
  for (const screen of SCREENS) {
    const list = layoutButtons(screen);
    for (const b of list) {
      assert.ok(b.x >= 0 && b.y >= 0 && b.x + b.w <= LOGICAL_W && b.y + b.h <= LOGICAL_H, `${screen}/${b.id} mimo`);
      assert.ok(b.w >= 96 && b.h >= 96, `${screen}/${b.id} malé`);
    }
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i];
        const c = list[j];
        const overlap = a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h;
        assert.equal(overlap, false, `${screen}: ${a.id} × ${c.id}`);
      }
    }
  }
});

test('na širokém displeji jsou tlačítka uvnitř, dost velká a nepřekrývají se', () => {
  for (const w of [1600, 1728]) {
    for (const screen of SCREENS) {
      const list = layoutButtons(screen, w);
      for (const b of list) {
        assert.ok(b.x >= 0 && b.x + b.w <= w && b.y + b.h <= LOGICAL_H, `${w} ${screen}/${b.id} mimo`);
      }
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          const a = list[i]; const c = list[j];
          assert.equal(a.x < c.x + c.w && c.x < a.x + a.w && a.y < c.y + c.h && c.y < a.y + a.h, false, `${w} ${screen}: ${a.id} × ${c.id}`);
        }
      }
    }
  }
  // pauza a zvuk drží pravý okraj, Hraj! je uprostřed
  const pause = layoutButtons('playing', 1600).find((b) => b.id === 'pause');
  assert.ok(1600 - (pause.x + pause.w) < 40);
  const play = layoutButtons('intro', 1600).find((b) => b.id === 'play');
  const exit = layoutButtons('intro', 1600).find((b) => b.id === 'exit');
  assert.ok(Math.abs((play.x + exit.x + exit.w) / 2 - 800) < 1, 'dvojice Hraj!/Konec je uprostřed');
});

test('ťuk na Hraj! funguje i na širokém displeji', () => {
  const { ui } = makeUI();
  ui.setViewWidth(1600);
  const play = layoutButtons('intro', 1600).find((b) => b.id === 'play');
  assert.equal(tap(ui, ...center(play), 0), 'consumed');
  assert.equal(ui.screen, 'playing');
});

test('zvuk jde vypnout a zapnout ve hře i v pauze, ťuk na tlačítko neskáče', () => {
  const storage = createStorage(undefined);
  const muted = [];
  const ui = createUI(storage, { onMute: (m) => muted.push(m) });
  tap(ui, ...center(btn('intro', 'play')), 0);
  const hud = btn('playing', 'sound');
  assert.ok(hud, 've hře je tlačítko zvuku');
  assert.equal(tap(ui, ...center(hud), 400), 'consumed', 'ťuk na zvuk neskáče');
  assert.equal(storage.getSettings().muted, true);
  assert.equal(ui.screen, 'playing');
  tap(ui, ...center(hud), 450);
  assert.equal(storage.getSettings().muted, false);
  muted.length = 0;
  tap(ui, ...center(btn('playing', 'pause')), 500);
  const sound = btn('paused', 'sound');
  assert.ok(sound, 'v pauze je tlačítko zvuku');
  assert.equal(tap(ui, ...center(sound), 1000), 'consumed');
  assert.equal(ui.screen, 'paused');
  assert.equal(storage.getSettings().muted, true);
  assert.equal(tap(ui, ...center(sound), 2000), 'consumed');
  assert.equal(storage.getSettings().muted, false);
  assert.deepEqual(muted, [true, false]);
});

test('tlačítko Konec je vedle Hraj! a požádá o zavření aplikace', () => {
  const calls = [];
  const ui = createUI(createStorage(undefined), { onExit: () => calls.push('exit') });
  const play = btn('intro', 'play');
  const exit = btn('intro', 'exit');
  assert.ok(exit, 'na úvodu je tlačítko Konec');
  assert.ok(Math.abs(exit.y - play.y) < 1 && exit.x > play.x + play.w, 'Konec je vpravo vedle Hraj!');
  assert.equal(tap(ui, ...center(exit), 0), 'consumed');
  assert.deepEqual(calls, ['exit']);
});

test('když se okno nezavře, ukáže se rozloučení a jde se vrátit', () => {
  const { ui } = makeUI();
  ui.showBye(0);
  assert.equal(ui.screen, 'bye');
  assert.equal(tap(ui, ...center(btn('bye', 'stay')), 100), 'consumed');
  assert.equal(ui.screen, 'intro');
});

test('Hraj! a Konec jsou stejně velké, v jedné řadě a jako dvojice uprostřed', () => {
  const play = btn('intro', 'play');
  const exit = btn('intro', 'exit');
  assert.equal(play.w, exit.w);
  assert.equal(play.h, exit.h);
  assert.equal(play.y, exit.y);
  assert.ok(Math.abs((play.x + exit.x + exit.w) / 2 - 640) < 1);
  assert.ok(exit.x - (play.x + play.w) >= 16 && exit.x - (play.x + play.w) <= 40, 'rozumná mezera');
});

test('v pauze je tlačítko Konec a po neúspěšném zavření se vrátí do pauzy', () => {
  const calls = [];
  const ui = createUI(createStorage(undefined), { onExit: () => calls.push('exit') });
  tap(ui, ...center(btn('intro', 'play')), 0);
  tap(ui, ...center(btn('playing', 'pause')), 1000);
  assert.equal(ui.screen, 'paused');
  const exit = btn('paused', 'exit');
  assert.ok(exit, 'v pauze je Konec');
  assert.equal(tap(ui, ...center(exit), 2000), 'consumed');
  assert.deepEqual(calls, ['exit']);
  ui.showBye(2400);
  assert.equal(ui.screen, 'bye');
  tap(ui, ...center(btn('bye', 'stay')), 3000);
  assert.equal(ui.screen, 'paused', 'Hrát dál vrátí do rozehrané hry v pauze');
});

test('kočičky mají svá jména', () => {
  const names = Object.fromEntries(CONFIG.skins.map((s) => [s.id, s.label]));
  assert.deepEqual(names, {
    mourek: 'Pusheen', zrzka: 'Perníček', cerna: 'Tulísek', bila: 'Sněhulka', pohadkova: 'Mašlička',
  });
});

test('tlačítko se spustí až po puštění prstu na stejném tlačítku', () => {
  const calls = [];
  const ui = createUI(createStorage(undefined), { onExit: () => calls.push('exit'), onStart: () => calls.push('start') });
  const exit = center(btn('intro', 'exit'));
  ui.pointerDown(...exit, 0);
  assert.deepEqual(calls, [], 'samotný dotyk nic nespustí');
  ui.pointerUp(640, 300, 50); // prst sklouzl pryč z tlačítka
  assert.deepEqual(calls, [], 'puštění mimo tlačítko nic nespustí');
  const play = center(btn('intro', 'play'));
  ui.pointerDown(...play, 100);
  ui.pointerUp(...play, 150);
  assert.deepEqual(calls, ['start']);
  assert.equal(ui.screen, 'playing');
});

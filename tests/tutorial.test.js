import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../src/config.js';
import { createGame } from '../src/game.js';
import { makeObstacle } from '../src/obstacles.js';
import { hintFor, tutorialActive } from '../src/tutorial.js';
import { createStorage } from '../src/storage.js';

function gameWith(kind, lane, distanceAhead) {
  const g = createGame(() => 0.999);
  for (const o of g.obstacles) o.active = false;
  const o = g.obstacles[0];
  makeObstacle(kind, lane, o);
  o.active = true;
  o.x = CONFIG.cat.x + distanceAhead;
  return g;
}

test('před malým avokádem radí ťuknout', () => {
  assert.equal(hintFor(gameWith('avo-small', null, 250)), 'tap');
});

test('před dvojicí a střední veverkou radí podržet', () => {
  assert.equal(hintFor(gameWith('avo-pair', null, 250)), 'hold');
  assert.equal(hintFor(gameWith('squirrel', 'mid', 250)), 'hold');
});

test('pod vysokou veverkou nic neradí (proběhne se)', () => {
  assert.equal(hintFor(gameWith('squirrel', 'high', 250)), null);
});

test('daleko před překážkou ani za ní nic neradí, ve vzduchu taky ne', () => {
  assert.equal(hintFor(gameWith('avo-big', null, 1200)), null);
  assert.equal(hintFor(gameWith('avo-big', null, -200)), null);
  const g = gameWith('avo-big', null, 250);
  g.cat.onGround = false;
  assert.equal(hintFor(g), null);
});

test('nápověda se vypne, až hráč jednou dosáhne potřebného skóre', () => {
  const s = createStorage(undefined);
  assert.equal(s.getSettings().tutorialDone, false);
  s.saveSettings({ tutorialDone: true });
  assert.equal(s.getSettings().tutorialDone, true);
});

test('nápověda zmizí hned po dosažení limitu, ne až v další hře', () => {
  const limit = CONFIG.tutorial.untilScore;
  assert.equal(tutorialActive(0, false), true);
  assert.equal(tutorialActive(limit - 1, false), true);
  assert.equal(tutorialActive(limit, false), false, 'na limitu už ne');
  assert.equal(tutorialActive(5, true), false, 'po splnění už nikdy');
});

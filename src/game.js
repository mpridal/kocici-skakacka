// Stav jedné hry: skóre, životy, nezranitelnost, rychlost, překážky.
import { CONFIG, LOGICAL_W } from './config.js';
import { createCat, updateCat, catHitbox } from './cat.js';
import { overlaps } from './collision.js';
import { createObstaclePool, createSpawner, obstacleHitbox } from './obstacles.js';
import { createPickupPool, placePickups, pickupBox, updatePickups } from './pickups.js';

export function createGame(rng = Math.random) {
  const game = {
    status: 'playing',
    score: 0,
    distance: 0,
    fish: 0,
    bonus: 0,
    lives: 0,
    invuln: 0,
    speed: 0,
    level: 0,
    viewW: LOGICAL_W, // logická šířka displeje (nastavuje main.js)
    time: 0,
    cat: createCat(),
    obstacles: createObstaclePool(),
    pickups: createPickupPool(),
    pickupAt: { x: 0, y: 0 }, // kde byl naposledy sebrán bonus (pro efekt)
    spawner: null,
    rng,
    events: [],
  };
  game.spawner = createSpawner(rng, (x, gap) =>
    placePickups(game.pickups, x, gap, rng, game.lives < CONFIG.lives.max));
  resetGame(game);
  return game;
}

export function resetGame(game) {
  game.status = 'playing';
  game.creditedFish = 0;  // kolik rybiček z této hry už je připsáno (src/progress.js)
  game.bestBefore = null; // rekord ze začátku hry
  game.score = 0;
  game.distance = 0;
  game.fish = 0;
  game.bonus = 0;
  game.lives = CONFIG.lives.start;
  game.invuln = 0;
  game.speed = CONFIG.speed.start;
  game.level = 0;
  game.time = 0;
  Object.assign(game.cat, createCat());
  for (const o of game.obstacles) o.active = false;
  for (const p of game.pickups) p.active = false;
  game.spawner.reset();
  game.events.length = 0;
}

function updateScore(game) {
  game.score = Math.floor(game.distance * CONFIG.score.pointsPerPx) + game.fish * CONFIG.score.fish + game.bonus;
}

// Rychlost po úrovních: každých levelEvery bodů o levelStep víc, plynule za rampTime, do stropu.
const MAX_LEVEL = Math.ceil((CONFIG.speed.max - CONFIG.speed.start) / CONFIG.speed.levelStep);
function updateSpeed(game, dt) {
  const s = CONFIG.speed;
  const level = Math.min(MAX_LEVEL, Math.floor(game.score / s.levelEvery));
  if (level > game.level) {
    game.level = level;
    game.events.push('levelUp');
  }
  const target = Math.min(s.max, s.start + game.level * s.levelStep);
  game.speed = Math.min(target, game.speed + (s.levelStep / s.rampTime) * dt);
}

const catBox = { x: 0, y: 0, w: 0, h: 0 };
const obBox = { x: 0, y: 0, w: 0, h: 0 };

function collectPickups(game) {
  catHitbox(game.cat, catBox);
  for (const p of game.pickups) {
    if (!p.active || !overlaps(catBox, pickupBox(p, obBox))) continue;
    p.active = false;
    game.pickupAt.x = p.x;
    game.pickupAt.y = CONFIG.groundY - p.y;
    if (p.kind === 'fish') {
      game.fish += 1;
      game.events.push('fish');
    } else if (game.lives < CONFIG.lives.max) {
      game.lives += 1;
      game.events.push('heart');
    } else {
      game.bonus += CONFIG.score.heartBonus;
      game.events.push('heartBonus');
    }
  }
}

export function stepGame(game, rawDt, held, pressed) {
  game.events.length = 0;
  if (game.status !== 'playing') return;
  const dt = Math.min(rawDt, CONFIG.maxDt);
  game.time += dt;
  updateScore(game);
  updateSpeed(game, dt);

  const wasOnGround = game.cat.onGround;
  updateCat(game.cat, dt, held, pressed);
  if (wasOnGround && !game.cat.onGround) game.events.push('jump');

  game.spawner.update(game.obstacles, dt, game.speed, game.score, game.viewW + 40);
  game.distance += game.speed * dt;
  updatePickups(game.pickups, game.speed * dt);
  collectPickups(game);
  updateScore(game);

  if (game.invuln > 0) {
    game.invuln = Math.max(0, game.invuln - dt);
    return;
  }
  catHitbox(game.cat, catBox);
  for (const o of game.obstacles) {
    if (!o.active || !overlaps(catBox, obstacleHitbox(o, obBox))) continue;
    game.lives -= 1;
    game.events.push('hit');
    if (game.lives <= 0) {
      game.lives = 0;
      game.status = 'over';
      game.events.push('over');
    } else {
      game.invuln = CONFIG.lives.invulnTime;
    }
    break;
  }
}

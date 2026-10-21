// Stav jedné hry: skóre, životy, nezranitelnost, rychlost, překážky.
import { CONFIG } from './config.js';
import { createCat, updateCat, catHitbox } from './cat.js';
import { overlaps } from './collision.js';
import { createObstaclePool, createSpawner, obstacleHitbox } from './obstacles.js';

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
    time: 0,
    cat: createCat(),
    obstacles: createObstaclePool(),
    spawner: createSpawner(rng),
    rng,
    events: [],
  };
  resetGame(game);
  return game;
}

export function resetGame(game) {
  game.status = 'playing';
  game.score = 0;
  game.distance = 0;
  game.fish = 0;
  game.bonus = 0;
  game.lives = CONFIG.lives.start;
  game.invuln = 0;
  game.speed = CONFIG.speed.start;
  game.time = 0;
  Object.assign(game.cat, createCat());
  for (const o of game.obstacles) o.active = false;
  game.spawner.reset();
  game.events.length = 0;
}

function updateScore(game) {
  game.score = Math.floor(game.distance * CONFIG.score.pointsPerPx) + game.fish * CONFIG.score.fish + game.bonus;
}

const catBox = { x: 0, y: 0, w: 0, h: 0 };
const obBox = { x: 0, y: 0, w: 0, h: 0 };

export function stepGame(game, rawDt, held, pressed) {
  game.events.length = 0;
  if (game.status !== 'playing') return;
  const dt = Math.min(rawDt, CONFIG.maxDt);
  const s = CONFIG.speed;
  game.time += dt;
  updateScore(game);
  game.speed = Math.min(s.max, s.start + s.gainPerPoint * game.score);

  const wasOnGround = game.cat.onGround;
  updateCat(game.cat, dt, held, pressed);
  if (wasOnGround && !game.cat.onGround) game.events.push('jump');

  game.spawner.update(game.obstacles, dt, game.speed, game.score);
  game.distance += game.speed * dt;
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

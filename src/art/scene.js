// Kreslení herních objektů podle jejich stavu (pozice z logiky → kresba).
import { CONFIG } from '../config.js';
import { AVO_ART, SQUIRREL_ART, PAIR_SMALL, PAIR_GAP, eyesClosed } from '../obstacles.js';
import { drawAvocado } from './avocado.js';
import { drawSquirrel } from './squirrel.js';
import { drawCat } from './cat.js';
import { drawFish } from './fish.js';
import { drawHeart } from './heart.js';

export function drawObstacle(ctx, o) {
  const g = CONFIG.groundY;
  if (o.kind === 'squirrel') {
    const s = CONFIG.obstacles.squirrelScale;
    drawSquirrel(ctx, o.x - SQUIRREL_ART.left * s, g - o.bottom - SQUIRREL_ART.bottom * s, s, o.animTime);
    return;
  }
  const a = CONFIG.obstacles.avocadoScale;
  const half = AVO_ART.right * a;
  const closed = eyesClosed(o);
  if (o.kind === 'avo-small') {
    drawAvocado(ctx, o.x + half * 0.72, g, a * 0.72, closed);
  } else if (o.kind === 'avo-big') {
    drawAvocado(ctx, o.x + half, g, a, closed);
  } else {
    drawAvocado(ctx, o.x + half, g, a, closed);
    // druhé avokádo mrká s posunem, aby nemrkala obě naráz
    const second = o.blinkTimer % 1.7 < 0.13;
    drawAvocado(ctx, o.x + 2 * half + PAIR_GAP * a + half * PAIR_SMALL, g, a * PAIR_SMALL, second);
  }
}

export function drawPickup(ctx, p, t) {
  const y = CONFIG.groundY - p.y;
  if (p.kind === 'fish') drawFish(ctx, p.x, y, CONFIG.pickups.fishScale, t, p.phase);
  else drawHeart(ctx, p.x, y + Math.sin(t * 3) * 4, CONFIG.pickups.heartScale, '#FF8FA5');
}

export function drawGameCat(ctx, game, skin) {
  const c = CONFIG.cat;
  if (game.invuln > 0 && Math.floor(game.invuln * 8) % 2 === 1) return; // blikání
  const pose = game.invuln > CONFIG.lives.invulnTime - 0.6 ? 'hurt' : game.cat.onGround ? 'run' : 'jump';
  drawCat(ctx, c.x, CONFIG.groundY - game.cat.y, c.scale, skin, pose, game.cat.animTime);
}

// Nápověda pro začátečníka: před blížící se překážkou poradí „ťukni“ nebo „podrž“.
import { CONFIG } from './config.js';

const LEAD_TIME = 1.1; // s – jak dlouho před překážkou se nápověda ukáže

export function hintFor(game) {
  if (!game.cat.onGround) return null;
  const front = CONFIG.cat.x + 60;
  let nearest = null;
  for (const o of game.obstacles) {
    if (!o.active || o.x + o.w < front) continue;
    if (!nearest || o.x < nearest.x) nearest = o;
  }
  if (!nearest || nearest.x - front > game.speed * LEAD_TIME) return null;
  if (nearest.kind === 'squirrel' && nearest.lane === 'high') return null;
  return nearest.kind === 'avo-pair' || (nearest.kind === 'squirrel' && nearest.lane === 'mid') ? 'hold' : 'tap';
}

// Nápověda běží jen do prvního dosažení limitu – hned na něm zmizí (i uprostřed hry).
export function tutorialActive(score, done) {
  return !done && score < CONFIG.tutorial.untilScore;
}

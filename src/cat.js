// Stav a fyzika kočky. y = výška nad zemí (0 = na zemi), vy > 0 = nahoru.
import { CONFIG } from './config.js';
import { shrinkBox } from './collision.js';

// Obrys kresby kočky v jednotkách vzoru (bod (0,0) = zem pod kočkou).
export const CAT_ART_BOX = { left: -47, right: 63, top: -66 };

export function createCat() {
  return { y: 0, vy: 0, onGround: true, holding: false, holdTime: 0, state: 'run', animTime: 0 };
}

// Posun o čas `dt` se stálým zrychlením (přesné, nezávislé na délce snímku).
function integrate(cat, dt, g) {
  cat.y += cat.vy * dt - 0.5 * g * dt * dt;
  cat.vy -= g * dt;
}

export function updateCat(cat, dt, held, pressed) {
  const c = CONFIG.cat;
  cat.animTime += dt;

  if (pressed && cat.onGround) {
    cat.vy = c.jumpVelocity;
    cat.onGround = false;
    cat.holding = true;
    cat.holdTime = 0;
  }
  if (cat.onGround) {
    cat.state = 'run';
    return;
  }

  if (!held || cat.vy <= 0) cat.holding = false;

  let rest = dt;
  if (cat.holding) {
    const holdLeft = c.maxHoldTime - cat.holdTime;
    const step = Math.min(rest, holdLeft);
    integrate(cat, step, c.gravity * c.holdGravityFactor);
    cat.holdTime += step;
    rest -= step;
    if (cat.holdTime >= c.maxHoldTime) cat.holding = false;
  }
  if (rest > 0) integrate(cat, rest, c.gravity);

  if (cat.y <= 0) {
    cat.y = 0;
    cat.vy = 0;
    cat.onGround = true;
    cat.holding = false;
    cat.state = 'run';
  } else {
    cat.state = 'jump';
  }
}

// Kolizní box kočky v logických souřadnicích obrazovky (zmenšený, shovívavý).
const artBox = { x: 0, y: 0, w: 0, h: 0 };
export function catHitbox(cat, out = { x: 0, y: 0, w: 0, h: 0 }) {
  const { x, scale, hitboxShrinkX, hitboxShrinkY } = CONFIG.cat;
  artBox.w = (CAT_ART_BOX.right - CAT_ART_BOX.left) * scale;
  artBox.h = -CAT_ART_BOX.top * scale;
  artBox.x = x + CAT_ART_BOX.left * scale;
  artBox.y = CONFIG.groundY - cat.y - artBox.h;
  return shrinkBox(artBox, hitboxShrinkX, hitboxShrinkY, out);
}

// Doba ve vzduchu při skoku s držením `holdTime` (pro férový generátor).
export function jumpAirtime(holdTime) {
  const cat = createCat();
  const dt = 1 / 240;
  updateCat(cat, dt, true, true);
  let t = dt;
  while (!cat.onGround && t < 10) {
    updateCat(cat, dt, t < holdTime, false);
    t += dt;
  }
  return t;
}

// Nejvyšší výška skoku při držení `holdTime`.
export function jumpPeak(holdTime) {
  const cat = createCat();
  const dt = 1 / 240;
  updateCat(cat, dt, true, true);
  let t = dt;
  let peak = 0;
  while (!cat.onGround && t < 10) {
    updateCat(cat, dt, t < holdTime, false);
    peak = Math.max(peak, cat.y);
    t += dt;
  }
  return peak;
}

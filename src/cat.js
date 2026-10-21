// Stav a fyzika kočky. y = výška nad zemí (0 = na zemi), vy > 0 = nahoru.
import { CONFIG } from './config.js';

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
export function catHitbox(cat, out = { x: 0, y: 0, w: 0, h: 0 }) {
  const { x, scale, hitboxShrink } = CONFIG.cat;
  const w = (CAT_ART_BOX.right - CAT_ART_BOX.left) * scale;
  const h = -CAT_ART_BOX.top * scale;
  const sw = w * (1 - hitboxShrink);
  const sh = h * (1 - hitboxShrink);
  out.x = x + CAT_ART_BOX.left * scale + (w - sw) / 2;
  out.y = CONFIG.groundY - cat.y - h + (h - sh) / 2;
  out.w = sw;
  out.h = sh;
  return out;
}

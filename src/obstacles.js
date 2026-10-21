// Avokáda a veverky: předem alokovaný pool a férový generátor.
import { CONFIG, LOGICAL_W } from './config.js';
import { jumpAirtime } from './cat.js';
import { shrinkBox } from './collision.js';

// Obrysy kreseb v jednotkách vzoru.
export const AVO_ART = { left: -30, right: 30, top: -56 };
export const SQUIRREL_ART = { left: -28, right: 40, top: -42, bottom: 13 };
export const PAIR_SMALL = 0.7; // menší avokádo ve dvojici
export const PAIR_GAP = 6;     // mezera mezi avokády ve dvojici (jednotky vzoru)
const SMALL = 0.72;

const SPAWN_X = LOGICAL_W + 40;
const DESPAWN_X = -200;

function blankObstacle() {
  return {
    active: false, kind: 'avo-small', lane: null, x: 0, w: 0, h: 0, bottom: 0,
    spawnDistance: 0, blinkTimer: 0, blinkLeft: 0, animTime: 0,
  };
}

export function createObstaclePool(size = 16) {
  return Array.from({ length: size }, blankObstacle);
}

// Nastaví rozměry překážky daného druhu (do `out`, bez alokace).
export function makeObstacle(kind, lane, out = blankObstacle()) {
  const { avocadoScale: a, squirrelScale: s } = CONFIG.obstacles;
  const avoW = (AVO_ART.right - AVO_ART.left) * a;
  const avoH = -AVO_ART.top * a;
  out.kind = kind;
  out.lane = lane;
  out.bottom = 0;
  if (kind === 'avo-small') {
    out.w = avoW * SMALL;
    out.h = avoH * SMALL;
  } else if (kind === 'avo-big') {
    out.w = avoW;
    out.h = avoH;
  } else if (kind === 'avo-pair') {
    out.w = avoW * (1 + PAIR_SMALL) + PAIR_GAP * a;
    out.h = avoH;
  } else {
    out.w = (SQUIRREL_ART.right - SQUIRREL_ART.left) * s;
    out.h = (SQUIRREL_ART.bottom - SQUIRREL_ART.top) * s;
    out.bottom = CONFIG.squirrelLanes[lane];
  }
  return out;
}

const artBox = { x: 0, y: 0, w: 0, h: 0 };
export function obstacleHitbox(o, out = { x: 0, y: 0, w: 0, h: 0 }) {
  artBox.x = o.x;
  artBox.y = CONFIG.groundY - o.bottom - o.h;
  artBox.w = o.w;
  artBox.h = o.h;
  const k = CONFIG.obstacles.hitboxShrink;
  return shrinkBox(artBox, k, k, out);
}

export function randomBlink(rng) {
  return 1.2 + rng() * 3.8;
}

const BLINK_CLOSED = 0.13;
const DOUBLE_BLINK_GAP = 0.18;

// Mrkání avokáda: každé má vlastní odpočet, občas mrkne dvakrát za sebou.
export function updateBlink(o, dt, rng) {
  if (o.blinkLeft > 0) o.blinkLeft = Math.max(0, o.blinkLeft - dt);
  o.blinkTimer -= dt;
  if (o.blinkTimer <= 0) {
    o.blinkLeft = BLINK_CLOSED;
    o.blinkTimer = rng() < 0.25 ? BLINK_CLOSED + DOUBLE_BLINK_GAP : randomBlink(rng);
  }
}

export const eyesClosed = (o) => o.blinkLeft > 0;

const LANES = ['low', 'mid', 'high'];

export function createSpawner(rng = Math.random) {
  const o = CONFIG.obstacles;
  const minGapTime = jumpAirtime(CONFIG.cat.maxHoldTime) + o.reactionTime;
  let distance = 0;     // uběhnutá vzdálenost
  let nextAt = 0;       // vzdálenost, při které vznikne další překážka

  function pickKind(score) {
    if (score >= o.squirrelFromScore && rng() < o.squirrelChance) return 'squirrel';
    const r = rng();
    if (r < o.pairChance) return 'avo-pair';
    return r < o.pairChance + (1 - o.pairChance) / 2 ? 'avo-small' : 'avo-big';
  }

  return {
    get minGapTime() { return minGapTime; },
    reset() { distance = 0; nextAt = 0; },
    update(pool, dt, speed, score) {
      const dx = speed * dt;
      distance += dx;
      for (const ob of pool) {
        if (!ob.active) continue;
        ob.x -= dx;
        ob.animTime += dt;
        if (ob.kind !== 'squirrel') updateBlink(ob, dt, rng);
        if (ob.x + ob.w < DESPAWN_X) ob.active = false;
      }
      if (distance < nextAt) return;
      const slot = pool.find((ob) => !ob.active);
      if (!slot) return; // plno – počká se na uvolnění
      const kind = pickKind(score);
      makeObstacle(kind, kind === 'squirrel' ? LANES[Math.floor(rng() * 3)] : null, slot);
      slot.active = true;
      slot.x = SPAWN_X;
      slot.spawnDistance = distance;
      slot.animTime = 0;
      slot.blinkTimer = randomBlink(rng);
      slot.blinkLeft = 0;
      const extra = o.extraGapMin + rng() * (o.extraGapMax - o.extraGapMin);
      nextAt = distance + slot.w + (minGapTime + extra) * speed;
    },
  };
}

// Kočička ve stylu „bochníček“. Pózy: run, jump, hurt, blink, idle.
import { OUTLINE, CHEEK, fillStroke, strokePath, ellipse, swing, rotateAround, prepare, path } from './shapes.js';

const TAIL = 'M-38,-20 C-46,-24 -50,-30 -52,-36';
const TAIL_STRIPES = 'M-46,-25 l3,-4 M-50,-31 l4,-2';
const EAR_L = 'M24,-51 L28,-66 L37,-55Z';
const EAR_R = 'M43,-56 L51,-66 L55,-50Z';
const BODY = 'M-38,-4 C-47,-22 -36,-44 -8,-46 C8,-47 22,-58 38,-56 C56,-54 63,-36 57,-20 C53,-6 40,-2 20,-2 L-30,-2 C-35,-2 -37,-3 -38,-4Z';
const STRIPES = 'M38,-54 v6 M44,-55 v6 M50,-53 v5 M-14,-46 q3,5 0,10 M-4,-46 q3,5 0,10 M6,-47 q3,5 0,10';
const MOUTH = 'M43.5,-31 q1.5,2.2 3,0 q1.5,2.2 3,0';
const BLINK = 'M37.5,-37 q2.5,2 5,0 M49.5,-37.5 q2.5,2 5,0';
const OUCH = 'M37.5,-39.5 l4.5,2.5 -4.5,2.5 M54.5,-40 l-4.5,2.5 4.5,2.5';
const LEGS = [-31, -16, 18, 33];
const LEG_PHASE = [1, -1, -1, 1]; // přední levá + zadní pravá spolu

function legPath(x) {
  return `M${x + 4.5},-9 h1 a4.5,4.5 0 0 1 4.5,4.5 v1 a4.5,4.5 0 0 1 -4.5,4.5 h-1 a4.5,4.5 0 0 1 -4.5,-4.5 v-1 a4.5,4.5 0 0 1 4.5,-4.5Z`;
}
const LEG_PATHS = LEGS.map(legPath);

export function drawCat(ctx, x, groundY, scale, skin, pose, t, blinking = false) {
  ctx.save();
  prepare(ctx);
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);

  const running = pose === 'run' || pose === 'hurt';
  const legAngle = running ? swing(t, 0.3, 32, -32) : pose === 'jump' ? 18 : 0;
  const bob = running ? -swing(t, 0.15, 0, 2.5) : 0;
  const tailAngle = pose === 'idle' || pose === 'blink' ? swing(t, 1.2, -8, 10) : swing(t, 0.3, -12, 14);
  if (pose === 'jump') rotateAround(ctx, 0, -33, -12);

  for (let i = 0; i < 4; i++) {
    ctx.save();
    rotateAround(ctx, LEGS[i] + 5, -9, legAngle * LEG_PHASE[i]);
    fillStroke(ctx, LEG_PATHS[i], skin.fur);
    ctx.restore();
  }

  ctx.translate(0, bob);
  ctx.save();
  rotateAround(ctx, -38, -20, tailAngle);
  strokePath(ctx, TAIL, OUTLINE, 13);
  strokePath(ctx, TAIL, skin.fur, 8.5);
  strokePath(ctx, TAIL_STRIPES, skin.stripe, 2.6);
  ctx.restore();

  fillStroke(ctx, EAR_L, skin.fur);
  fillStroke(ctx, EAR_R, skin.fur);
  fillStroke(ctx, BODY, skin.fur);
  strokePath(ctx, STRIPES, skin.stripe, 2.6);
  ellipse(ctx, 36, -29, 3.6, 2.2, CHEEK, 0, 0.7);
  ellipse(ctx, 56, -30, 3, 2.2, CHEEK, 0, 0.7);

  const face = pose === 'hurt' ? 'hurt' : (blinking || pose === 'blink') ? 'blink' : 'open';
  if (face === 'hurt') {
    strokePath(ctx, OUCH, skin.eye, 1.6);
    ellipse(ctx, 46, -30, 2.2, 2.6, skin.eye);
  } else {
    if (face === 'blink') strokePath(ctx, BLINK, skin.eye, 1.6);
    else {
      ellipse(ctx, 40, -37, 2.2, 2.9, skin.eye);
      ellipse(ctx, 52, -37.5, 2.2, 2.9, skin.eye);
    }
    strokePath(ctx, MOUTH, skin.eye, 1.4);
  }
  ctx.restore();
}

// Hlavička kočky (ikona aplikace): jen přední část těla s ušima a obličejem.
export function drawCatHead(ctx, cx, cy, size, skin) {
  ctx.save();
  prepare(ctx);
  ctx.translate(cx, cy);
  const s = size / 46;
  ctx.scale(s, s);
  ctx.translate(-40, 38);
  fillStroke(ctx, EAR_L, skin.fur);
  fillStroke(ctx, EAR_R, skin.fur);
  ctx.beginPath();
  ctx.ellipse(41, -38, 22, 19, 0, 0, Math.PI * 2);
  ctx.fillStyle = skin.fur;
  ctx.fill();
  ctx.lineWidth = 2.2;
  ctx.strokeStyle = OUTLINE;
  ctx.stroke();
  strokePath(ctx, 'M35,-54 v6 M41,-55 v6 M47,-54 v5', skin.stripe, 2.6);
  ellipse(ctx, 29, -31, 3.6, 2.2, CHEEK, 0, 0.7);
  ellipse(ctx, 53, -31, 3.6, 2.2, CHEEK, 0, 0.7);
  ellipse(ctx, 35, -38, 2.2, 2.9, skin.eye);
  ellipse(ctx, 47, -38, 2.2, 2.9, skin.eye);
  ctx.lineWidth = 1.4;
  ctx.strokeStyle = skin.eye;
  ctx.stroke(path('M38,-32 q1.5,2.2 3,0 q1.5,2.2 3,0'));
  ctx.restore();
}

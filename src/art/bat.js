// Netopýr „Fazolka“ (noční náhrada veverky): mává křídly a koulí očima, každým jinam.
import { OUTLINE, CHEEK, fillStroke, strokePath, ellipse, swing, prepare } from './shapes.js';

const WING = 'M-26,-4 L-44,-30 L-52,-12 L-70,-26 L-72,-2 L-88,-10 L-80,12 Q-60,6 -50,14 Q-40,4 -26,10Z';
const WING_BONES = 'M-30,0 L-50,-12 M-32,4 L-72,-2';
const EARS = 'M-22,-14 L-20,-44 L-6,-20Z M22,-14 L20,-44 L6,-20Z';
const EARS_INNER = 'M-24,-14 L-21,-36 L-10,-20Z M24,-14 L21,-36 L10,-20Z';
const MOUTH = 'M-4,8 q2,3 4,0 q2,3 4,0';
const FANGS = 'M-3,10 l1.5,4 1.5,-4 M3,10 l1.5,4 1.5,-4';
const BODY = '#6E5A8C';
const MEMBRANE = '#9C88C7';

function wing(ctx, dir, flap) {
  ctx.save();
  ctx.scale(dir, 1);
  // mávání: křídlo se smršťuje svisle kolem ramene (x = -26, y ≈ -12)
  ctx.translate(-26, -12);
  ctx.scale(1, flap);
  ctx.translate(26, 12);
  fillStroke(ctx, WING, MEMBRANE, 2.2);
  strokePath(ctx, WING_BONES, BODY, 1.6);
  ctx.restore();
}

function rolledPupil(ctx, x, y, t, dir) {
  const a = dir * (t / 1.1) * Math.PI * 2;
  ellipse(ctx, x + Math.cos(a) * 2.6, y + Math.sin(a) * 2.6, 3.6, 3.6, '#3A3238');
}

// (x, y) = střed těla netopýra
export function drawBat(ctx, x, y, scale, t) {
  ctx.save();
  prepare(ctx);
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(0, swing(t, 0.44, -5, 5));
  const flap = swing(t, 0.22, 1, 0.3);
  wing(ctx, 1, flap);
  wing(ctx, -1, flap);
  fillStroke(ctx, EARS, BODY, 2.2);
  ctx.globalAlpha = 0.7;
  fillStroke(ctx, EARS_INNER, '#F7AFC0', 0);
  ctx.globalAlpha = 1;
  ellipse(ctx, 0, 0, 34, 24, BODY, 2.2);
  ellipse(ctx, -11, -5, 8.5, 8.5, '#FFFFFF', 1.5);
  ellipse(ctx, 11, -5, 8.5, 8.5, '#FFFFFF', 1.5);
  rolledPupil(ctx, -11, -5, t, 1);
  rolledPupil(ctx, 11, -5, t, -1);
  strokePath(ctx, MOUTH, '#F4E7B0', 1.6);
  fillStroke(ctx, FANGS, '#FFFFFF', 1);
  ellipse(ctx, -22, 6, 3.5, 2.2, CHEEK, 0, 0.7);
  ellipse(ctx, 22, 6, 3.5, 2.2, CHEEK, 0, 0.7);
  ctx.restore();
}

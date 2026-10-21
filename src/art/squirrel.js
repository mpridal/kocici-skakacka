// Malá vtipná veverka: těkající panenky, jazýček, ocas-vrtule, šmrdlající packa.
import { OUTLINE, CHEEK, fillStroke, strokePath, ellipse, swing, rotateAround, prepare } from './shapes.js';

const TAIL = 'M12,-3 C34,-5 40,-26 27,-36 C18,-42 7,-33 15,-25 C19,-19 16,-11 8,-8Z';
const ARM = 'M-26,-6 L-12,1';
const LEG = 'M10,6 L20,11';
const BODY = 'M-20,0 C-21,-12 -11,-17 0,-15 C12,-14 17,-6 15,0 C14,6 5,8 -6,8 C-15,8 -19,5 -20,0Z';
const EAR = 'M-16,-14 L-14,-22 L-9,-15Z';
const MOUTH = 'M-15,-1 q4,6 8,0Z';
const FUR = '#E8B07E';
const PUPIL_JITTER = [0, 0, 1.4, -1, -1.2, 1, 1, 1.2];

// (x, y) = střed těla veverky. bob je jen vizuální (kolizní box se nehýbe).
export function drawSquirrel(ctx, x, y, scale, t) {
  ctx.save();
  prepare(ctx);
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(0, swing(t, 0.9, -4, 4));
  rotateAround(ctx, 0, 0, swing(t, 0.9, -6, 5));

  ctx.save();
  rotateAround(ctx, 8, -3, swing(t, 0.12, -22, 18));
  fillStroke(ctx, TAIL, '#E0A06A', 2);
  ctx.restore();

  ctx.save();
  rotateAround(ctx, -12, -2.5, swing(t, 0.14, -35, 25));
  strokePath(ctx, ARM, OUTLINE, 7);
  strokePath(ctx, ARM, FUR, 3.5);
  ctx.restore();

  strokePath(ctx, LEG, OUTLINE, 6);
  strokePath(ctx, LEG, FUR, 2.5);
  fillStroke(ctx, BODY, FUR, 2);
  fillStroke(ctx, EAR, FUR, 1.8);
  ellipse(ctx, -15, -7, 4.2, 4.2, '#FFFFFF', 1.4);
  ellipse(ctx, -5.5, -7.5, 4.2, 4.2, '#FFFFFF', 1.4);
  const j = (Math.floor(t / 0.1125) % 4) * 2;
  const px = PUPIL_JITTER[j];
  const py = PUPIL_JITTER[j + 1];
  ellipse(ctx, -16 + px, -6.5 + py, 1.8, 1.8, '#3A3238');
  ellipse(ctx, -6.5 + px, -7 + py, 1.8, 1.8, '#3A3238');
  fillStroke(ctx, MOUTH, '#8A3B4A', 1.2);
  ellipse(ctx, -11, 2.6, 2.2, 2.6, '#FF8FA5');
  ellipse(ctx, -18, -1, 2.2, 1.5, CHEEK, 0, 0.7);
  ctx.restore();
}

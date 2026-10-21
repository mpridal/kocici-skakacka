// Avokádo – půlka s peckou, očičky mrkají.
import { OUTLINE, CHEEK, fillStroke, strokePath, ellipse, prepare } from './shapes.js';

const OUTER = 'M0,-56 C16,-56 30,-32 30,-19 C30,-6 17,0 0,0 C-17,0 -30,-6 -30,-19 C-30,-32 -16,-56 0,-56Z';
const INNER = 'M0,-49 C12,-49 24,-30 24,-19 C24,-9 13,-5 0,-5 C-13,-5 -24,-9 -24,-19 C-24,-30 -12,-49 0,-49Z';
const MOUTH = 'M-3,-30.5 q1.5,2 3,0 q1.5,2 3,0';

export function drawAvocado(ctx, x, groundY, scale, eyesClosed) {
  ctx.save();
  prepare(ctx);
  ctx.translate(x, groundY);
  ctx.scale(scale, scale);
  fillStroke(ctx, OUTER, '#6FA552');
  fillStroke(ctx, INNER, '#E4F2A8', 0);
  ellipse(ctx, 0, -18, 10, 10, '#B07A52', 2);
  strokePath(ctx, MOUTH, OUTLINE, 1.3);
  ellipse(ctx, -12, -30, 3, 2, CHEEK, 0, 0.7);
  ellipse(ctx, 12, -30, 3, 2, CHEEK, 0, 0.7);
  const ry = eyesClosed ? 2.6 * 0.12 : 2.6;
  ellipse(ctx, -6, -35, 2, ry, OUTLINE);
  ellipse(ctx, 6, -35, 2, ry, OUTLINE);
  ctx.restore();
}

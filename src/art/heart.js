// Srdíčko (život v HUD i bonus ve hře).
import { fillStroke, prepare } from './shapes.js';

const HEART = 'M0,7 C-13,-2 -12,-12 -6,-12 C-3,-12 0,-9 0,-7 C0,-9 3,-12 6,-12 C12,-12 13,-2 0,7Z';

// (x, y) = střed srdíčka. fill = null nakreslí prázdný obrys.
export function drawHeart(ctx, x, y, scale, fill, lineWidth = 1.6) {
  ctx.save();
  prepare(ctx);
  ctx.translate(x, y + 2.5 * scale);
  ctx.scale(scale, scale);
  fillStroke(ctx, HEART, fill, lineWidth);
  ctx.restore();
}

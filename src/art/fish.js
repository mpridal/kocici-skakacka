// Rybička: ocas mrská do stran (při pohledu z boku se zužuje), pomalu se pohupuje.
import { OUTLINE, fillStroke, strokePath, ellipse, swing, rotateAround, prepare } from './shapes.js';

const TAIL = 'M10,0 L22,-9 Q19,0 22,9Z';
const MOUTH = 'M-10,3.5 q1.5,1.6 3,0';

export function drawFish(ctx, x, y, scale, t, phase = 0) {
  const tt = t + phase;
  const k = (1 - Math.cos((2 * Math.PI * tt) / 0.32)) / 2; // 0 → 1 → 0 za 0,32 s
  ctx.save();
  prepare(ctx);
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.translate(0, swing(tt, 1.4, -4, 4));
  rotateAround(ctx, 0, 0, swing(tt, 1.4, -4, 4));

  ctx.save();
  ctx.translate(10, 0);
  ctx.scale(1 - 0.75 * k, 1);
  ctx.translate(-10, 0);
  fillStroke(ctx, TAIL, '#8EC8F0', 2);
  ctx.restore();

  ctx.save();
  ctx.scale(1 - 0.06 * k, 1);
  ellipse(ctx, 0, 0, 14, 10, '#B6DDF7', 2);
  ellipse(ctx, -6, -1.5, 1.6, 2.1, OUTLINE);
  strokePath(ctx, MOUTH, OUTLINE, 1.2);
  ctx.restore();
  ctx.restore();
}

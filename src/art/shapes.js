// Sdílené tvary a pomocné kreslicí funkce. Cesty jsou ze schváleného vzoru
// (docs/mockups/postavicky-animace.html), (0,0) = bod na zemi pod postavičkou.
export const OUTLINE = '#4A3F45';
export const CHEEK = '#FF9AB0';

const cache = new Map();
// Path2D se vytvoří jednou a pak se jen znovu používá (žádné alokace ve smyčce).
export function path(d) {
  let p = cache.get(d);
  if (!p) { p = new Path2D(d); cache.set(d, p); }
  return p;
}

export function fillStroke(ctx, d, fill, lineWidth = 2.2, stroke = OUTLINE) {
  const p = path(d);
  if (fill) { ctx.fillStyle = fill; ctx.fill(p); }
  if (lineWidth) { ctx.lineWidth = lineWidth; ctx.strokeStyle = stroke; ctx.stroke(p); }
}

export function strokePath(ctx, d, color, lineWidth) {
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = color;
  ctx.stroke(path(d));
}

export function ellipse(ctx, x, y, rx, ry, fill, lineWidth = 0, alpha = 1) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  if (alpha !== 1) ctx.globalAlpha *= alpha;
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (alpha !== 1) ctx.globalAlpha /= alpha;
  if (lineWidth) { ctx.lineWidth = lineWidth; ctx.strokeStyle = OUTLINE; ctx.stroke(); }
}

// Plynulé kyvadlo jako CSS „alternate ease-in-out“: hodnota mezi a a b, půlperioda `half` s.
export function swing(t, half, a, b) {
  return a + (b - a) * (1 - Math.cos((Math.PI * t) / half)) / 2;
}

export function rotateAround(ctx, px, py, deg) {
  ctx.translate(px, py);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.translate(-px, -py);
}

export function prepare(ctx) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
}

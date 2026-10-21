// Kolize obdélníků {x, y, w, h}. Dotyk hranou se nepočítá.
export function overlaps(a, b) {
  return a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
}

// Zmenší box o daný podíl šířky/výšky, střed zůstane na místě.
export function shrinkBox(box, fx, fy, out) {
  const w = box.w * (1 - fx);
  const h = box.h * (1 - fy);
  out.x = box.x + (box.w - w) / 2;
  out.y = box.y + (box.h - h) / 2;
  out.w = w;
  out.h = h;
  return out;
}

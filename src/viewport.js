// Škálování logické plochy 1280×720 na skutečnou obrazovku (letterbox na střed).
import { LOGICAL_W, LOGICAL_H } from './config.js';

export function computeViewport(cssW, cssH, dpr) {
  const scale = Math.min(cssW / LOGICAL_W, cssH / LOGICAL_H);
  return {
    scale,
    offsetX: (cssW - LOGICAL_W * scale) / 2,
    offsetY: (cssH - LOGICAL_H * scale) / 2,
    canvasW: Math.round(cssW * dpr),
    canvasH: Math.round(cssH * dpr),
    cssW,
    cssH,
    dpr,
    portrait: cssH > cssW,
  };
}

// Převod souřadnic dotyku (CSS px) na logické souřadnice hry.
export function toLogical(vp, clientX, clientY, out = { x: 0, y: 0 }) {
  out.x = (clientX - vp.offsetX) / vp.scale;
  out.y = (clientY - vp.offsetY) / vp.scale;
  return out;
}

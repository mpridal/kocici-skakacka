// Škálování logické plochy na skutečnou obrazovku. Výška je vždy 720,
// šířka se přizpůsobí poměru stran (1280 až MAX_LOGICAL_W), aby telefony 20:9
// využily celý displej. Co se nevejde, se vycentruje (letterbox).
import { LOGICAL_W, LOGICAL_H } from './config.js';

export const MAX_LOGICAL_W = 1728; // 21,6 : 9
export const MAX_DPR = 2; // víc ostrosti oko nepozná, ale slabý telefon by kreslil zbytečně moc pixelů

export function computeViewport(cssW, cssH, rawDpr) {
  const dpr = Math.min(rawDpr, MAX_DPR);
  const logicalW = Math.round(Math.min(MAX_LOGICAL_W, Math.max(LOGICAL_W, (cssW / cssH) * LOGICAL_H)));
  const scale = Math.min(cssW / logicalW, cssH / LOGICAL_H);
  return {
    scale,
    logicalW,
    offsetX: (cssW - logicalW * scale) / 2,
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

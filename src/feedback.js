// Vizuální odezva při zásahu (funguje i tam, kde nejde vibrace): krátký zátřes obrazu
// a zčervenání okrajů. age = sekundy od zásahu.
export const SHAKE_TIME = 0.35;
export const FLASH_TIME = 0.5;
const SHAKE_PX = 10;

export function hitFeedback(age, out) {
  out.dx = 0;
  out.dy = 0;
  out.flash = 0;
  if (age < 0) return out;
  if (age < SHAKE_TIME) {
    const a = SHAKE_PX * (1 - age / SHAKE_TIME);
    out.dx = a * Math.sin(age * 95);
    out.dy = a * 0.6 * Math.cos(age * 77);
  }
  if (age < FLASH_TIME) out.flash = 0.45 * (1 - age / FLASH_TIME);
  return out;
}

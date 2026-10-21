// Vibrace při ztrátě života (jen na zařízeních, která ji umí – typicky Android).
// Vzor = [vibrace ms, pauza ms, vibrace ms, …].
export const PATTERNS = {
  hit: [90],
  over: [160, 90, 220],
};

export function vibrateFor(event, nav = globalThis.navigator) {
  const pattern = PATTERNS[event];
  if (!pattern || !nav || typeof nav.vibrate !== 'function') return;
  try { nav.vibrate(pattern); } catch { /* vibrace zakázaná */ }
}

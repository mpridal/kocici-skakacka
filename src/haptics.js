// Vibrace při ztrátě života (jen na zařízeních, která ji umí – typicky Android).
// Vzor = [vibrace ms, pauza ms, vibrace ms, …].
export const PATTERNS = {
  hit: [200],                 // ztráta života
  over: [300, 120, 400],      // konec hry: bzz – bzzz
};

export function vibrateFor(event, nav = globalThis.navigator) {
  const pattern = PATTERNS[event];
  if (!pattern || !nav || typeof nav.vibrate !== 'function') return;
  try { nav.vibrate(pattern); } catch { /* vibrace zakázaná */ }
}

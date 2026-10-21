// Ozdoby pro kočičku: odemykají se podle celkového počtu chycených rybiček (přes všechny hry).
import { CONFIG } from './config.js';

export function unlockedAccessories(totalFish) {
  return CONFIG.accessories.filter((a) => totalFish >= a.fish);
}

export function nextUnlock(totalFish) {
  const a = CONFIG.accessories.find((x) => x.fish > totalFish);
  return a ? { id: a.id, label: a.label, remaining: a.fish - totalFish, need: a.fish } : null;
}

// Nejvyšší ozdoba, která se odemkla mezi `before` a `after` rybičkami (nebo null).
export function newlyUnlocked(before, after) {
  let found = null;
  for (const a of CONFIG.accessories) if (a.fish > before && a.fish <= after) found = a;
  return found;
}

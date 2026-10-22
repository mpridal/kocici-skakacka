// Rekord a nastavení v localStorage. Každý přístup je v try/catch,
// při jakékoli chybě hra pokračuje s hodnotami v paměti.
import { CONFIG } from './config.js';

const KEY = 'kocka.v1';
const SKIN_IDS = CONFIG.skins.map((s) => s.id);
const ACCESSORY_IDS = CONFIG.accessories.map((a) => a.id);

function cleanName(v) {
  return typeof v === 'string' ? v.trim().slice(0, CONFIG.ui.nameMaxLength) : '';
}

function sanitize(raw) {
  const r = raw && typeof raw === 'object' ? raw : {};
  return {
    best: Number.isFinite(r.best) && r.best > 0 ? Math.floor(r.best) : 0,
    skin: SKIN_IDS.includes(r.skin) ? r.skin : SKIN_IDS[0],
    muted: r.muted === true,
    name: cleanName(r.name),
    tutorialDone: r.tutorialDone === true,
    totalFish: Number.isFinite(r.totalFish) && r.totalFish > 0 ? Math.floor(r.totalFish) : 0,
    accessory: ACCESSORY_IDS.includes(r.accessory) ? r.accessory : 'none',
    runHints: Number.isInteger(r.runHints) && r.runHints >= 0 ? Math.min(r.runHints, CONFIG.tutorial.runHints) : CONFIG.tutorial.runHints,
  };
}

// Bez argumentu použije localStorage; i samotný přístup k němu může vyhodit (zablokovaná data).
export function createStorage(...args) {
  let backend = null;
  try { backend = args.length ? args[0] : globalThis.localStorage; } catch { backend = null; }
  let state;
  try {
    state = sanitize(JSON.parse(backend?.getItem(KEY) ?? 'null'));
  } catch {
    state = sanitize(null);
  }

  const persist = () => {
    try { backend?.setItem(KEY, JSON.stringify(state)); } catch { /* jen v paměti */ }
  };

  return {
    getBest: () => state.best,
    setBest(n) {
      if (Number.isFinite(n) && n > state.best) {
        state.best = Math.floor(n);
        persist();
      }
    },
    getSettings: () => ({
      skin: state.skin, muted: state.muted, name: state.name, tutorialDone: state.tutorialDone,
      totalFish: state.totalFish, accessory: state.accessory, runHints: state.runHints,
    }),
    saveSettings(partial) {
      state = sanitize({ ...state, ...partial, name: cleanName(partial.name ?? state.name) });
      persist();
    },
  };
}

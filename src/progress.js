// Připsání výsledku hry (rybičky do sbírky, rekord). Volá se na konci hry, ale i při
// Domů, Konec a odchodu z aplikace, aby se nasbírané rybičky neztratily.
// Opakované volání přičte jen nové rybičky; rekord se porovnává s rekordem ze začátku hry.
import { newlyUnlocked } from './accessories.js';

export function creditRun(game, storage) {
  if (game.bestBefore == null) game.bestBefore = storage.getBest();
  const newFish = game.fish - (game.creditedFish || 0);
  game.creditedFish = game.fish;
  storage.setBest(game.score);
  const before = storage.getSettings().totalFish;
  if (newFish > 0) storage.saveSettings({ totalFish: before + newFish });
  return {
    record: game.score > game.bestBefore,
    unlocked: newFish > 0 ? newlyUnlocked(before, before + newFish) : null,
  };
}

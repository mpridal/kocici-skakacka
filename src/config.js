// Všechny herní konstanty na jednom místě. Obtížnost se ladí tady.
// Jednotky: délky v logických pixelech (plocha 1280×720), čas v sekundách.
export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

const deepFreeze = (o) => {
  Object.values(o).forEach((v) => { if (v && typeof v === 'object') deepFreeze(v); });
  return Object.freeze(o);
};

export const CONFIG = deepFreeze({
  maxDt: 1 / 30,        // delší snímek (např. po návratu z pozadí) se ořízne
  groundY: 600,         // výška země na obrazovce

  cat: {
    x: 300,                 // pozice kočky zleva (levá třetina)
    scale: 1.5,             // velikost kresby kočky
    gravity: 3000,
    jumpVelocity: 980,      // rychlost odrazu
    holdGravityFactor: 0.45, // při držení prstu klesá gravitace → vyšší skok
    maxHoldTime: 0.3,       // jak dlouho se dá skok „prodlužovat“
    hitboxShrink: 0.25,     // o kolik je kolizní box menší než kresba
  },

  speed: {
    start: 330,          // počáteční rychlost běhu (px/s)
    max: 560,            // strop rychlosti
    gainPerPoint: 0.15,  // o kolik px/s zrychlí za každý bod
  },

  score: {
    pointsPerPx: 0.025,  // body za uběhnutou vzdálenost
    fish: 10,            // body za rybičku
    heartBonus: 50,      // body za srdíčko při plných životech
  },

  lives: { start: 3, max: 5, invulnTime: 2 },

  obstacles: {
    reactionTime: 0.45,   // rezerva na reakci navíc k době skoku
    extraGapMin: 0.2,     // náhodná mezera navíc (v sekundách běhu)
    extraGapMax: 1.2,
    pairChance: 0.2,      // šance na dvojici avokád
    squirrelFromScore: 300,
    squirrelChance: 0.3,
  },

  // výška spodku veverky nad zemí
  squirrelLanes: { low: 45, mid: 115, high: 175 },

  pickups: { fishChance: 0.5, heartChance: 0.04 },

  dayNight: { cyclePoints: 700 },

  ui: { gameOverDelay: 1, parentHoldTime: 2, nameMaxLength: 12 },

  skins: [
    { id: 'mourek', label: 'Mourek', fur: '#B9BAC2', stripe: '#6F717C', eye: '#3A3238' },
    { id: 'zrzka', label: 'Zrzka', fur: '#F6B26B', stripe: '#E08A3C', eye: '#3A3238' },
    { id: 'cerna', label: 'Černá', fur: '#3F3A45', stripe: '#2C2830', eye: '#F4E7B0' },
    { id: 'bila', label: 'Bílá', fur: '#FBF8F3', stripe: '#E6DED2', eye: '#3A3238' },
    { id: 'pohadkova', label: 'Pohádková', fur: '#DDB3F2', stripe: '#B98AE0', eye: '#3A3238' },
  ],
});

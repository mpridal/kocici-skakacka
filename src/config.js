// Všechny herní konstanty na jednom místě. Obtížnost se ladí tady.
// Jednotky: délky v logických pixelech (plocha 1280×720), čas v sekundách.
export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;

// Jeden herní den (den → večer → noc → ráno) v bodech. Na začátku každého dne hra zrychlí.
const DAY_POINTS = 700;

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
    hitboxShrinkX: 0.4,     // o kolik je kolizní box užší než kresba (shovívavost)
    hitboxShrinkY: 0.25,    // o kolik je kolizní box nižší než kresba
  },

  speed: {
    start: 330,          // počáteční rychlost běhu (px/s)
    max: 730,            // strop rychlosti
    levelEvery: DAY_POINTS, // zrychlení jen na začátku nového herního dne (nápis „Den 2“, „Den 3“…)
    levelStep: 67,       // o kolik px/s každý nový den zrychlí (strop rychlosti v 7. dnu)
    rampTime: 1,         // za kolik sekund se plynule rozjede na novou rychlost
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
    densityPerDay: 0.25,  // každý herní den (po noci) se náhodná mezera navíc zmenší o 25 %
    extraGapFloor: 0.05,  // pod tuto náhodnou mezeru navíc už se nejde (povinná rezerva platí vždy)
    pairChance: 0.2,      // šance na dvojici avokád
    pairFromScore: 150,   // dvojice (potřebují vyšší skok) až od tolika bodů
    squirrelFromScore: 300,
    squirrelChance: 0.3,
    highLaneFromScore: 600, // vysoká dráha (pod veverkou se proběhne) až od tolika bodů
    avocadoScale: 1.3,    // velikost kresby avokáda
    squirrelScale: 1.1,   // velikost kresby veverky
    batScale: 0.75,       // velikost kresby netopýra (v noci místo veverky)
    hitboxShrink: 0.25,
  },

  // výška spodku veverky nad zemí: low = přeskočit, mid = vyšší skok, high = proběhnout pod ní
  squirrelLanes: { low: 20, mid: 70, high: 110 },

  pickups: {
    fishChance: 0.5,    // šance na oblouk rybiček v mezeře mezi překážkami
    heartChance: 0.04,  // šance na srdíčko
    fishScale: 1.5,
    heartScale: 2.2,
  },

  dayNight: { cyclePoints: DAY_POINTS },

  tutorial: { untilScore: 150, runHints: 3 }, // runHints = kolikrát ukázat „Běž dál!“ u vysoké veverky // nápověda ťukni/podrž, dokud hráč jednou nedosáhne tolika bodů

  ui: { gameOverDelay: 1, parentHoldTime: 2, nameMaxLength: 12 },

  // Ozdoby a kolik rybiček celkem je k nim potřeba: první brzy (i slabší hráč ji
  // dostane po 1–2 hrách), pak se latka postupně zvedá.
  accessories: [
    { id: 'none', label: 'Bez ozdoby', fish: 0 },
    { id: 'bow', label: 'Mašle', fish: 10 },
    { id: 'glasses', label: 'Brýle', fish: 30 },
    { id: 'flower', label: 'Kytička', fish: 60 },
    { id: 'crown', label: 'Korunka', fish: 100 },
    { id: 'mask', label: 'Maska', fish: 160 },
    { id: 'mustache', label: 'Knír', fish: 240 },
    { id: 'phone', label: 'Mobil', fish: 350 },
  ],

  skins: [
    { id: 'mourek', label: 'Pusheen', fur: '#B9BAC2', stripe: '#6F717C', eye: '#3A3238' },
    { id: 'zrzka', label: 'Perníček', fur: '#F6B26B', stripe: '#E08A3C', eye: '#3A3238' },
    { id: 'cerna', label: 'Tulísek', fur: '#3F3A45', stripe: '#2C2830', eye: '#F4E7B0' },
    { id: 'bila', label: 'Sněhulka', fur: '#FBF8F3', stripe: '#E6DED2', eye: '#3A3238' },
    { id: 'pohadkova', label: 'Mašlička', fur: '#DDB3F2', stripe: '#B98AE0', eye: '#3A3238' },
  ],
});

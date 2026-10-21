# Kočičí skákačka – implementační plán

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Offline PWA běhací/skákací hra pro Android tablet (kočička, avokáda, veverky, rybičky, srdíčka, 3 životy), hostovaná na GitHub Pages.

**Architecture:** Statické soubory, vanilla JS ES moduly bez buildu. Čistá herní logika (fyzika, generátor, kolize, stav hry, úložiště, den/noc, layout) v samostatných modulech bez DOM → testuje se `node --test`. Kreslení (`src/art/*`, `world.js`, `ui.js`) a vstup/zvuk jsou tenká vrstva nad logikou, ověřují se v prohlížeči. Herní smyčka `requestAnimationFrame` s delta time, logické rozlišení 1280×720.

**Tech Stack:** HTML5 Canvas 2D, Pointer Events, Web Audio API, Service Worker, Web App Manifest, Node 24 (`node --test`, jen pro testy a dev server, žádné npm závislosti), GitHub Actions → GitHub Pages.

**Spec:** `docs/specs/2026-10-21-kocici-skakacka-design.md` (upřesňuje `ZADANI_kocici_skakacka.md`; obojí číst). Vizuální vzor: `docs/mockups/postavicky-animace.html`.

## Global Constraints

- Kořen repozitáře: `C:\Users\Milos\OneDrive - ORIFLAME\Claude\Kocka`. Do gitu **nikdy**: `ZADANI_kocici_skakacka.md`, `docs/specs/`, `.private-names` (vše v `.gitignore`).
- Jméno dítěte nesmí být v žádném sledovaném souboru. Kontrola `node tools/check-names.mjs` (čte zakázaná slova z gitignorovaného `.private-names`) musí projít před každým commitem. V testech a příkladech používat jméno „Ema“.
- Veřejný název všude: „Kočičí skákačka“. Všechny texty ve hře česky, krátké, velké písmo, s ikonami.
- Žádné externí zdroje (CDN, fonty, obrázky, audio soubory). Grafika kreslená v kódu, zvuky přes Web Audio.
- `localStorage` jen přes `src/storage.js`, vše v try/catch.
- Logické rozlišení 1280×720, respektovat `devicePixelRatio`, delta time, žádné alokace objektů v herní smyčce (pooly, předem vytvořené `Path2D`).
- Barvy a tvary postaviček přesně dle specu a vzoru (obrys `#4A3F45`).
- Herní konstanty jen v `src/config.js`.
- Commity končí řádkem `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Před mazáním čehokoli: přesun do koše/zálohy (pravidlo uživatele). Push a vytvoření veřejného repozitáře jen po výslovném „ano“ uživatele.

## Review Focus

1. **Skok v době pauzy/návratu z pozadí:** po `visibilitychange` nebo dlouhém snímku nesmí dt „přeskočit“ překážku – `dt` se ořízne na `config.maxDt` (1/30 s). Test v Task 5.
2. **Ťuknutí na tlačítko nesmí skočit:** ťuk na „Hraj!“, „Znovu“, „Pokračovat“ nebo pauzu nesmí zároveň spustit skok ani hned po startu. Test v Task 10.
3. **Druhý prst / opakované ťukání ve vzduchu:** žádný dvojskok; nový skok až po dopadu, druhý prst během držení nic nezmění. Test v Task 3.
4. **Poškozené nebo nedostupné `localStorage`:** nevalidní JSON, vyhozená výjimka, záporný rekord → výchozí hodnoty, hra běží. Test v Task 2.
5. **Offline instalace selže kvůli chybějícímu souboru:** každý soubor v precache seznamu `sw.js` musí existovat a každý soubor, který hra načítá, musí být v seznamu. Test v Task 11.

---

## Struktura souborů

```
index.html                 – canvas, meta viewport, CSS (touch-action/user-select), registrace SW
manifest.webmanifest
sw.js                      – precache seznam + cache-first + update na pozadí
icons/icon-192.png, icon-512.png, icon-maskable-512.png
src/config.js              – všechny konstanty
src/storage.js             – rekord, nastavení (skin, muted, name)
src/viewport.js            – výpočet škálování/letterboxu, převod souřadnic dotyku
src/input.js               – Pointer/klávesnice → stav „drženo“ + hrany stisku
src/cat.js                 – stav a fyzika kočky (proměnná výška skoku)
src/collision.js           – shovívavé AABB
src/obstacles.js           – avokáda, veverky, férový generátor
src/pickups.js             – rybičky, srdíčka
src/game.js                – stav hry: skóre, životy, nezranitelnost, rychlost, konec
src/daynight.js            – fáze dne a interpolace barev
src/world.js               – kreslení pozadí, paralaxa, mraky, hvězdy, měsíc
src/art/shapes.js          – Path2D tvary ze vzoru (vytvořené jednou)
src/art/cat.js, avocado.js, squirrel.js, fish.js, heart.js, effects.js
src/audio.js               – efekty a hudba
src/ui.js                  – obrazovky, tlačítka, HUD, texty, rodičovské nastavení
src/main.js                – start, smyčka, přepínání obrazovek
tests/*.test.js            – node --test
tools/serve.mjs            – dev server (statické soubory, localhost:8080)
tools/check-names.mjs      – kontrola jména ve sledovaných souborech
tools/gallery.html         – náhled všech postaviček a stavů (dev, není v precache)
tools/make-icons.html      – vykreslí ikony do PNG (dev)
.github/workflows/deploy.yml
README.md, package.json, .gitignore
```

---

### Task 1: Kostra projektu, dev server, viewport

**Files:**
- Create: `.gitignore`, `.private-names`, `package.json`, `tools/serve.mjs`, `tools/check-names.mjs`, `index.html`, `src/config.js` (zatím jen `LOGICAL_W=1280`, `LOGICAL_H=720`), `src/viewport.js`, `src/main.js`, `tests/viewport.test.js`, `tests/check-names.test.js`
- Create (mimo repo): `C:\Users\Milos\OneDrive - ORIFLAME\Claude\.claude\launch.json` – konfigurace `kocka` = `node Kocka/tools/serve.mjs`, port 8080

**Interfaces:**
- Produces: `computeViewport(cssW, cssH, dpr) -> {scale, offsetX, offsetY, canvasW, canvasH, portrait}`; `toLogical(vp, clientX, clientY) -> {x, y}` v `src/viewport.js`. `npm test` = `node --test tests/`.

- [ ] **Step 1:** `git init` v `Kocka/`, `.gitignore` obsahuje `ZADANI_kocici_skakacka.md`, `docs/specs/`, `.private-names`, `.superpowers/`, `node_modules/`. `.private-names` = jedno zakázané slovo na řádek (vyplnit jménem dítěte a jeho zdrobnělinou, bez diakritiky i s ní).
- [ ] **Step 2: Failing testy** – `tests/viewport.test.js`:
  - `computeViewport(1280, 720, 1)` → `scale 1, offsetX 0, offsetY 0, portrait false`
  - `computeViewport(2000, 1200, 2)` (poměr 5:3) → `scale = 1200/720`, `offsetX = (2000-1280*scale)/2`, `offsetY 0`, `canvasW 4000`
  - `computeViewport(800, 1280, 1)` → `portrait true`
  - `toLogical` na středu obrazovky vrací `{x:640, y:360}` pro oba předchozí případy na šířku
  - `tests/check-names.test.js`: `findNameLeaks(files, words)` vrací nálezy pro soubor obsahující slovo (case-insensitive, i bez diakritiky) a prázdné pole pro čistý soubor.
- [ ] **Step 3:** Spustit `npm test` → FAIL (moduly neexistují).
- [ ] **Step 4:** Implementovat `src/viewport.js` (scale = min(cssW/1280, cssH/720), letterbox na střed, pozadí letterboxu dobarvit barvou nebe) a `tools/check-names.mjs` (exportuje `findNameLeaks`; při spuštění vezme `git ls-files`, načte `.private-names`, vypíše nálezy a skončí kódem 1; chybí-li `.private-names`, skončí kódem 1 s hláškou).
- [ ] **Step 5:** `npm test` → PASS.
- [ ] **Step 6:** `index.html`: `<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">`, `html,body{margin:0;height:100%;overflow:hidden;overscroll-behavior:none;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}`, `contextmenu` preventDefault, jeden `<canvas>`, `<script type="module" src="src/main.js">`. `main.js`: resize → `computeViewport`, rAF smyčka s `dt`, zatím kreslí nebe a zemi.
- [ ] **Step 7:** `preview_start kocka` → stránka bez chyb v konzoli, canvas vyplní okno, při `resize_window mobile` (na výšku) `portrait true`.
- [ ] **Step 8:** `node tools/check-names.mjs` → exit 0. Commit `chore: kostra projektu, viewport, dev server`.

### Task 2: Konfigurace a úložiště

**Files:** Modify `src/config.js`; Create `src/storage.js`, `tests/storage.test.js`

**Interfaces:**
- Produces: `CONFIG` (zmrazený objekt) se sekcemi níže. `createStorage(backend = globalThis.localStorage) -> {getBest(): number, setBest(n): void, getSettings(): {skin: string, muted: boolean, name: string}, saveSettings(partial): void}`. Klíč `kocka.v1`.
- Startovní hodnoty `CONFIG` (ladí se v Task 13): `maxDt 1/30`, `groundY 600`, `cat: {x 300, scale 1.5, gravity 3000, jumpVelocity 1000, holdGravityFactor 0.45, maxHoldTime 0.3, hitboxShrink 0.25}`, `speed: {start 330, max 560, gainPerPoint 0.15}`, `score: {pointsPerPx 0.025, fish 10, heartBonus 50}`, `lives: {start 3, max 5, invulnTime 2}`, `obstacles: {reactionTime 0.45, extraGapMin 0.2, extraGapMax 1.2, pairChance 0.2, squirrelFromScore 300, squirrelChance 0.3}`, `squirrelLanes: {low 45, mid 115, high 175}` (výška spodku veverky nad zemí v px), `pickups: {fishChance 0.5, heartChance 0.04}`, `dayNight: {cyclePoints 700}`, `ui: {gameOverDelay 1, parentHoldTime 2, nameMaxLength 12}`, `skins` = pole 5 skinů ze specu (`id`, `label`, `fur`, `stripe`, `eye`) v pořadí Mourek, Zrzka, Černá, Bílá, Pohádková.

- [ ] **Step 1: Failing testy** (`tests/storage.test.js`, s falešným backendem v paměti):
  - prázdné úložiště → `getBest() === 0`, `getSettings()` = `{skin:'mourek', muted:false, name:''}`
  - `setBest(1240)` → `getBest() === 1240`; `setBest(500)` po 1240 rekord nesníží
  - `saveSettings({name:'Ema'})` zachová `skin`; jméno delší než 12 znaků se ořízne na 12, mezery na okrajích pryč
  - backend, jehož `getItem` vyhodí výjimku → výchozí hodnoty, `setBest` nevyhodí
  - uložený nevalidní JSON nebo `best: -5` / neznámý `skin` → výchozí hodnoty
  - `backend = undefined` → funguje (jen v paměti)
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementovat `src/config.js` a `src/storage.js`.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: konfigurace a úložiště`.

### Task 3: Kočka – fyzika skoku a vstup

**Files:** Create `src/cat.js`, `src/input.js`, `tests/cat.test.js`, `tests/input.test.js`

**Interfaces:**
- Produces: `createCat() -> {y, vy, onGround, holdTime, state, animTime}` (`y` = výška nad zemí, 0 = na zemi; `state` ∈ `'run'|'jump'|'hurt'`). `updateCat(cat, dt, held: boolean, pressed: boolean)` – mutuje. `catHitbox(cat, out) -> out` `{x,y,w,h}` v logických souřadnicích, zmenšený o `hitboxShrink`.
- `createInput(target) -> {held, consumePress(): boolean, setBlocked(ms), attach(), detach()}` – Pointer Events (jakýkoli prst, ale `held` = alespoň jeden ukazatel dole), mezerník/šipka nahoru, myš. `consumePress()` vrátí `true` jednou za stisk. Jádro jako čistá funkce `reducePointer(state, event)` kvůli testům.

- [ ] **Step 1: Failing testy:**
  - stisk na zemi → `vy` = `-jumpVelocity`, `onGround false`
  - krátké ťuknutí (držení 0,05 s) dosáhne nižší maximální výšky než držení 0,3 s; držení 1 s dá stejnou výšku jako 0,3 s
  - max. výška při plném držení je v rozmezí 230–300 px, při ťuknutí 150–190 px (pro startovní CONFIG)
  - stisk ve vzduchu nic neudělá (žádný dvojskok); po dopadu `y === 0`, `onGround true`, nový stisk zase skočí
  - simulace s `dt` 1/60 a 1/120 dá stejnou max. výšku ±2 px
  - `reducePointer`: dva prsty dolů, jeden nahoru → `held` stále `true`; druhý prst dolů během držení **nevytvoří** nový stisk
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementovat: během držení (do `maxHoldTime`) a při stoupání gravitace × `holdGravityFactor`; semi-implicitní Euler.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: fyzika skoku kočky a vstup`.

### Task 4: Překážky, férový generátor, kolize

**Files:** Create `src/collision.js`, `src/obstacles.js`, `tests/collision.test.js`, `tests/obstacles.test.js`

**Interfaces:**
- Consumes: `CONFIG`, výšky skoku z Task 3 (pro výpočet doby ve vzduchu použít `jumpAirtime(holdTime)` exportovanou z `cat.js` – doplnit v tomto tasku, čistá simulace).
- Produces: `overlaps(a, b) -> boolean`; `shrinkBox(box, factor, out) -> out`. `createObstaclePool(size=16)`; `createSpawner(rng = Math.random) -> {update(pool, dt, speed, score)}`. Překážka: `{active, kind: 'avo-small'|'avo-big'|'avo-pair'|'squirrel', lane: 'low'|'mid'|'high'|null, x, w, h, bottom, blinkTimer, animTime}`. `obstacleHitbox(o, out)`.

- [ ] **Step 1: Failing testy:**
  - `overlaps` pro dotýkající se hrany → `false`, překryv 1 px → `true`; `shrinkBox(…,0.25)` zmenší šířku i výšku o 25 % se středem na místě
  - pro 20 seed RNG × 2000 spawnů a rychlosti `start`, `(start+max)/2`, `max`: mezera mezi zadní hranou překážky a přední hranou další je vždy ≥ `speed × (jumpAirtime(maxHoldTime) + reactionTime)`
  - veverka se nikdy neobjeví při `score < squirrelFromScore`; po něm se objeví (aspoň jednou ve 2000 spawnech)
  - veverka `low` jde přeskočit krátkým skokem, `mid` jen plným skokem (krátký skok koliduje, plný ne), `high` jde podběhnout na zemi (kočka na zemi nekoliduje) – ověřit simulací přes `catHitbox` a `obstacleHitbox`
  - pool: při 16 aktivních se nic nealokuje, nový spawn počká
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementovat; generátor drží „vzdálenost do dalšího spawnu“ = min. mezera + náhodná extra `extraGapMin…extraGapMax` × speed.
- [ ] **Step 4:** `npm test` → PASS. Commit `feat: avokáda, veverky, férový generátor, kolize`.

### Task 5: Stav hry a hratelné jádro

**Files:** Create `src/game.js`, `tests/game.test.js`; Modify `src/main.js`

**Interfaces:**
- Consumes: Task 2–4.
- Produces: `createGame(rng) -> game` s `{status:'playing'|'over', score, distance, fish, lives, invuln, speed, time, cat, obstacles, pickups, events}`; `stepGame(game, dt, held, pressed)`. `game.events` = znovupoužívané pole řetězců vyprázdněné na začátku kroku: `'jump'|'hit'|'fish'|'heart'|'heartBonus'|'over'`. `resetGame(game)`.

- [ ] **Step 1: Failing testy:**
  - `dt` 0,5 s se zpracuje jako `maxDt` (skóre přibude jako za 1/30 s)
  - skóre = `floor(distance × pointsPerPx) + fish × 10`
  - rychlost roste se skóre, nikdy nepřekročí `speed.max`
  - zásah: `lives` −1, `invuln = 2`, událost `'hit'`; během `invuln` další kolize nic neubere; po 2 s zase ano
  - při `lives === 0` → `status 'over'`, událost `'over'` právě jednou, další `stepGame` nic nemění
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implementovat `game.js`; v `main.js` napojit vstup a vykreslit **zástupné tvary** (obdélník kočky, zelené ovály avokád, hnědé ovály veverek, skóre a životy textem). Kliknutí po konci hry = nová hra.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** V preview: hra jde hrát mezerníkem i klikem, delší držení skočí výš, životy ubývají, po 3 zásazích konec. Screenshot. Commit `feat: hratelné jádro`.

### Task 6: Grafika postaviček

**Files:** Create `src/art/shapes.js`, `src/art/cat.js`, `src/art/avocado.js`, `src/art/squirrel.js`, `src/art/fish.js`, `src/art/heart.js`, `tools/gallery.html`; Modify `src/main.js`

**Interfaces:**
- Produces: `drawCat(ctx, x, groundY, scale, skin, pose: 'run'|'jump'|'hurt'|'blink'|'idle', t, blinking: boolean)`, `drawAvocado(ctx, x, groundY, scale, eyesClosed: boolean)`, `drawSquirrel(ctx, x, y, scale, t)`, `drawFish(ctx, x, y, scale, t, phase)`, `drawHeart(ctx, x, y, scale, fill)`. `t` = čas v s. Souřadnicový systém i tvary 1:1 ze vzoru (`(0,0)` = bod na zemi), cesty jako `Path2D` vytvořené jednou v `shapes.js`.

- [ ] **Step 1:** Přenést tvary ze `docs/mockups/postavicky-animace.html` do `shapes.js` a kreslicích funkcí. Animace dle vzoru: nohy ±32° křížem s periodou 0,6 s, poskok těla 2,5 px, ocásek kočky −12°…14°; rybí ocas `scaleX 1→0,25→1` kolem kořene (0,32 s), tělo `scaleX 0,94`; veverka: houpání ±7 px/0,9 s, ocas ±20° (0,12 s), packa −35°…25°, panenky skokové posuny ~1,4 px. Výrazy: `hurt` oči `> <` + pusa „o“, `blink` obloučky, `jump` náklon −12°. Skin černé kočky má světlé oči `#F4E7B0`.
- [ ] **Step 2:** Mrkání avokád: v `obstacles.js` každý kus má vlastní `blinkTimer` (náhodně 1,2–5 s, zavřeno 0,13 s, 25 % šance na dvojmrknutí) – doplnit test do `tests/obstacles.test.js`: dvě avokáda se stejným startem nemrkají ve stejný okamžik při různých seedech; zavřené oči trvají 0,13 s.
- [ ] **Step 3:** `npm test` → PASS.
- [ ] **Step 4:** `tools/gallery.html` vykreslí všech 5 skinů ve všech pózách, avokáda, veverku, rybu a srdce s běžící animací. V preview porovnat se vzorem (screenshot obou vedle sebe). Nahradit zástupné tvary v `main.js`.
- [ ] **Step 5:** Commit `feat: grafika a animace postaviček`.

### Task 7: Bonusy – rybičky a srdíčka

**Files:** Create `src/pickups.js`, `src/art/effects.js`, `tests/pickups.test.js`; Modify `src/game.js`, `src/obstacles.js` (sdílí rozestup se spawnerem)

**Interfaces:**
- Produces: `createPickupPool(size=24)`; spawner rybiček (oblouk 3–5 rybiček ve výšce dosažitelné skokem, nikdy přímo nad veverkou ani v ní) a srdíček (`heartChance`). Pickup `{active, kind:'fish'|'heart', x, y, phase}`. `createEffects(size=64)` + `spawnSparkles(effects, x, y)`, `updateEffects`, `drawEffects`.

- [ ] **Step 1: Failing testy:**
  - sebrání rybičky: `fish +1`, skóre +10, událost `'fish'`
  - srdíčko při `lives < 5`: `lives +1`, událost `'heart'`; při `lives === 5`: skóre +`heartBonus`, událost `'heartBonus'`
  - každý vygenerovaný pickup je ve výšce mezi 40 px a max. výškou plného skoku (aby šel chytit) a nepřekrývá hitbox překážky
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** Implementovat. **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** V preview: rybičky jdou chytit, hvězdičky se ukážou. Commit `feat: rybičky a srdíčka`.

### Task 8: Prostředí – paralaxa a den/noc

**Files:** Create `src/daynight.js`, `src/world.js`, `tests/daynight.test.js`; Modify `src/main.js`

**Interfaces:**
- Produces: `dayPhase(score) -> number` 0…1 (cyklus `cyclePoints`), `skyPalette(phase, out) -> out` `{skyTop, skyBottom, hillFar, hillNear, grass, path, starsAlpha, sunY, moonY}` jako hex řetězce/čísla. `createWorld()`, `updateWorld(world, dt, speed)`, `drawWorld(ctx, world, palette)`.

- [ ] **Step 1: Failing testy:**
  - `dayPhase(0)` = den; v cyklu den → večer → noc → ráno → den; `dayPhase(700)` = `dayPhase(0)`
  - denní paleta odpovídá specu (`#CDEBFA`, `#D5EFCB`, `#AEDDA2`, `#92CD7E`, `#F7E6C4`)
  - přechod je plynulý: mezi dvěma body vzdálenými 1 bod skóre se žádná složka barvy nezmění o víc než 8 (z 255)
  - noční nebe není tmavší než `#2E3A6B` (nic strašidelného), `starsAlpha` v noci 1, ve dne 0
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** Implementovat; 3 vrstvy paralaxy (mraky 0,1×, vzdálené kopce 0,25×, bližší 0,5× rychlosti), cestička 1×, hvězdy a měsíc v noci. **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** V preview projít celý cyklus (dočasně zvýšit rychlost přes `?debug=fast`). Commit `feat: paralaxa a střídání dne a noci`.

### Task 9: Zvuk a hudba

**Files:** Create `src/audio.js`; Modify `src/main.js`

**Interfaces:**
- Produces: `createAudio() -> {unlock(), setMuted(b), play(name), startMusic(), stopMusic()}`; `name` ∈ `'jump'|'fish'|'heart'|'hit'|'record'|'click'`. `unlock()` se volá z prvního pointerdown (vytvoří/resumne `AudioContext`). Vše bezpečné bez Web Audio (no-op).

- [ ] **Step 1:** Implementovat: „hop/mňau“ (krátký sweep nahoru), „cink“ (dva sinusové tóny), „bling“ (arpeggio), „au“ (jemný sestup, nízká hlasitost), fanfárka (4 tóny), smyčková melodie v dur, hlasitost hudby ~0,08. Hudba se při `muted` i při pauze zastaví.
- [ ] **Step 2:** Napojit na `game.events`. V preview ověřit, že po prvním kliku nejsou chyby v konzoli a `setMuted(true)` vše utiší. Commit `feat: zvuky a hudba`.

### Task 10: Obrazovky, HUD, texty

**Files:** Create `src/ui.js`, `tests/ui.test.js`; Modify `src/main.js`

**Interfaces:**
- Consumes: `storage`, `audio`, `drawCat` atd.
- Produces: `createUI(storage) -> ui`; `ui.screen` ∈ `'intro'|'playing'|'paused'|'over'|'parent'`; `ui.pointerDown(x, y, now) -> 'consumed'|'jump'` (logické souřadnice); `ui.update(dt, now)`; `ui.draw(ctx, game, t)`; `layoutButtons(screen) -> [{id, x, y, w, h}]`; `greeting(name) -> string`.

- [ ] **Step 1: Failing testy:**
  - `greeting('Ema')` = `'Ahoj, Ema!'`, `greeting('')` = `''`; text rekordu se jménem `'Nový rekord, Ema!'`, bez jména `'Nový rekord!'`
  - na `intro` ťuk na „Hraj!“ → `'consumed'`, `screen 'playing'` a následujících 250 ms vrací vstup do hry nic (žádný skok)
  - během `playing` ťuk na tlačítko pauzy → `'consumed'` a `screen 'paused'`; ťuk mimo tlačítka → `'jump'`
  - na `over` tlačítka „Znovu“/„Domů“ nereagují dřív než `gameOverDelay` (1 s) po konci
  - rodičovské nastavení se otevře jen po držení ikonky ≥ `parentHoldTime` (2 s); kratší držení nic
  - `layoutButtons` pro každou obrazovku: všechna tlačítka uvnitř 1280×720 a min. 96×96 px, žádná se nepřekrývají
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** Implementovat obrazovky dle zadání:
  - Úvod: „Kočičí skákačka“, pozdrav, mrkající kočka, výběr barvy (5 koleček + šipky), „Hraj!“, rekord s ikonou pohárku, tlačítko zvuku, ozubené kolečko (rodič).
  - Hra: HUD dle specu (až 5 srdíček), pauza.
  - Pauza: „Pauza“, „Pokračovat“, „Domů“; auto-pauza na `visibilitychange`.
  - Konec: „Konec hry!“, skóre, rybičky, při rekordu „Nový rekord…“ + konfety + fanfárka, „Znovu“, „Domů“.
  - Rodič: pole jména (skrytý `<input>` překrytý nad canvasem jen na této obrazovce, `maxlength 12`), „Uložit“, „Zpět“.
  - Na výšku: výzva „Otoč tablet“ s ikonou otáčení, hra pozastavena.
  - Fullscreen API po prvním ťuknutí, pokud `display-mode` není `fullscreen`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** V preview (tablet na šířku i na výšku) projít všechny obrazovky, screenshot každé. Commit `feat: obrazovky, HUD a české texty`.

### Task 11: PWA a offline

**Files:** Create `manifest.webmanifest`, `sw.js`, `tools/make-icons.html`, `icons/*.png`, `tests/precache.test.js`; Modify `index.html`

**Interfaces:**
- Produces: `sw.js` exportuje pro testy seznam přes `self.PRECACHE` a konstantu `CACHE_VERSION` (např. `'kocka-v1'`).

- [ ] **Step 1: Failing test** `tests/precache.test.js`: načte `sw.js` jako text, vytáhne precache seznam; každý soubor existuje na disku; každý soubor v `src/**/*.js`, `index.html`, `manifest.webmanifest` a `icons/*.png` je v seznamu; `tools/` a `tests/` v seznamu nejsou.
- [ ] **Step 2:** `npm test` → FAIL. **Step 3:** Implementovat: manifest (`name`/`short_name` „Kočičí skákačka“, `start_url "./"`, `scope "./"`, `display "fullscreen"`, `orientation "landscape"`, `theme_color`/`background_color "#CDEBFA"`, ikony 192, 512, maskable 512); SW: install = precache, activate = smazat staré cache + `clients.claim()`, fetch = cache-first s fallbackem na `index.html` pro navigaci, nová verze se neaktivuje uprostřed hry (bez `skipWaiting` během hry; aktivace při dalším spuštění). Ikony vykreslit v `tools/make-icons.html` (hlavička Mourka na `#CDEBFA`, maskable s bezpečnou zónou 80 %) a uložit jako PNG.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5:** V preview: DevTools Application → manifest bez chyb, SW aktivní; poté offline (přes `javascript_tool` ověřit `caches`, pak přepnout síť offline a reload) → hra startuje. Commit `feat: PWA a offline režim`.

### Task 12: README, deploy workflow, zveřejnění

**Files:** Create `README.md`, `.github/workflows/deploy.yml`

- [ ] **Step 1:** `deploy.yml`: při push na `main` spustit `node --test tests/` a nasadit kořen repozitáře přes `actions/upload-pages-artifact` + `actions/deploy-pages` (bez `tools/`, `tests/`, `docs/`).
- [ ] **Step 2:** README (česky, pro rodiče): co to je; jak repozitář nasadit (vytvořit veřejný repozitář `kocici-skakacka`, Settings → Pages → Source: GitHub Actions); jak otevřít na tabletu v Chrome a „Přidat na plochu“/„Nainstalovat aplikaci“; že první spuštění potřebuje internet, pak běží offline; jak vložit jméno přes ozubené kolečko (držet 2 s); jak se dostane aktualizace; tabulka nejdůležitějších konstant v `src/config.js` a co dělají.
- [ ] **Step 3:** `npm test` a `node tools/check-names.mjs` → PASS, `git status` neukazuje `ZADANI…` ani `docs/specs/`. Commit `docs: README a deploy workflow`.
- [ ] **Step 4: Zastavit se a zeptat uživatele.** `gh` není nainstalované: uživatel vytvoří prázdný veřejný repozitář `kocici-skakacka` na svém osobním účtu a pošle URL. Teprve po výslovném „ano“: `git remote add origin <URL>`, `git push -u origin main`, zkontrolovat běh Actions a výslednou adresu `https://<účet>.github.io/kocici-skakacka/`.

### Task 13: Ladění obtížnosti a závěrečné ověření

**Files:** Modify `src/config.js` (jen hodnoty)

- [ ] **Step 1:** V preview s emulací tabletu na šířku (1280×800, dotyk) odehrát hru: start musí být výrazně pomalejší než Chrome dino, prvních ~30 s jen avokáda, veverky od 300 bodů, rychlost na stropě až po několika minutách. Upravit hodnoty v `config.js`, `npm test` → PASS.
- [ ] **Step 2:** Ověřit plynulost: měřit průměrné dt v konzoli přes 10 s, bez záseků z GC (Performance panel / `performance.memory` stabilní).
- [ ] **Step 3:** Projít „Hotovo, když“ ze zadání bod po bodu a výsledek sepsat uživateli. Commit `tune: obtížnost pro malé hráče`.

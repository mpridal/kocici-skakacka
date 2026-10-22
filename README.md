# Kočičí skákačka 🐱

Jednoduchá hra pro děti na Android tablet. Kočička běží, skáče přes avokáda, podbíhá nebo přeskakuje veverky a chytá rybičky. Má 3 srdíčka, takže jedna chyba hru neukončí.

- Ovládání: **ťuknutí kamkoliv = skok**, delší podržení = vyšší skok.
- Na PC: mezerník nebo šipka nahoru (a klik myší).
- Hraje se na šířku a **bez internetu** (po první instalaci).
- Žádné reklamy, účty ani sledování. Vše zůstává v tabletu.

## Pro rodiče

### 1. Nasazení na GitHub (jednou)

1. Na github.com vytvořte **veřejný** repozitář `kocici-skakacka` a nahrajte do něj obsah této složky.
2. V repozitáři otevřete **Settings → Pages** a jako **Source** zvolte **GitHub Actions**.
3. Po každém nahrání změn (push do větve `main`) se spustí testy a hra se sama nasadí. Průběh je vidět na záložce **Actions**.
4. Hra pak běží na adrese `https://<váš-účet>.github.io/kocici-skakacka/`.

### 2. Instalace na tablet (potřebuje internet jen jednou)

1. Na tabletu otevřete adresu hry v **Chrome**.
2. Počkejte, až se úvodní obrazovka načte (hra se při tom uloží do tabletu).
3. V menu Chrome (⋮) zvolte **Přidat na plochu** nebo **Nainstalovat aplikaci**.
4. Hru pak spouštějte ikonou kočičky na ploše. Funguje i v režimu letadlo.

### Dětský účet s rodičovskou kontrolou (Google Family Link)

Na telefonu nebo tabletu s dětským účtem:

1. V aplikaci **Family Link** na rodičovském telefonu: dítě → **Ovládací prvky** → **Google Chrome a web** → **Spravovat weby → Schválené** → přidat doménu **`mpridal.github.io`**. Zadejte doménu, ne celou adresu hry – pravidlo pro jednu adresu by nepovolilo ostatní soubory hry.
2. Pak na zařízení dítěte otevřete hru přímo v **Chrome** (ne z odkazu v jiné aplikaci) a nainstalujte ji přes ⋮ → **Přidat na plochu / Nainstalovat**.
3. Pokud se nainstalovaná aplikace nespustí nebo se hned zavře, zapněte na zařízení **automatické otáčení displeje**.
4. Vibrace se řídí nastavením telefonu (intenzita, Nerušit, šetřič baterie) – hra si je vynutit nemůže. Při zásahu se proto obraz vždy i zatřese a okraje zčervenají.
5. Na některých telefonech **Xiaomi / Redmi (HyperOS)** Chrome volbu „Přidat na plochu“ vůbec nenabízí (ani u jiných webů). Pak lze hrát v Chrome přes záložku – hra funguje i offline.

### 3. Jméno dítěte

Na úvodní obrazovce je vpravo dole malé ozubené kolečko. **Podržte ho asi 2 sekundy.** Otevře se okno pro rodiče, kde jde zadat jméno (max. 12 znaků). Hra pak dítě pozdraví a pochválí při rekordu. Jméno se ukládá jen v tabletu, nikam se neodesílá.

### 4. Aktualizace

Když nahrajete novou verzi na GitHub a tablet bude připojený k internetu, nová verze se stáhne na pozadí. Hra se na ni sama přepne, jakmile je na **úvodní obrazovce** (krátce se znovu načte). Rozehraná hra se nikdy nepřeruší.

### 5. Úprava obtížnosti

Všechna nastavení jsou v souboru [`src/config.js`](src/config.js). Nejdůležitější:

| Nastavení | Co dělá | Výchozí |
|---|---|---|
| `speed.start` | počáteční rychlost běhu | 330 |
| `speed.max` | nejvyšší rychlost (strop) | 730 |
| `speed.levelEvery` | hra zrychlí na začátku každého herního dne (nápis „Den 2“, „Den 3“…) | 700 (= jeden den) |
| `speed.levelStep` | o kolik každý nový den zrychlí (strop v 7. dnu) | 67 |
| `cat.jumpVelocity` | síla odrazu (výška skoku) | 980 |
| `cat.maxHoldTime` | jak dlouho jde skok prodlužovat držením | 0.3 s |
| `cat.hitboxShrinkX` / `Y` | o kolik je kolize shovívavější než obrázek | 0.4 / 0.25 |
| `lives.start` / `lives.max` | počet srdíček na začátku / maximum | 3 / 5 |
| `lives.invulnTime` | jak dlouho kočička po zásahu bliká a nic ji nezraní | 2 s |
| `obstacles.reactionTime` | rezerva na reakci mezi překážkami | 0.45 s |
| `obstacles.extraGapMin` / `Max` | náhodná mezera navíc mezi překážkami | 0.2–1.2 s |
| `obstacles.squirrelFromScore` | od kolika bodů létají veverky | 300 |
| `obstacles.highLaneFromScore` | od kolika bodů létají veverky i vysoko (pod nimi se proběhne, nápověda „Běž dál!“ u prvních tří) | 600 |
| `pickups.fishChance` | jak často se objeví rybičky | 0.5 |
| `pickups.heartChance` | jak často se objeví srdíčko | 0.04 |
| `dayNight.cyclePoints` | po kolika bodech se střídá den a noc | 700 |
| `obstacles.pairFromScore` | od kolika bodů chodí dvojice avokád | 150 |
| `obstacles.densityPerDay` | o kolik se každý herní den (po noci) zhustí překážky – povinná mezera na skok zůstává | 25 % |
| `tutorial.untilScore` | nápověda „Ťukni / Podrž prst“, dokud dítě jednou nedosáhne tolika bodů | 150 |
| `accessories` | ozdoby kočičky a kolik rybiček celkem je k nim potřeba (první brzy, pak latka roste) | mašle 10, brýle 30, kytička 60, korunka 100, maska 160, knír 240, mobil 350 |

Po úpravě spusťte testy (`npm test`), které hlídají, že hra zůstane férová (vždy dost místa na skok).

## Pro vývoj

- `npm run serve` spustí místní server na http://localhost:8080/.
- `npm test` spustí testy (Node 24 – stejně jako na GitHubu; bez dalších balíčků).
- `node tools/install-hook.mjs` jednou nainstaluje kontrolu, že se jméno dítěte nedostane do commitu (zakázaná slova jsou v souboru `.private-names`, který git nesleduje).
- Užitečné parametry adresy: `?nosw` (bez offline cache), `?boxes` (zobrazí kolizní boxy), `?fast` (rychlé střídání dne a noci).
- `tools/gallery.html` ukáže všechny postavičky a animace. `tools/make-icons.html?save` znovu vyrobí ikony.
- Pokud vývojový prohlížeč drží starou verzi, odregistrujte service worker (DevTools → Application → Service workers).

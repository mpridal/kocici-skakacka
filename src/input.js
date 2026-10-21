// Vstup: dotyk / myš (Pointer Events) a klávesnice (mezerník, šipka nahoru).
// Skok vzniká jen z ťuknutí, které nespotřebovalo tlačítko na obrazovce.

export function createPointerState() {
  return { ids: [], held: false, pressCount: 0 };
}

// type: 'down' | 'up' | 'cancel'; allowJump jen pro 'down'.
export function reducePointer(s, type, id, allowJump = false) {
  const i = s.ids.indexOf(id);
  if (type === 'down') {
    if (i !== -1 || !allowJump) return s;
    if (s.ids.length === 0) s.pressCount++;
    s.ids.push(id);
  } else if (i !== -1) {
    s.ids.splice(i, 1);
  }
  s.held = s.ids.length > 0;
  return s;
}

// target = canvas; onDown(clientX, clientY) vrací true, pokud má ťuk skákat.
export function createInput(target, onDown) {
  const s = createPointerState();
  let consumed = 0;

  const down = (e) => {
    e.preventDefault();
    reducePointer(s, 'down', e.pointerId, onDown(e.clientX, e.clientY));
  };
  const up = (e) => reducePointer(s, e.type === 'pointercancel' ? 'cancel' : 'up', e.pointerId);
  const isJumpKey = (e) => e.code === 'Space' || e.code === 'ArrowUp';
  const keyDown = (e) => {
    if (!isJumpKey(e)) return;
    e.preventDefault();
    if (e.repeat) return;
    reducePointer(s, 'down', 'key', onDown(-1, -1));
  };
  const keyUp = (e) => { if (isJumpKey(e)) reducePointer(s, 'up', 'key'); };
  const blur = () => { s.ids.length = 0; s.held = false; };

  return {
    get held() { return s.held; },
    consumePress() {
      if (s.pressCount > consumed) { consumed = s.pressCount; return true; }
      return false;
    },
    // Zahodí nevyzvednuté stisky (např. při přepnutí obrazovky).
    clearPress() { consumed = s.pressCount; },
    attach() {
      target.addEventListener('pointerdown', down);
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
      window.addEventListener('keydown', keyDown);
      window.addEventListener('keyup', keyUp);
      window.addEventListener('blur', blur);
    },
  };
}

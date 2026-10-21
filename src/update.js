// Automatický přechod na novou verzi: stažená verze (čekající service worker) se zapne,
// jen když je hra na úvodní obrazovce – nikdy uprostřed hraní.

export function shouldApplyUpdate(screen, hasWaiting, hasController) {
  return screen === 'intro' && hasWaiting && hasController;
}

// getScreen() vrací aktuální obrazovku; kontroluje se jednou za pár sekund.
export function startAutoUpdate(getScreen) {
  const sw = globalThis.navigator?.serviceWorker;
  if (!sw) return;
  let requested = false;
  sw.addEventListener('controllerchange', () => {
    if (requested) location.reload(); // první instalace (bez žádosti) stránku nepřenačítá
  });
  sw.getRegistration().then((reg) => {
    if (!reg) return;
    reg.update().catch(() => {});
    setInterval(() => {
      if (requested || !shouldApplyUpdate(getScreen(), !!reg.waiting, !!sw.controller)) return;
      requested = true;
      reg.waiting.postMessage('skipWaiting');
    }, 3000);
  }).catch(() => {});
}

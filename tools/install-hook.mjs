// Nainstaluje lokální git hook: před každým commitem zkontroluje, že v souborech není jméno dítěte.
// Spuštění: node tools/install-hook.mjs
import { writeFileSync, chmodSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hook = join(root, '.git', 'hooks', 'pre-commit');
writeFileSync(hook, '#!/bin/sh\nnode tools/check-names.mjs || exit 1\n');
try { chmodSync(hook, 0o755); } catch { /* Windows */ }
console.log('Hook nainstalován:', hook);

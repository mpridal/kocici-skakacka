// Kontrola, že jméno dítěte není v žádném souboru sledovaném gitem.
// Zakázaná slova jsou v gitignorovaném souboru .private-names (jedno na řádek).
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function findNameLeaks(files, words) {
  const needles = words.map(fold).filter(Boolean);
  const leaks = [];
  for (const { path, text } of files) {
    const lines = fold(text).split('\n');
    lines.forEach((line, i) => {
      for (const w of needles) {
        if (line.includes(w)) leaks.push({ path, line: i + 1, word: w });
      }
    });
  }
  return leaks;
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const namesFile = join(root, '.private-names');
  if (!existsSync(namesFile)) {
    console.error('Chybí .private-names – kontrolu nejde provést.');
    process.exit(1);
  }
  const words = readFileSync(namesFile, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: root, encoding: 'utf8' })
    .split('\n').filter(Boolean);
  const files = tracked
    .filter((p) => !/\.(png|ico|jpg)$/i.test(p))
    .map((p) => ({ path: p, text: readFileSync(join(root, p), 'utf8') }));
  const leaks = findNameLeaks(files, words);
  if (leaks.length) {
    for (const l of leaks) console.error(`${l.path}:${l.line} obsahuje zakázané slovo`);
    process.exit(1);
  }
  console.log(`OK – ${files.length} souborů bez jména.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) main();

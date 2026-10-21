import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function precacheList() {
  const sw = readFileSync(join(root, 'sw.js'), 'utf8');
  const m = sw.match(/const PRECACHE = (\[[\s\S]*?\]);/);
  assert.ok(m, 'sw.js musí obsahovat const PRECACHE = [...]');
  return new Function(`return ${m[1]}`)();
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(join(root, dir))) {
    const rel = `${dir}/${name}`;
    if (statSync(join(root, rel)).isDirectory()) out.push(...walk(rel));
    else out.push(rel);
  }
  return out;
}

test('každý soubor v offline seznamu existuje', () => {
  for (const f of precacheList()) {
    if (f === './') continue;
    assert.ok(existsSync(join(root, f)), `chybí ${f}`);
  }
});

test('offline seznam obsahuje všechno, co hra potřebuje', () => {
  const list = new Set(precacheList());
  const needed = [
    './', 'index.html', 'manifest.webmanifest',
    ...walk('src').filter((f) => f.endsWith('.js')),
    ...walk('icons').filter((f) => f.endsWith('.png')),
  ];
  for (const f of needed) assert.ok(list.has(f), `v offline seznamu chybí ${f}`);
});

test('vývojové soubory v offline seznamu nejsou', () => {
  for (const f of precacheList()) {
    assert.ok(!/^(tools|tests|docs)\//.test(f), `${f} nepatří do hry`);
  }
});

test('manifest: název, fullscreen, na šířku, ikony', () => {
  const m = JSON.parse(readFileSync(join(root, 'manifest.webmanifest'), 'utf8'));
  assert.equal(m.name, 'Kočičí skákačka');
  assert.equal(m.display, 'fullscreen');
  assert.equal(m.orientation, 'landscape');
  const sizes = m.icons.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  assert.ok(m.icons.some((i) => (i.purpose || '').includes('maskable')));
  for (const i of m.icons) assert.ok(existsSync(join(root, i.src)), `chybí ${i.src}`);
});

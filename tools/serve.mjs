// Jednoduchý dev server statických souborů (jen pro vývoj, http://localhost:8080).
import { createServer } from 'node:http';
import { readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, normalize, extname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT) || 8080;
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.md': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  // Dev pomůcka: POST /__shot s data-URL plátna uloží snímek do .superpowers/shot.png
  // Dev pomůcka: POST /__save?path=icons/x.png uloží ikonu z tools/make-icons.html (jen do icons/).
  const url = new URL(req.url, 'http://x');
  if (req.method === 'POST' && (url.pathname === '/__shot' || url.pathname === '/__save')) {
    const rel = url.pathname === '/__shot' ? '.superpowers/shot.png' : url.searchParams.get('path') || '';
    if (url.pathname === '/__save' && !/^icons\/[\w-]+\.png$/.test(rel)) {
      res.writeHead(400);
      res.end('jen icons/*.png');
      return;
    }
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', async () => {
      const file = join(root, rel);
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, Buffer.from(body.split(',')[1] || '', 'base64'));
      res.end('ok');
    });
    return;
  }
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (path.endsWith('/')) path += 'index.html';
    const file = normalize(join(root, path));
    if (!file.startsWith(root)) throw new Error('mimo kořen');
    const info = await stat(file);
    if (!info.isFile()) throw new Error('není soubor');
    res.writeHead(200, {
      'Content-Type': types[extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(await readFile(file));
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Nenalezeno');
  }
}).listen(port, () => console.log(`Kočičí skákačka: http://localhost:${port}/`));

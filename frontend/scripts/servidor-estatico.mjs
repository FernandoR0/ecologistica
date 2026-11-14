// Servidor estatico para probar el build (dist/) igual que en produccion.
// Uso: node scripts/servidor-estatico.mjs [carpeta] [puerto] [--plano]
//   --plano  sirve los archivos sin compresion ni cache (sirve para medir el "antes")
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const args = process.argv.slice(2);
const plano = args.includes('--plano');
const [carpeta = 'dist', puerto = '4173'] = args.filter((a) => !a.startsWith('--'));
const raiz = resolve(carpeta);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

createServer((req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let archivo = normalize(join(raiz, ruta));
  if (!archivo.startsWith(raiz)) {
    res.writeHead(403).end();
    return;
  }
  if (!existsSync(archivo) || statSync(archivo).isDirectory()) archivo = join(raiz, 'index.html'); // SPA

  const ext = extname(archivo);
  const cabeceras = { 'Content-Type': TIPOS[ext] ?? 'application/octet-stream' };

  if (!plano) {
    // Archivos con hash en el nombre: cache de un ano. El index.html siempre se revalida.
    cabeceras['Cache-Control'] = ruta.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
    cabeceras.Vary = 'Accept-Encoding';
    const acepta = req.headers['accept-encoding'] ?? '';
    for (const [token, sufijo] of [['br', '.br'], ['gzip', '.gz']]) {
      if (acepta.includes(token) && existsSync(archivo + sufijo)) {
        cabeceras['Content-Encoding'] = token;
        archivo += sufijo;
        break;
      }
    }
  }
  res.writeHead(200, cabeceras);
  createReadStream(archivo).pipe(res);
}).listen(Number(puerto), () => console.log(`Sirviendo ${raiz} en http://localhost:${puerto}${plano ? ' (sin optimizar)' : ''}`));

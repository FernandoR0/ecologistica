// Servidor estatico para probar el build (dist/) igual que en produccion.
// Uso: node scripts/servidor-estatico.mjs [carpeta] [puerto] [--plano]
//   --plano  sirve los archivos sin compresion ni cache (sirve para medir el "antes")
//
// Solo entrega archivos que existen en la carpeta al arrancar: la ruta pedida se busca en esa
// lista y nunca se usa directamente para leer del disco.
import { createServer } from 'node:http';
import { createReadStream, readdirSync } from 'node:fs';
import { extname, join, relative, resolve, sep } from 'node:path';

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

/** Mapa "/assets/x.js" -> ruta absoluta, armado una sola vez al iniciar. */
const archivos = new Map();
const recorrer = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const ruta = join(dir, e.name);
    if (e.isDirectory()) recorrer(ruta);
    else archivos.set('/' + relative(raiz, ruta).split(sep).join('/'), ruta);
  }
};
recorrer(raiz);
const INDEX = archivos.get('/index.html');

createServer((req, res) => {
  let clave;
  try {
    clave = decodeURIComponent((req.url ?? '/').split('?')[0]);
  } catch {
    res.writeHead(400).end();
    return;
  }
  // SPA: cualquier ruta que no sea un archivo conocido devuelve index.html
  let archivo = archivos.get(clave) ?? INDEX;
  const ext = extname(archivo);
  const cabeceras = { 'Content-Type': TIPOS[ext] ?? 'application/octet-stream' };

  if (!plano) {
    // Archivos con hash en el nombre: cache de un ano. El index.html siempre se revalida.
    cabeceras['Cache-Control'] = clave.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
    cabeceras.Vary = 'Accept-Encoding';
    const acepta = req.headers['accept-encoding'] ?? '';
    for (const [token, sufijo] of [['br', '.br'], ['gzip', '.gz']]) {
      const comprimido = archivos.get((archivo === INDEX ? '/index.html' : clave) + sufijo);
      if (acepta.includes(token) && comprimido) {
        cabeceras['Content-Encoding'] = token;
        archivo = comprimido;
        break;
      }
    }
  }
  res.writeHead(200, cabeceras);
  createReadStream(archivo).pipe(res);
}).listen(Number(puerto), () => console.log(`Sirviendo ${raiz} en el puerto ${puerto}${plano ? ' (sin optimizar)' : ''}`));

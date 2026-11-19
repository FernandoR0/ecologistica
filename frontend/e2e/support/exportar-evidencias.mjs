// Exporta un resumen versionable de la corrida y una captura del reporte HTML.
// Uso: node e2e/support/exportar-evidencias.mjs <carpeta-destino>
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const destino = resolve(process.argv[2] ?? 'evidencias');
mkdirSync(destino, { recursive: true });

const r = JSON.parse(readFileSync(join('test-results', 'results.json'), 'utf8'));
const casos = [];
const recorrer = (suite) => {
  for (const s of suite.suites ?? []) recorrer(s);
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests ?? []) {
      casos.push({ archivo: spec.file, caso: spec.title, navegador: t.projectName, estado: t.status, duracion_ms: t.results[0]?.duration });
    }
  }
};
recorrer(r);
writeFileSync(join(destino, 'resultados-playwright.json'), JSON.stringify({
  fecha: new Date().toISOString(), total: casos.length, aprobadas: casos.filter((c) => c.estado === 'expected').length, casos,
}, null, 2));

const dirMetricas = join('test-results', 'metricas');
if (existsSync(dirMetricas)) for (const f of readdirSync(dirMetricas)) copyFileSync(join(dirMetricas, f), join(destino, f));

const navegador = await chromium.launch();
const pagina = await navegador.newPage({ viewport: { width: 1280, height: 900 } });
await pagina.goto(pathToFileURL(resolve('playwright-report', 'index.html')).href);
await pagina.waitForTimeout(1500);
await pagina.screenshot({ path: join(destino, 'reporte-html.png') });
await navegador.close();
console.log(`Evidencias en ${destino}`);

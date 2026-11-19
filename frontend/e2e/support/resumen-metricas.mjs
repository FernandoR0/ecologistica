// Resume test-results/metricas/*.json y test-results/results.json en Markdown.
// Uso: node e2e/support/resumen-metricas.mjs  (en GitHub Actions se agrega al resumen del job)
import { appendFileSync, existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = join('test-results', 'metricas');
const lineas = ['## Resultados de Playwright', ''];

if (existsSync(join('test-results', 'results.json'))) {
  const r = JSON.parse(readFileSync(join('test-results', 'results.json'), 'utf8'));
  const porNavegador = {};
  const recorrer = (suite) => {
    for (const s of suite.suites ?? []) recorrer(s);
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests ?? []) {
        const n = (porNavegador[t.projectName] ??= { total: 0, ok: 0 });
        n.total += 1;
        if (t.status === 'expected') n.ok += 1;
      }
    }
  };
  recorrer(r);
  lineas.push('| Navegador | Aprobadas | Total | Éxito |', '|---|---:|---:|---:|');
  for (const [nav, n] of Object.entries(porNavegador)) {
    lineas.push(`| ${nav} | ${n.ok} | ${n.total} | ${((n.ok / n.total) * 100).toFixed(1)} % |`);
  }
  lineas.push('');
}

if (existsSync(dir)) {
  const metricas = readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
  const vitals = metricas.filter((m) => m.prueba === 'web-vitals');
  if (vitals.length) {
    lineas.push('| Navegador | TTFB (ms) | FCP (ms) | LCP (ms) | Bytes transferidos |', '|---|---:|---:|---:|---:|');
    for (const m of vitals) lineas.push(`| ${m.navegador} | ${m.ttfb_ms} | ${m.fcp_ms} | ${m.lcp_ms ?? 'no soportado'} | ${m.bytes ?? '-'} |`);
    lineas.push('');
  }
  const apis = metricas.filter((m) => m.prueba === 'tiempos-api');
  if (apis.length) {
    lineas.push('| Navegador | Endpoint | Tiempo (ms) |', '|---|---|---:|');
    for (const m of apis) for (const [ep, ms] of Object.entries(m.endpoints)) lineas.push(`| ${m.navegador} | ${ep} | ${ms} |`);
    lineas.push('');
  }
  const sondeos = metricas.filter((m) => m.prueba === 'disponibilidad');
  if (sondeos.length) {
    lineas.push('| Navegador | Destino | Disponibilidad | p50 (ms) | p95 (ms) |', '|---|---|---:|---:|---:|');
    for (const m of sondeos) {
      for (const d of m.destinos) lineas.push(`| ${m.navegador} | ${d.destino} | ${d.exitosas}/${d.total} | ${d.p50_ms} | ${d.p95_ms} |`);
    }
  }
}

const texto = lineas.join('\n') + '\n';
console.log(texto);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, texto);

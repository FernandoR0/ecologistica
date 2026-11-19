import { expect, test } from '@playwright/test';
import { iniciarSesion, irA, registrarMetrica } from './support/fixtures';

// Presupuestos: umbrales "buenos" de Core Web Vitals y RNF-003 del proyecto
const PRESUPUESTO = { ttfb: 800, fcp: 1800, lcp: 2500, api: 500 };

test.describe('Monitoreo de rendimiento', () => {
  test('TTFB, FCP y LCP de la pantalla de acceso dentro del presupuesto @public', async ({ page }, info) => {
    // El observador de LCP se registra antes de que cargue la página
    await page.addInitScript(() => {
      (window as unknown as { __lcp: number }).__lcp = 0;
      try {
        new PerformanceObserver((lista) => {
          for (const e of lista.getEntries()) (window as unknown as { __lcp: number }).__lcp = e.startTime;
        }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch {
        (window as unknown as { __lcp: number }).__lcp = -1; // navegador sin la API de LCP
      }
    });
    await page.goto('/login', { waitUntil: 'load' });
    await expect(page.getByLabel('Correo')).toBeVisible();
    await page.waitForTimeout(500);
    const m = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const recursos = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const lcp = (window as unknown as { __lcp: number }).__lcp;
      return {
        ttfb_ms: Math.round(nav.responseStart - nav.startTime),
        fcp_ms: fcp ? Math.round(fcp.startTime) : null,
        lcp_ms: lcp > 0 ? Math.round(lcp) : null,
        load_ms: Math.round(nav.loadEventEnd - nav.startTime),
        bytes: Math.round(nav.transferSize + recursos.reduce((t, r) => t + (r.transferSize || 0), 0)),
      };
    });
    registrarMetrica(info, 'web-vitals', m);
    expect(m.ttfb_ms).toBeLessThan(PRESUPUESTO.ttfb);
    if (m.fcp_ms !== null) expect(m.fcp_ms).toBeLessThan(PRESUPUESTO.fcp);
    if (m.lcp_ms !== null) expect(m.lcp_ms).toBeLessThan(PRESUPUESTO.lcp);
  });

  test('las APIs de los listados responden en menos de 500 ms', async ({ page }, info) => {
    const tiempos: Record<string, number> = {};
    await iniciarSesion(page, 'planificador');
    for (const [menu, titulo, ruta] of [
      ['Pedidos', 'Pedidos', '/api/pedidos'], ['Flota', 'Flota', '/api/vehiculos'],
      ['Conductores', 'Conductores', '/api/conductores'], ['Clientes', 'Clientes', '/api/clientes'],
    ] as const) {
      const respuesta = page.waitForResponse((r) => r.url().includes(ruta) && r.request().method() === 'GET');
      await irA(page, menu, titulo);
      const r = await respuesta;
      await r.finished();
      const t = r.request().timing();
      tiempos[`GET ${ruta}`] = Math.round(t.responseEnd >= 0 ? t.responseEnd : 0);
    }
    const login = page.waitForResponse((r) => r.url().includes('/api/indicadores'));
    await irA(page, 'Dashboard', 'Dashboard');
    tiempos['GET /api/indicadores'] = Math.round((await login).request().timing().responseEnd);
    registrarMetrica(info, 'tiempos-api', { endpoints: tiempos });
    for (const [ep, ms] of Object.entries(tiempos)) expect(ms, ep).toBeLessThan(PRESUPUESTO.api);
  });
});

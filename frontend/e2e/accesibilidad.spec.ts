import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { expect, test, type Page } from '@playwright/test';
import { iniciarSesion, irA } from './support/fixtures';

// axe-core se inyecta en la página (WCAG 2.1 AA)
const axeFuente = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

async function violaciones(page: Page) {
  await page.addScriptTag({ content: axeFuente });
  return page.evaluate(async () => {
    const r = await (window as unknown as { axe: { run: (c: unknown, o: unknown) => Promise<{ violations: { id: string; nodes: unknown[] }[] }> } })
      .axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] } });
    return r.violations.map((v) => `${v.id} (${v.nodes.length})`);
  });
}

test.describe('Accesibilidad WCAG 2.1 AA (protege lo logrado en el Sprint 3)', () => {
  test('pantalla de acceso sin violaciones @public', async ({ page }) => {
    await page.goto('/login');
    expect(await violaciones(page)).toEqual([]);
  });

  test('pantallas internas sin violaciones', async ({ page }) => {
    await iniciarSesion(page, 'admin');
    for (const [menu, titulo] of [['Dashboard', 'Dashboard'], ['Pedidos', 'Pedidos'], ['Flota', 'Flota'],
      ['Conductores', 'Conductores'], ['Clientes', 'Clientes'], ['Rutas', 'Rutas'],
      ['Sostenibilidad', 'Reporte de sostenibilidad'], ['Administración', 'Administración'],
      ['Encuesta SUS', 'Encuesta de usabilidad (SUS)']] as const) {
      await irA(page, menu, titulo);
      expect(await violaciones(page), menu).toEqual([]);
    }
  });

  test('formulario de cliente con el mapa para marcar la ubicación sin violaciones', async ({ page }) => {
    await iniciarSesion(page, 'planificador');
    await irA(page, 'Clientes', 'Clientes');
    await page.getByRole('button', { name: '+ Nuevo' }).click();
    const mapa = page.getByRole('region', { name: 'Mapa para marcar la ubicación' });
    await mapa.click({ position: { x: 150, y: 120 } });
    await expect(page.locator('.pin-ubicacion')).toBeVisible();
    expect(await violaciones(page)).toEqual([]);
  });
});

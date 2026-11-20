import { expect, test, type APIRequestContext } from '@playwright/test';
import { API, iniciarSesion, irA, tokenApi, unico } from './support/fixtures';

/** Crea pedidos pendientes por la API para que cada navegador tenga trabajo que planificar. */
async function prepararPedidos(request: APIRequestContext, h: Record<string, string>, prefijo: string, n = 4) {
  const clientes = await (await request.get(`${API}/clientes?limite=100`, { headers: h })).json();
  for (let i = 0; i < n; i += 1) {
    const c = clientes[i % clientes.length];
    const r = await request.post(`${API}/pedidos`, {
      headers: h,
      data: { codigo: `${prefijo}-${i}`, cliente_id: c.id, peso_kg: 60, volumen_m3: 0.3, ventana_inicio: '08:00', ventana_fin: '18:00' },
    });
    expect(r.status()).toBe(201);
  }
}

test.describe('Rutas optimizadas, mapa y re-optimización (RF-003, RF-004, RF-007)', () => {
  test('genera el plan con Búsqueda Tabú y lo muestra en el mapa con tramos y congestión', async ({ page, request }, info) => {
    const h = await tokenApi(request, 'admin');
    await prepararPedidos(request, h, unico('RUT', info));
    await iniciarSesion(page, 'planificador');
    await irA(page, 'Rutas', 'Rutas');
    await page.getByRole('button', { name: 'Generar rutas optimizadas' }).click();
    const resumen = page.getByRole('status').filter({ hasText: 'FACTIBLE' });
    await expect(resumen).toBeVisible({ timeout: 60_000 });
    await expect(resumen).toContainText('ahorro');
    await expect(page.getByRole('region', { name: 'Mapa de rutas' })).toBeVisible();
    await expect(page.locator('.pin span').first()).toBeVisible();
    await expect(page.getByLabel('Leyenda del mapa')).toContainText('alta (hora punta)');
    await expect(page.locator('article.tarjeta li').first()).toContainText(/congestión (fluida|moderada|alta)/);
  });

  test('re-optimiza una ruta ante un accidente y conserva la trazabilidad', async ({ page, request }, info) => {
    const h = await tokenApi(request, 'admin');
    await prepararPedidos(request, h, unico('ACC', info), 3);
    const plan = await (await request.post(`${API}/rutas/optimizar`, { headers: h, data: {} })).json();
    expect(plan.estado).toBe('FACTIBLE');
    const ruta = plan.rutas[0];

    await iniciarSesion(page, 'planificador');
    await irA(page, 'Rutas', 'Rutas');
    const form = page.getByRole('form', { name: 'Registrar incidente' });
    await form.getByLabel('Ruta').selectOption(String(ruta.id));
    await form.getByLabel('Tipo').selectOption('ACCIDENTE');
    await form.getByLabel('Hora actual').fill('10:00');
    await form.getByLabel('Demora (min)').fill('30');
    await form.getByLabel('Descripción').fill('Choque en Av. Ferrocarril');
    await form.getByRole('button', { name: 'Re-optimizar' }).click();
    await expect(page.getByText(`re-optimizada de #${ruta.id}`).first()).toBeVisible({ timeout: 60_000 });

    const incidentes = await (await request.get(`${API}/rutas/${ruta.id}/incidentes`, { headers: h })).json();
    expect(incidentes[0]).toMatchObject({ tipo: 'ACCIDENTE', demora_min: 30, descripcion: 'Choque en Av. Ferrocarril' });
    expect(incidentes[0].ruta_nueva_id).not.toBeNull();
  });

  test('descarga el reporte PDF de sostenibilidad', async ({ page }) => {
    await iniciarSesion(page, 'planificador');
    await irA(page, 'Sostenibilidad', 'Reporte de sostenibilidad');
    const descarga = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Descargar reporte PDF' }).click();
    expect((await descarga).suggestedFilename()).toMatch(/^reporte-sostenibilidad-.*\.pdf$/);
    await expect(page.getByRole('heading', { name: /Costo del ciclo de vida/ })).toBeVisible();
  });
});

test.describe('Modo conductor (US-014)', () => {
  test('el conductor ve su siguiente entrega y la marca como entregada', async ({ page, request }, info) => {
    const h = await tokenApi(request, 'admin');
    await prepararPedidos(request, h, unico('CON', info), 2);
    const plan = await (await request.post(`${API}/rutas/optimizar`, { headers: h, data: {} })).json();
    expect(plan.estado).toBe('FACTIBLE');

    await iniciarSesion(page, 'conductor');
    await expect(page.getByRole('heading', { name: 'Mi ruta de hoy' })).toBeVisible();
    const siguiente = page.getByRole('heading', { name: 'Siguiente entrega' });
    if (await siguiente.count()) {
      const pendientesAntes = await page.getByText(/Entregas pendientes:/).first().textContent();
      await page.getByRole('button', { name: '✔ Entregado' }).first().click();
      await expect(page.getByText(/Entregas pendientes:/).first()).not.toHaveText(pendientesAntes ?? '');
    } else {
      // El plan no asignó paradas al vehículo del conductor de demostración
      await expect(page.getByText('No tienes una ruta asignada por ahora.')).toBeVisible();
    }
  });
});

test.describe('Modo conductor sin conexión (RNF-006)', () => {
  test.use({ serviceWorkers: 'allow' });

  test('sin señal la app abre desde el celular y guarda las entregas para enviarlas después (RNF-006)', async ({ page, context, request, browserName }, info) => {
    const h = await tokenApi(request, 'admin');
    await prepararPedidos(request, h, unico('OFF', info), 2);
    expect((await (await request.post(`${API}/rutas/optimizar`, { headers: h, data: {} })).json()).estado).toBe('FACTIBLE');

    await iniciarSesion(page, 'conductor');
    await expect(page.getByRole('heading', { name: 'Mi ruta de hoy' })).toBeVisible();
    const conRuta = (await page.getByRole('heading', { name: 'Siguiente entrega' }).count()) > 0;

    if (browserName === 'chromium') {
      // Playwright solo emula service workers en Chromium: ahí se prueba que la app abre sin red tras recargar
      await page.evaluate(async () => {
        await navigator.serviceWorker.ready;
        if (!navigator.serviceWorker.controller) {
          await new Promise((ok) => navigator.serviceWorker.addEventListener('controllerchange', ok, { once: true }));
        }
      });
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Mi ruta de hoy' })).toBeVisible();
      await context.setOffline(true);
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Mi ruta de hoy' })).toBeVisible();
      await expect(page.getByText(/📴 Sin conexión\. Se muestra tu ruta guardada/)).toBeVisible();
    } else {
      await context.setOffline(true);
    }
    if (conRuta) {
      await page.getByRole('button', { name: '✔ Entregado' }).first().click();
      await expect(page.getByText('⏳ 1 entrega pendiente de enviar.')).toBeVisible();
      await context.setOffline(false);
      // Se envía con el evento "online" o con el reintento automático (cada 15 s)
      await expect(page.getByText(/pendiente de enviar/)).toHaveCount(0, { timeout: 35_000 });
      await expect(page.getByText(/📴 Sin conexión/)).toHaveCount(0);
    } else {
      await expect(page.getByText('No tienes una ruta asignada por ahora.')).toBeVisible();
      await context.setOffline(false);
    }
  });
});

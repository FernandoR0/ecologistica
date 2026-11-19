import { expect, test } from '@playwright/test';
import { API, percentil, registrarMetrica } from './support/fixtures';

const SIN_CONEXION = 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';

test.describe('Disponibilidad y resiliencia', () => {
  test('el health check de la API responde 200 @public', async ({ request }) => {
    const r = await request.get(`${API}/health`);
    expect(r.status()).toBe(200);
    expect(await r.json()).toEqual({ status: 'ok' });
  });

  test('la interfaz y sus recursos estáticos no devuelven errores @public', async ({ page }) => {
    const fallidas: string[] = [];
    page.on('response', (r) => { if (r.status() >= 400 && !r.url().includes('tile.openstreetmap.org')) fallidas.push(`${r.status()} ${r.url()}`); });
    const r = await page.goto('/login');
    expect(r?.status()).toBe(200);
    expect(r?.headers()['content-type']).toContain('text/html');
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeVisible();
    expect(fallidas).toEqual([]);
  });

  test('códigos HTTP del proxy /api: 401 sin token y 404 en ruta inexistente @public', async ({ request }) => {
    const sinToken = await request.get(`${API}/vehiculos`);
    expect(sinToken.status()).toBe(401);
    expect((await request.get(`${API}/ruta-inexistente`)).status()).toBe(404);
    const malas = await request.post(`${API}/auth/login`, { data: { correo: 'nadie@ecologistica.pe', password: 'x' } });
    expect(malas.status()).toBe(401);
  });

  test('10 sondeos consecutivos de disponibilidad con latencia p50 y p95 @public', async ({ request }, info) => {
    const destinos = [
      { destino: 'Interfaz (/login)', url: '/login' },
      { destino: 'API (/api/health)', url: `${API}/health` },
    ];
    const resultados = [];
    for (const d of destinos) {
      const tiempos: number[] = [];
      let exitosas = 0;
      for (let i = 0; i < 10; i += 1) {
        const t0 = Date.now();
        const r = await request.get(d.url);
        tiempos.push(Date.now() - t0);
        if (r.ok()) exitosas += 1;
      }
      resultados.push({ ...d, total: 10, exitosas, p50_ms: percentil(tiempos, 50), p95_ms: percentil(tiempos, 95) });
      expect(exitosas).toBe(10);
    }
    registrarMetrica(info, 'disponibilidad', { destinos: resultados });
  });

  test('pérdida de conexión: mensaje comprensible y botón habilitado @public', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => route.abort('internetdisconnected'));
    await page.goto('/login');
    await page.getByLabel('Correo').fill('planificador@ecologistica.pe');
    await page.getByLabel('Contraseña').fill('Plan123*');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toHaveText(SIN_CONEXION);
    await expect(page.getByRole('button', { name: 'Ingresar' })).toBeEnabled();
  });

  test('backend 503: mensaje de indisponibilidad con su código @public', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => route.fulfill({ status: 503, body: '' }));
    await page.goto('/login');
    await page.getByLabel('Correo').fill('planificador@ecologistica.pe');
    await page.getByLabel('Contraseña').fill('Plan123*');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'El servicio no está disponible en este momento. Inténtalo nuevamente en unos segundos. (Error 503)',
    );
  });

  test('API lenta: el botón muestra "Ingresando…" deshabilitado y luego el resultado @public', async ({ page }) => {
    await page.route('**/api/auth/login', async (route) => {
      await new Promise((r) => setTimeout(r, 1500));
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ detail: 'Credenciales inválidas' }) });
    });
    await page.goto('/login');
    await page.getByLabel('Correo').fill('planificador@ecologistica.pe');
    await page.getByLabel('Contraseña').fill('cualquiera');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('button', { name: 'Ingresando…' })).toBeDisabled();
    await expect(page.getByRole('alert')).toHaveText('Credenciales inválidas');
  });
});

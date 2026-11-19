import { expect, test } from '@playwright/test';
import { API, iniciarSesion, irA, tokenApi, unico } from './support/fixtures';

test.describe('Autenticación (RF-011)', () => {
  test('muestra la pantalla de acceso @public', async ({ page }) => {
    const respuesta = await page.goto('/login');
    expect(respuesta?.status()).toBe(200);
    await expect(page).toHaveTitle(/EcoLogística/);
    await expect(page.getByLabel('Correo')).toBeVisible();
    await expect(page.getByLabel('Contraseña')).toBeVisible();
  });

  test('rechaza credenciales inválidas sin navegar @public', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Correo').fill('nadie@ecologistica.pe');
    await page.getByLabel('Contraseña').fill('incorrecta');
    const respuesta = page.waitForResponse((r) => r.url().includes('/auth/login'));
    await page.getByRole('button', { name: 'Ingresar' }).click();
    expect((await respuesta).status()).toBe(401);
    await expect(page.getByRole('alert')).toHaveText('Credenciales inválidas');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('valida campos obligatorios y formato de correo sin enviar la petición @public', async ({ page }) => {
    await page.goto('/login');
    let enviadas = 0;
    page.on('request', (r) => { if (r.url().includes('/auth/login')) enviadas += 1; });
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await page.getByLabel('Correo').fill('correo-sin-arroba');
    await page.getByLabel('Contraseña').fill('x');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    const valido = await page.getByLabel('Correo').evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(valido).toBe(false);
    expect(enviadas).toBe(0);
  });

  test('inicia sesión, recorre los módulos y cierra sesión', async ({ page }) => {
    await iniciarSesion(page, 'planificador');
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    for (const [menu, titulo] of [['Pedidos', 'Pedidos'], ['Flota', 'Flota'], ['Conductores', 'Conductores'],
      ['Clientes', 'Clientes'], ['Rutas', 'Rutas'], ['Sostenibilidad', 'Reporte de sostenibilidad']] as const) {
      await irA(page, menu, titulo);
      await expect(page.getByRole('link', { name: menu })).toHaveAttribute('aria-current', 'page');
    }
    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('bloquea la cuenta 15 minutos tras 3 intentos fallidos (RN-001)', async ({ page, request }, info) => {
    const correo = `${unico('bloqueo', info).toLowerCase()}@ecologistica.pe`;
    const admin = await tokenApi(request, 'admin');
    const alta = await request.post(`${API}/auth/usuarios`, {
      headers: admin, data: { correo, nombre: 'Usuario de bloqueo', password: 'Correcta123', rol: 'PLANIFICADOR' },
    });
    expect(alta.status()).toBe(201);
    await page.goto('/login');
    await page.getByLabel('Correo').fill(correo);
    for (const esperado of ['Credenciales inválidas', 'Credenciales inválidas', 'Cuenta bloqueada 15 minutos por intentos fallidos']) {
      await page.getByLabel('Contraseña').fill('mala');
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await expect(page.getByRole('alert')).toHaveText(esperado);
    }
    await page.getByLabel('Contraseña').fill('Correcta123');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toHaveText(/Cuenta bloqueada/);
  });

  test('el auditor solo consulta: no puede generar rutas', async ({ page }) => {
    await iniciarSesion(page, 'auditor');
    await irA(page, 'Rutas', 'Rutas');
    await expect(page.getByRole('button', { name: 'Generar rutas optimizadas' })).toHaveCount(0);
    await irA(page, 'Administración', 'Administración');
    await expect(page.getByText('Acceso de auditor: solo consulta y exportación.')).toBeVisible();
  });
});

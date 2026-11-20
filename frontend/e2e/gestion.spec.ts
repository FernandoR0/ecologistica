import { expect, test } from '@playwright/test';
import { API, iniciarSesion, irA, tokenApi, unico } from './support/fixtures';

test.describe('Gestión operativa (RF-001, RF-002, RF-008, RF-009)', () => {
  test.beforeEach(async ({ page }) => {
    await iniciarSesion(page, 'planificador');
  });

  test('registra un vehículo, calcula su factor de emisión y rechaza la placa duplicada', async ({ page, request }, info) => {
    const sufijo = String(Date.now()).slice(-4);
    const placa = `${info.project.name.slice(0, 2).toUpperCase()}${sufijo[0]}-${sufijo.slice(1)}`;
    await irA(page, 'Flota', 'Flota');
    await page.getByRole('button', { name: '+ Nuevo' }).click();
    const form = page.getByRole('form', { name: 'Formulario Flota' });
    await form.getByLabel('Placa').fill(placa);
    await form.getByLabel('Tipo').selectOption('CAMIONETA');
    await form.getByLabel('Capacidad de carga (kg)').fill('1200');
    await form.getByLabel('Volumen (m³)').fill('6');
    await form.getByLabel('Combustible').selectOption('DIESEL');
    await form.getByLabel('Rendimiento (km/L, km/m³ o km/kWh)').fill('9');
    await form.getByLabel('Año de fabricación').fill('2019');
    await form.getByRole('button', { name: 'Guardar' }).click();
    await expect(form).toHaveCount(0);

    // Verificación independiente en la API
    const h = await tokenApi(request, 'admin');
    const lista = await (await request.get(`${API}/vehiculos?limite=100`, { headers: h })).json();
    expect(lista.find((v: { placa: string }) => v.placa === placa)).toMatchObject({ factor_emision_kg_km: 0.2978 });

    await page.getByRole('button', { name: '+ Nuevo' }).click();
    await form.getByLabel('Placa').fill(placa);
    await form.getByLabel('Tipo').selectOption('CAMIONETA');
    await form.getByLabel('Capacidad de carga (kg)').fill('900');
    await form.getByLabel('Volumen (m³)').fill('5');
    await form.getByLabel('Combustible').selectOption('GLP');
    await form.getByLabel('Rendimiento (km/L, km/m³ o km/kWh)').fill('7');
    await form.getByLabel('Año de fabricación').fill('2020');
    await form.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('alert')).toHaveText('La placa ya está registrada');
  });

  test('registra un cliente y un pedido que hereda su horario y punto de referencia', async ({ page, request }, info) => {
    const nombre = unico('Bodega E2E', info);
    const codigo = unico('PED', info);
    await irA(page, 'Clientes', 'Clientes');
    await page.getByRole('button', { name: '+ Nuevo' }).click();
    const fc = page.getByRole('form', { name: 'Formulario Clientes' });
    await fc.getByLabel('Nombre del cliente').fill(nombre);
    await fc.getByLabel('Dirección').fill('Mz. C, Lote 5, Pje. Los Álamos');
    await fc.getByLabel('Distrito').selectOption('El Tambo');
    await fc.getByLabel('Punto de referencia').fill('Frente a la bodega El Ahorro');
    await fc.getByLabel('Recibe desde').fill('09:00');
    await fc.getByLabel('Recibe hasta').fill('12:00');
    // La ubicación se marca tocando el mapa, sin escribir coordenadas
    await expect(fc.getByRole('status')).toHaveText('Aún no se ha marcado la ubicación.');
    await fc.getByRole('region', { name: 'Mapa para marcar la ubicación' }).click({ position: { x: 180, y: 140 } });
    await expect(fc.getByRole('status')).toHaveText(/✔ Ubicación marcada \(-12\.\d{5}, -75\.\d{5}\)/);
    await fc.getByRole('button', { name: 'Guardar' }).click();
    await expect(fc).toHaveCount(0);

    await irA(page, 'Pedidos', 'Pedidos');
    await page.getByRole('button', { name: '+ Nuevo' }).click();
    const fp = page.getByRole('form', { name: 'Formulario Pedidos' });
    await fp.getByLabel('Código').fill(codigo);
    await fp.getByRole('combobox', { name: /^Cliente/ }).selectOption({ label: nombre });
    await fp.getByLabel('Peso (kg)').fill('80');
    await fp.getByLabel('Volumen (m³)').fill('0.4');
    await fp.getByLabel('Prioridad').selectOption('EXPRESS');
    await fp.getByLabel('Tipo de producto').selectOption('PERECEDERO');
    await fp.getByRole('button', { name: 'Guardar' }).click();
    await expect(fp).toHaveCount(0);
    await expect(page.getByRole('cell', { name: codigo })).toBeVisible();

    const h = await tokenApi(request, 'admin');
    const pedidos = await (await request.get(`${API}/pedidos?limite=100`, { headers: h })).json();
    const resumen = pedidos.find((p: { codigo: string }) => p.codigo === codigo);
    const completo = await (await request.get(`${API}/pedidos/${resumen.id}`, { headers: h })).json();
    expect(completo).toMatchObject({
      ventana_inicio: '09:00', ventana_fin: '12:00', punto_referencia: 'Frente a la bodega El Ahorro', estado: 'PENDIENTE',
      prioridad: 'EXPRESS', tipo_producto: 'PERECEDERO',
    });
  });

  test('rechaza una ventana que termina antes de empezar (422)', async ({ page }, info) => {
    await irA(page, 'Pedidos', 'Pedidos');
    await page.getByRole('button', { name: '+ Nuevo' }).click();
    const fp = page.getByRole('form', { name: 'Formulario Pedidos' });
    await fp.getByLabel('Código').fill(unico('MAL', info));
    await fp.getByRole('combobox', { name: /^Cliente/ }).selectOption({ index: 1 });
    await fp.getByLabel('Peso (kg)').fill('10');
    await fp.getByLabel('Entregar desde (vacío = horario del cliente)').fill('12:00');
    await fp.getByLabel('Entregar hasta').fill('09:00');
    const respuesta = page.waitForResponse((r) => r.url().endsWith('/pedidos') && r.request().method() === 'POST');
    await fp.getByRole('button', { name: 'Guardar' }).click();
    expect((await respuesta).status()).toBe(422);
    await expect(page.getByRole('alert')).toContainText('La ventana debe terminar después de empezar');
  });

  test('rechaza una licencia que no corresponde al tipo de vehículo (RN-015)', async ({ page }, info) => {
    await irA(page, 'Conductores', 'Conductores');
    await page.getByRole('button', { name: '+ Nuevo' }).click();
    const f = page.getByRole('form', { name: 'Formulario Conductores' });
    await f.getByLabel('Nombre').fill('Conductor E2E');
    await f.getByLabel('DNI').fill(String(Date.now()).slice(-8));
    await f.getByLabel('N.º de licencia').fill(unico('Q', info));
    await f.getByLabel('Categoría de licencia').selectOption('B-IIc');
    await f.getByLabel('Vehículo asignado').selectOption({ label: 'ABC-102 (FURGON)' });
    await f.getByRole('button', { name: 'Guardar' }).click();
    await expect(page.getByRole('alert')).toHaveText('La licencia B-IIc no es válida para un vehículo tipo FURGON');
  });
});

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
    await irA(page, 'Clientes', 'Clientes');
    await page.getByRole('button', { name: '+ Nuevo' }).click();
    const fc = page.getByRole('form', { name: 'Formulario Clientes' });
    await fc.getByLabel('Nombre del cliente').fill(nombre);
    await fc.getByLabel('Dirección', { exact: true }).fill('Mz. C, Lote 5, Pje. Los Álamos');
    await fc.getByLabel('Distrito').selectOption('El Tambo');
    await fc.getByLabel('Punto de referencia').fill('Frente a la bodega El Ahorro');
    await fc.getByLabel('Recibe desde').fill('09:00');
    await fc.getByLabel('Recibe hasta').fill('12:00');
    // La ubicación se busca por dirección o referencia (OpenStreetMap simulado) y se ajusta tocando el mapa
    await page.route('**/nominatim.openstreetmap.org/search**', (ruta) => ruta.fulfill({
      json: [{
        display_name: 'Pasaje Los Álamos, El Tambo, Huancayo, Junín', lat: '-12.0581', lon: '-75.2152',
        address: { road: 'Pasaje Los Álamos', suburb: 'El Tambo', city: 'Huancayo' },
      }],
    }));
    await expect(fc.getByRole('status')).toHaveText('Aún no se ha marcado la ubicación.');
    await fc.getByLabel('Buscar dirección o lugar de referencia').fill('Pasaje Los Álamos');
    await fc.getByLabel('Buscar dirección o lugar de referencia').press('Enter');
    await fc.getByRole('button', { name: '📍 Pasaje Los Álamos, El Tambo, Huancayo, Junín' }).click();
    await expect(fc.getByRole('status')).toHaveText('✔ Ubicación marcada (-12.05810, -75.21520)');
    await fc.getByRole('region', { name: 'Mapa para marcar la ubicación' }).click({ position: { x: 180, y: 140 } });
    await expect(fc.getByRole('status')).toHaveText(/✔ Ubicación marcada \(-12\.\d{5}, -75\.\d{5}\)/);
    // La dirección escrita por el usuario no se reemplaza
    await expect(fc.getByLabel('Dirección', { exact: true })).toHaveValue('Mz. C, Lote 5, Pje. Los Álamos');
    await fc.getByRole('button', { name: 'Guardar' }).click();
    await expect(fc).toHaveCount(0);

    await irA(page, 'Pedidos', 'Pedidos');
    await page.getByRole('button', { name: '+ Nuevo' }).click();
    const fp = page.getByRole('form', { name: 'Formulario Pedidos' });
    // El código del pedido lo genera el sistema
    await expect(fp.getByLabel('Código')).toHaveCount(0);
    await fp.getByRole('combobox', { name: /^Cliente/ }).selectOption({ label: nombre });
    await fp.getByLabel('Peso (kg)').fill('80');
    await fp.getByLabel('Volumen (m³)').fill('0.4');
    await fp.getByLabel('Prioridad').selectOption('EXPRESS');
    await fp.getByLabel('Tipo de producto').selectOption('PERECEDERO');
    const creado = page.waitForResponse((r) => r.url().endsWith('/pedidos') && r.request().method() === 'POST');
    await fp.getByRole('button', { name: 'Guardar' }).click();
    const pedido = await (await creado).json();
    expect(pedido.codigo).toBe(`PED-${String(pedido.id).padStart(4, '0')}`);
    await expect(fp).toHaveCount(0);
    await expect(page.getByRole('cell', { name: pedido.codigo, exact: true })).toBeVisible();

    const h = await tokenApi(request, 'admin');
    const completo = await (await request.get(`${API}/pedidos/${pedido.id}`, { headers: h })).json();
    expect(completo).toMatchObject({
      ventana_inicio: '09:00', ventana_fin: '12:00', punto_referencia: 'Frente a la bodega El Ahorro', estado: 'PENDIENTE',
      prioridad: 'EXPRESS', tipo_producto: 'PERECEDERO',
    });
  });

  test('avisa en el formulario si la ventana termina antes de empezar o el pedido no cabe en la flota', async ({ page, request }) => {
    await irA(page, 'Pedidos', 'Pedidos');
    await page.getByRole('button', { name: '+ Nuevo' }).click();
    const fp = page.getByRole('form', { name: 'Formulario Pedidos' });
    let enviados = 0;
    page.on('request', (r) => { if (r.url().endsWith('/pedidos') && r.method() === 'POST') enviados += 1; });
    await fp.getByRole('combobox', { name: /^Cliente/ }).selectOption({ index: 1 });
    // La ayuda muestra el límite de la flota y el formato de la hora
    await expect(fp.getByText(/^Máximo [\d.]+ kg \(vehículo de mayor capacidad\)\.$/)).toBeVisible();
    await expect(fp.getByText('Formato de 24 horas, entre 05:00 y 22:00. Ej.: 18:00 = 6 de la tarde.')).toBeVisible();
    await fp.getByLabel('Peso (kg)').fill('99999');
    await fp.getByRole('button', { name: 'Guardar' }).click();
    await expect(fp.getByRole('alert')).toContainText('Ningún vehículo de la flota puede llevar 99999 kg');
    await fp.getByLabel('Peso (kg)').fill('10');
    await fp.getByLabel('Entregar desde (vacío = horario del cliente)').fill('12:00');
    await fp.getByLabel('Entregar hasta').fill('09:00');
    await fp.getByRole('button', { name: 'Guardar' }).click();
    await expect(fp.getByRole('alert')).toContainText('la hora de fin (09:00) debe ser después de la de inicio (12:00)');
    expect(enviados).toBe(0);
    // La API también lo rechaza si se llama directamente (4900 kg: dentro del máximo general de 5000 kg, pero más que
    // cualquier vehículo de la flota)
    const h = await tokenApi(request, 'admin');
    const cliente = (await (await request.get(`${API}/clientes?limite=1`, { headers: h })).json())[0];
    const malo = await request.post(`${API}/pedidos`, {
      headers: h, data: { cliente_id: cliente.id, peso_kg: 4900 },
    });
    expect(malo.status()).toBe(422);
    expect((await malo.json()).detail).toContain('Ningún vehículo de la flota puede llevar 4900 kg');
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

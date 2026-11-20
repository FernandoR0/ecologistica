import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import * as geo from '../geocodificar';
import { Clientes, Conductores, Pedidos, Vehiculos } from '../pages/Gestion';
import { renderConSesion, VEHICULO } from './utils';

// El buscador real consulta OpenStreetMap: en las pruebas se simula
vi.mock('../geocodificar', () => ({ buscarLugar: vi.fn() }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

const pedidos = (desde: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: desde + i, codigo: `PED-${desde + i}`, cliente_nombre: 'Bodega', peso_kg: 50, volumen_m3: 0.4,
    ventana_inicio: '08:00', ventana_fin: '12:00', prioridad: 'ESTANDAR', tipo_producto: 'NO_PERECEDERO', estado: 'PENDIENTE',
  }));
const CLIENTE = {
  id: 3, nombre: 'Restaurante Wanka', direccion: 'Jr. Real 100', distrito: 'Huancayo', hora_desde: '08:00', hora_hasta: '11:00',
  dias_atencion: 'LU,MA,MI,JU,VI,SA', punto_referencia: 'Frente al parque', restricciones_acceso: 'No ingresar por Calle Real',
  lat: -12.069, lng: -75.21, activo: true,
};

describe('tabla de gestión (CrudPage)', () => {
  it('lista la flota con factor de emisión y restricción en el Centro', async () => {
    renderConSesion(<Vehiculos />, 'ADMIN', {
      '/vehiculos': { body: [VEHICULO, { ...VEHICULO, id: 2, placa: 'DSL-208', anio_fabricacion: 2008, restringido_centro: true }],
        headers: { 'X-Total-Count': '2' } },
    });
    expect(await screen.findByText('ABC-101')).toBeInTheDocument();
    expect(screen.getAllByText('0.2978')).toHaveLength(2);
    const fila = screen.getByText('DSL-208').closest('tr')!;
    expect(within(fila).getAllByText('Sí').length).toBe(2);
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument();
  });

  it('pagina de 12 en 12', async () => {
    const { fetchFalso } = renderConSesion(<Pedidos />, 'PLANIFICADOR', {
      '/clientes': { body: [CLIENTE] },
      '/pedidos': (_i, url) => ({
        body: url?.includes('pagina=2') ? pedidos(13, 3) : pedidos(1, 12),
        headers: { 'X-Total-Count': '15' },
      }),
    });
    expect(await screen.findByText('Página 1 de 2 · 15 registros')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('PED-15')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2 · 15 registros')).toBeInTheDocument();
    expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('pagina=2&limite=12'))).toBe(true);
  });

  it('crea un vehículo con los tipos correctos', async () => {
    const { fetchFalso } = renderConSesion(<Vehiculos />, 'ADMIN', {
      '/vehiculos': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /vehiculos': { status: 201, body: VEHICULO },
    });
    expect(await screen.findByText('Sin registros')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '+ Nuevo' }));
    const form = screen.getByRole('form', { name: 'Formulario Flota' });
    await userEvent.type(within(form).getByLabelText('Placa'), 'ABC-101');
    await userEvent.selectOptions(within(form).getByLabelText('Tipo'), 'FURGON');
    await userEvent.type(within(form).getByLabelText('Capacidad de carga (kg)'), '1500');
    await userEvent.type(within(form).getByLabelText('Volumen (m³)'), '10');
    await userEvent.selectOptions(within(form).getByLabelText('Combustible'), 'GLP');
    await userEvent.type(within(form).getByLabelText('Rendimiento (km/L, km/m³ o km/kWh)'), '7.5');
    await userEvent.type(within(form).getByLabelText('Año de fabricación'), '2016');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByRole('form')).not.toBeInTheDocument());
    const llamada = fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST');
    expect(JSON.parse(String(llamada?.[1]?.body))).toEqual({
      placa: 'ABC-101', tipo: 'FURGON', capacidad_kg: 1500, volumen_m3: 10, combustible: 'GLP', rendimiento: 7.5,
      anio_fabricacion: 2016, activo: true,
    });
  });

  it('al editar pide el registro completo y no reenvía campos fijos', async () => {
    const { fetchFalso } = renderConSesion(<Vehiculos />, 'ADMIN', {
      '/vehiculos': (_i, url) => (url === '/vehiculos/1' ? { body: VEHICULO } : { body: [VEHICULO], headers: { 'X-Total-Count': '1' } }),
      'PUT /vehiculos/1': { body: VEHICULO },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const capacidad = await screen.findByLabelText('Capacidad de carga (kg)');
    expect(screen.getByLabelText('Placa')).toBeDisabled();
    await userEvent.clear(capacidad);
    await userEvent.type(capacidad, '1800');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'PUT')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'PUT')?.[1]?.body));
    expect(cuerpo.capacidad_kg).toBe(1800);
    expect(cuerpo.placa).toBeUndefined();
  });

  it('muestra el error de licencia al asignar un vehículo al conductor', async () => {
    const { fetchFalso } = renderConSesion(<Conductores />, 'ADMIN', {
      '/vehiculos': { body: [VEHICULO] },
      '/conductores': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /conductores': { status: 422, body: { detail: 'La licencia B-IIc no es válida para un vehículo tipo CAMIONETA' } },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Pérez');
    await userEvent.type(screen.getByLabelText('DNI'), '71000001');
    await userEvent.type(screen.getByLabelText('N.º de licencia'), 'Q71000001');
    await userEvent.selectOptions(screen.getByLabelText('Categoría de licencia'), 'B-IIc');
    await userEvent.selectOptions(await screen.findByLabelText('Vehículo asignado'), 'ABC-101 (CAMIONETA)');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('no es válida');
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo.vehiculo_id).toBe(1);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('muestra el error de validación de FastAPI', async () => {
    renderConSesion(<Conductores />, 'ADMIN', {
      '/vehiculos': { body: [] },
      '/conductores': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /conductores': { status: 422, body: { detail: [{ loc: ['body', 'dni'], msg: 'formato inválido' }] } },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Pérez');
    await userEvent.type(screen.getByLabelText('DNI'), '123');
    await userEvent.type(screen.getByLabelText('N.º de licencia'), 'Q1');
    await userEvent.selectOptions(screen.getByLabelText('Categoría de licencia'), 'A-IIb');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('dni: formato inválido');
  });

  it('cancela un pedido después de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fetchFalso } = renderConSesion(<Pedidos />, 'ADMIN', {
      '/clientes': { body: [] },
      '/pedidos': { body: pedidos(1, 1), headers: { 'X-Total-Count': '1' } },
      'DELETE /pedidos/1': { status: 204 },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'DELETE')).toBe(true));
  });

  it('el auditor no ve botones de edición', async () => {
    renderConSesion(<Vehiculos />, 'AUDITOR', { '/vehiculos': { body: [VEHICULO], headers: { 'X-Total-Count': '1' } } });
    await screen.findByText('ABC-101');
    await waitFor(() => expect(screen.queryByRole('button', { name: '+ Nuevo' })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });
});

describe('Clientes y pedidos (RF-009, RF-002)', () => {
  it('lista clientes con punto de referencia y restricciones', async () => {
    renderConSesion(<Clientes />, 'PLANIFICADOR', { '/clientes': { body: [CLIENTE], headers: { 'X-Total-Count': '1' } } });
    expect(await screen.findByText('Restaurante Wanka')).toBeInTheDocument();
    expect(screen.getByText('Frente al parque')).toBeInTheDocument();
    expect(screen.getByText('No ingresar por Calle Real')).toBeInTheDocument();
  });

  it('crea un pedido eligiendo el cliente y deja vacía la ventana para usar su horario', async () => {
    const { fetchFalso } = renderConSesion(<Pedidos />, 'PLANIFICADOR', {
      '/clientes': { body: [CLIENTE] },
      '/pedidos': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /pedidos': { status: 201, body: {} },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    // El código lo genera el sistema: no se pide al crear
    expect(screen.queryByLabelText('Código')).not.toBeInTheDocument();
    await userEvent.selectOptions(await screen.findByLabelText('Cliente'), 'Restaurante Wanka');
    await userEvent.type(screen.getByLabelText('Peso (kg)'), '80');
    await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'EXPRESS');
    await userEvent.selectOptions(screen.getByLabelText('Tipo de producto'), 'PERECEDERO');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo).toEqual({ cliente_id: 3, peso_kg: 80, prioridad: 'EXPRESS', tipo_producto: 'PERECEDERO' });
  });

  it('al editar un pedido muestra su código generado sin permitir cambiarlo', async () => {
    const PEDIDO = { ...pedidos(7, 1)[0], codigo: 'PED-0007', cliente_id: 3 };
    const { fetchFalso } = renderConSesion(<Pedidos />, 'PLANIFICADOR', {
      '/clientes': { body: [CLIENTE] },
      '/pedidos': (_i, url) => (url === '/pedidos/7' ? { body: PEDIDO } : { body: [PEDIDO], headers: { 'X-Total-Count': '1' } }),
      'PUT /pedidos/7': { body: PEDIDO },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const codigo = await screen.findByLabelText('Código');
    expect(codigo).toHaveValue('PED-0007');
    expect(codigo).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'PUT')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'PUT')?.[1]?.body));
    expect(cuerpo).not.toHaveProperty('codigo');
  });
});

describe('Ubicación del cliente en el mapa (cuello de botella SUS)', () => {
  const abrirFormulario = async () => {
    const r = renderConSesion(<Clientes />, 'PLANIFICADOR', {
      '/clientes': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /clientes': { status: 201, body: CLIENTE },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    const form = screen.getByRole('form', { name: 'Formulario Clientes' });
    await userEvent.type(within(form).getByLabelText('Nombre del cliente'), 'Bodega P1');
    await userEvent.type(within(form).getByLabelText('Dirección'), 'Jr. Real 500');
    await userEvent.selectOptions(within(form).getByLabelText('Distrito'), 'Huancayo');
    return { ...r, form };
  };
  const cuerpoPost = (fetchFalso: ReturnType<typeof vi.fn>) =>
    JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));

  it('ya no pide latitud y longitud como campos obligatorios: muestra un mapa', async () => {
    const { form } = await abrirFormulario();
    expect(within(form).getByRole('group', { name: 'Ubicación del cliente en el mapa' })).toBeInTheDocument();
    expect(within(form).getByRole('region', { name: 'Mapa para marcar la ubicación' })).toBeInTheDocument();
    expect(within(form).getByRole('status')).toHaveTextContent('Aún no se ha marcado la ubicación.');
    expect(within(form).getByLabelText('Latitud')).not.toBeRequired();
  });

  it('no guarda si no se marcó la ubicación y lo explica', async () => {
    const { form, fetchFalso } = await abrirFormulario();
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Busca la dirección o marca en el mapa la ubicación antes de guardar.');
    expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(false);
  });

  it('al tocar el mapa pone el pin y envía las coordenadas del punto', async () => {
    const { form, fetchFalso } = await abrirFormulario();
    const mapa = within(form).getByRole('region', { name: 'Mapa para marcar la ubicación' });
    fireEvent.click(mapa, { clientX: 40, clientY: 30 });
    expect(within(form).getByRole('status')).toHaveTextContent(/✔ Ubicación marcada \(-12\.\d+, -75\.\d+\)/);
    expect(mapa.querySelector('.pin-ubicacion')).not.toBeNull();
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    const cuerpo = cuerpoPost(fetchFalso);
    expect(cuerpo.lat).toBeCloseTo(-12.06, 1);
    expect(cuerpo.lng).toBeCloseTo(-75.2, 1);
    expect(cuerpo).not.toHaveProperty('ubicacion');
  });

  it('permite escribir las coordenadas como alternativa accesible por teclado', async () => {
    const { form, fetchFalso } = await abrirFormulario();
    await userEvent.click(within(form).getByText('Escribir las coordenadas (opcional)'));
    await userEvent.type(within(form).getByLabelText('Latitud'), '-12.058');
    await userEvent.type(within(form).getByLabelText('Longitud'), '-75.215');
    expect(within(form).getByRole('status')).toHaveTextContent('✔ Ubicación marcada (-12.05800, -75.21500)');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    expect(cuerpoPost(fetchFalso)).toMatchObject({ nombre: 'Bodega P1', distrito: 'Huancayo', lat: -12.058, lng: -75.215 });
  });

  it('al editar muestra el pin en la ubicación guardada', async () => {
    renderConSesion(<Clientes />, 'PLANIFICADOR', {
      '/clientes': (_i, url) => (url === '/clientes/3' ? { body: CLIENTE } : { body: [CLIENTE], headers: { 'X-Total-Count': '1' } }),
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const form = await screen.findByRole('form', { name: 'Formulario Clientes' });
    expect(within(form).getByRole('status')).toHaveTextContent('✔ Ubicación marcada (-12.06900, -75.21000)');
  });
});

describe('Buscador de dirección o referencia (sugerencia de la prueba SUS)', () => {
  beforeEach(() => vi.mocked(geo.buscarLugar).mockReset());
  const LUGAR = {
    nombre: 'Jirón Real 500, Huancayo, Junín', lat: -12.0682, lng: -75.2105, direccion: 'Jirón Real 500',
    zonas: ['Huancayo', 'Junín'],
  };
  const nuevoCliente = async () => {
    const r = renderConSesion(<Clientes />, 'PLANIFICADOR', {
      '/clientes': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /clientes': { status: 201, body: CLIENTE },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    return { ...r, form: screen.getByRole('form', { name: 'Formulario Clientes' }) };
  };

  it('busca la dirección, pone el pin y propone la dirección y el distrito', async () => {
    const buscar = vi.mocked(geo.buscarLugar).mockResolvedValue([LUGAR, { ...LUGAR, nombre: 'Otro Jirón Real', lat: -12.07 }]);
    const { form, fetchFalso } = await nuevoCliente();
    await userEvent.type(within(form).getByLabelText('Nombre del cliente'), 'Bodega P4');
    await userEvent.type(within(form).getByLabelText('Buscar dirección o lugar de referencia'), 'Jr. Real 500');
    await userEvent.click(within(form).getByRole('button', { name: '🔍 Buscar' }));
    expect(buscar).toHaveBeenCalledWith('Jr. Real 500');
    const resultados = await within(form).findByRole('list', { name: 'Resultados de la búsqueda' });
    expect(within(resultados).getAllByRole('button')).toHaveLength(2);
    await userEvent.click(within(resultados).getByRole('button', { name: '📍 Jirón Real 500, Huancayo, Junín' }));
    expect(within(form).queryByRole('list', { name: 'Resultados de la búsqueda' })).not.toBeInTheDocument();
    expect(within(form).getByRole('status')).toHaveTextContent('✔ Ubicación marcada (-12.06820, -75.21050)');
    expect(within(form).getByLabelText('Dirección')).toHaveValue('Jirón Real 500');
    expect(within(form).getByLabelText('Distrito')).toHaveValue('Huancayo');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo).toMatchObject({ nombre: 'Bodega P4', direccion: 'Jirón Real 500', distrito: 'Huancayo', lat: -12.0682, lng: -75.2105 });
  });

  it('no reemplaza la dirección ni el distrito que el usuario ya escribió', async () => {
    vi.mocked(geo.buscarLugar).mockResolvedValue([{ ...LUGAR, zonas: ['El Tambo'] }]);
    const { form } = await nuevoCliente();
    await userEvent.type(within(form).getByLabelText('Dirección'), 'Mz. C Lote 5');
    await userEvent.selectOptions(within(form).getByLabelText('Distrito'), 'Chilca');
    await userEvent.type(within(form).getByLabelText('Buscar dirección o lugar de referencia'), 'Parque{Enter}');
    await userEvent.click(await within(form).findByRole('button', { name: /📍/ }));
    expect(within(form).getByLabelText('Dirección')).toHaveValue('Mz. C Lote 5');
    expect(within(form).getByLabelText('Distrito')).toHaveValue('Chilca');
  });

  it('Enter busca sin enviar el formulario y explica cuando no hay resultados o falla', async () => {
    const buscar = vi.mocked(geo.buscarLugar).mockResolvedValueOnce([]).mockRejectedValueOnce(
      new Error('No se pudo buscar la dirección. Revisa tu conexión o marca el lugar tocando el mapa.'));
    const { form, fetchFalso } = await nuevoCliente();
    const campo = within(form).getByLabelText('Buscar dirección o lugar de referencia');
    await userEvent.type(campo, 'ab{Enter}');
    expect(await within(form).findByRole('alert')).toHaveTextContent('Escribe al menos 3 letras');
    expect(buscar).not.toHaveBeenCalled();
    await userEvent.type(campo, 'cdef{Enter}');
    expect(await within(form).findByText(/No encontramos ese lugar en Huancayo/)).toBeInTheDocument();
    await userEvent.type(campo, '{Enter}');
    expect(await within(form).findByRole('alert')).toHaveTextContent('No se pudo buscar la dirección');
    expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(false);
  });

  it('el pedido puede tener otra ubicación de entrega opcional y quitarla', async () => {
    vi.mocked(geo.buscarLugar).mockResolvedValue([LUGAR]);
    const { fetchFalso } = renderConSesion(<Pedidos />, 'PLANIFICADOR', {
      '/clientes': { body: [CLIENTE] },
      '/pedidos': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /pedidos': { status: 201, body: {} },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    const form = screen.getByRole('form', { name: 'Formulario Pedidos' });
    expect(within(form).getByRole('group', { name: 'Otra ubicación de entrega (opcional)' })).toBeInTheDocument();
    expect(within(form).getByRole('status')).toHaveTextContent('Sin ubicación: se entrega en la del cliente.');
    await userEvent.type(within(form).getByLabelText('Buscar dirección o lugar de referencia'), 'Jr. Real{Enter}');
    await userEvent.click(await within(form).findByRole('button', { name: /📍/ }));
    expect(within(form).getByLabelText(/^Dirección/)).toHaveValue('Jirón Real 500');
    await userEvent.click(within(form).getByRole('button', { name: 'Quitar ubicación' }));
    expect(within(form).getByRole('status')).toHaveTextContent('Sin ubicación: se entrega en la del cliente.');
    await userEvent.selectOptions(await within(form).findByLabelText('Cliente'), 'Restaurante Wanka');
    await userEvent.type(within(form).getByLabelText('Peso (kg)'), '10');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo).not.toHaveProperty('lat');
    expect(cuerpo).toMatchObject({ cliente_id: 3, peso_kg: 10, direccion: 'Jirón Real 500' });
  });

  it('el punto de partida del conductor se marca en el mapa y se guarda en sus campos', async () => {
    const { fetchFalso } = renderConSesion(<Conductores />, 'PLANIFICADOR', {
      '/vehiculos': { body: [VEHICULO] },
      '/conductores': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /conductores': { status: 201, body: {} },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    const form = screen.getByRole('form', { name: 'Formulario Conductores' });
    expect(within(form).getByRole('status')).toHaveTextContent('Sin punto de partida: sale del depósito.');
    await userEvent.type(within(form).getByLabelText('Nombre'), 'Ana Pérez');
    await userEvent.type(within(form).getByLabelText('DNI'), '70000001');
    await userEvent.type(within(form).getByLabelText('N.º de licencia'), 'Q70000001');
    await userEvent.selectOptions(within(form).getByLabelText('Categoría de licencia'), 'A-IIb');
    fireEvent.click(within(form).getByRole('region', { name: 'Mapa para marcar la ubicación' }), { clientX: 30, clientY: 20 });
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo.partida_lat).toBeCloseTo(-12.06, 1);
    expect(cuerpo.partida_lng).toBeCloseTo(-75.2, 1);
    expect(cuerpo).not.toHaveProperty('lat');
  });
});

describe('Avisos en el formulario (cuellos de botella de la prueba SUS)', () => {
  it('explica el formato de 24 horas y rechaza "de 12 a 6" junto al botón Guardar', async () => {
    const { fetchFalso } = renderConSesion(<Clientes />, 'PLANIFICADOR', {
      '/clientes': { body: [], headers: { 'X-Total-Count': '0' } },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    const form = screen.getByRole('form', { name: 'Formulario Clientes' });
    await userEvent.type(within(form).getByLabelText('Nombre del cliente'), 'Bodega P5');
    await userEvent.type(within(form).getByLabelText('Dirección'), 'Jr. Lima 200');
    await userEvent.selectOptions(within(form).getByLabelText('Distrito'), 'Chilca');
    const desde = within(form).getByLabelText('Recibe desde');
    // La ayuda se ve debajo del campo y queda asociada para lectores de pantalla
    expect(desde).toHaveAccessibleDescription('Formato de 24 horas, entre 05:00 y 22:00. Ej.: 18:00 = 6 de la tarde.');
    fireEvent.change(desde, { target: { value: '12:00' } });
    fireEvent.change(within(form).getByLabelText('Recibe hasta'), { target: { value: '06:00' } });
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    const alerta = within(form).getByRole('alert');
    expect(alerta).toHaveTextContent(
      'El horario de recepción: la hora de fin (06:00) debe ser después de la de inicio (12:00). Usa el formato de 24 horas: 6 de la tarde se escribe 18:00.');
    expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(false);
    fireEvent.change(within(form).getByLabelText('Recibe hasta'), { target: { value: '23:00' } });
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    expect(within(form).getByRole('alert')).toHaveTextContent('debe estar entre 05:00 y 22:00');
    // Al cancelar el formulario el aviso desaparece
    await userEvent.click(within(form).getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('muestra el límite de la flota y no envía un pedido que no cabe en ningún vehículo', async () => {
    const { fetchFalso } = renderConSesion(<Pedidos />, 'PLANIFICADOR', {
      '/clientes': { body: [CLIENTE] },
      '/vehiculos': { body: [VEHICULO, { ...VEHICULO, id: 2, capacidad_kg: 900, volumen_m3: 12 }] },
      '/pedidos': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /pedidos': { status: 201, body: {} },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    const form = screen.getByRole('form', { name: 'Formulario Pedidos' });
    expect(await within(form).findByText('Máximo 1500 kg (vehículo de mayor capacidad).')).toBeInTheDocument();
    expect(within(form).getByText('Máximo 12 m³ (vehículo de mayor volumen).')).toBeInTheDocument();
    await userEvent.selectOptions(within(form).getByLabelText('Cliente'), 'Restaurante Wanka');
    await userEvent.type(within(form).getByLabelText('Peso (kg)'), '2000');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    expect(within(form).getByRole('alert')).toHaveTextContent(
      'Ningún vehículo de la flota puede llevar 2000 kg: el de mayor capacidad carga 1500 kg.');
    await userEvent.clear(within(form).getByLabelText('Peso (kg)'));
    await userEvent.type(within(form).getByLabelText('Peso (kg)'), '20');
    await userEvent.type(within(form).getByLabelText('Volumen (m³)'), '230');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    expect(within(form).getByRole('alert')).toHaveTextContent('Ningún vehículo de la flota puede llevar 230 m³');
    fireEvent.change(within(form).getByLabelText('Volumen (m³)'), { target: { value: '2' } });
    fireEvent.change(within(form).getByLabelText('Entregar desde (vacío = horario del cliente)'), { target: { value: '12:00' } });
    fireEvent.change(within(form).getByLabelText('Entregar hasta'), { target: { value: '09:00' } });
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    expect(within(form).getByRole('alert')).toHaveTextContent('La ventana de entrega: la hora de fin (09:00)');
    expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(false);
    fireEvent.change(within(form).getByLabelText('Entregar hasta'), { target: { value: '15:00' } });
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
  });

  it('sin flota registrada no limita el peso', async () => {
    renderConSesion(<Pedidos />, 'PLANIFICADOR', {
      '/clientes': { body: [CLIENTE] },
      '/vehiculos': { body: [] },
      '/pedidos': { body: [], headers: { 'X-Total-Count': '0' } },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    expect(screen.queryByText(/^Máximo/)).not.toBeInTheDocument();
  });
});

describe('Desactivar con trabajo pendiente', () => {
  it('muestra por qué no se puede desactivar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderConSesion(<Vehiculos />, 'ADMIN', {
      '/vehiculos': { body: [VEHICULO], headers: { 'X-Total-Count': '1' } },
      'DELETE /vehiculos/1': {
        status: 409, body: { detail: 'El vehículo ABC-101 tiene entregas pendientes en la ruta #7. Registre una avería.' },
      },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Desactivar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('tiene entregas pendientes en la ruta #7');
  });
});

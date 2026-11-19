import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Clientes, Conductores, Pedidos, Vehiculos } from '../pages/Gestion';
import { renderConSesion, VEHICULO } from './utils';

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
    await userEvent.type(screen.getByLabelText('Código'), 'W-1');
    await userEvent.selectOptions(await screen.findByLabelText('Cliente'), 'Restaurante Wanka');
    await userEvent.type(screen.getByLabelText('Peso (kg)'), '80');
    await userEvent.selectOptions(screen.getByLabelText('Prioridad'), 'EXPRESS');
    await userEvent.selectOptions(screen.getByLabelText('Tipo de producto'), 'PERECEDERO');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo).toEqual({ codigo: 'W-1', cliente_id: 3, peso_kg: 80, prioridad: 'EXPRESS', tipo_producto: 'PERECEDERO' });
  });
});

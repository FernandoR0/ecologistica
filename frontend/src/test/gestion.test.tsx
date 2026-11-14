import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Conductores, Pedidos, Preferencias, Vehiculos } from '../pages/Gestion';
import { renderConSesion, VEHICULO } from './utils';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

const pedidos = (desde: number, n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: desde + i, codigo: `PED-${desde + i}`, cliente: 'Bodega', distrito: 'Huancayo', peso_kg: 50,
    ventana_inicio: '08:00', ventana_fin: '12:00', prioridad: 2, estado: 'PENDIENTE',
  }));

describe('tabla de gestión (CrudPage)', () => {
  it('lista la flota con valores legibles', async () => {
    renderConSesion(<Vehiculos />, 'ADMIN', { '/vehiculos': { body: [VEHICULO], headers: { 'X-Total-Count': '1' } } });
    expect(await screen.findByText('ABC-101')).toBeInTheDocument();
    expect(screen.getByText('Sí')).toBeInTheDocument();
    expect(screen.queryByRole('navigation', { name: 'Paginación' })).not.toBeInTheDocument();
  });

  it('pagina de 12 en 12', async () => {
    const { fetchFalso } = renderConSesion(<Pedidos />, 'PLANIFICADOR', {
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

  it('crea un registro nuevo con los tipos correctos', async () => {
    const { fetchFalso } = renderConSesion(<Vehiculos />, 'ADMIN', {
      '/vehiculos': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /vehiculos': { status: 201, body: VEHICULO },
    });
    expect(await screen.findByText('Sin registros')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '+ Nuevo' }));
    const form = screen.getByRole('form', { name: 'Formulario Flota' });
    await userEvent.type(within(form).getByLabelText('Placa'), 'ABC-101');
    await userEvent.type(within(form).getByLabelText('Capacidad (kg)'), '1500');
    await userEvent.selectOptions(within(form).getByLabelText('Combustible'), 'GLP');
    await userEvent.type(within(form).getByLabelText('Consumo /100 km (L o kWh)'), '13');
    await userEvent.click(within(form).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(screen.queryByRole('form')).not.toBeInTheDocument());
    const llamada = fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST');
    expect(JSON.parse(String(llamada?.[1]?.body))).toEqual({
      placa: 'ABC-101', capacidad_kg: 1500, combustible: 'GLP', consumo_100km: 13, activo: true,
    });
  });

  it('al editar pide el registro completo y no reenvía campos fijos', async () => {
    const { fetchFalso } = renderConSesion(<Vehiculos />, 'ADMIN', {
      '/vehiculos': (_i, url) => (url === '/vehiculos/1' ? { body: VEHICULO } : { body: [VEHICULO], headers: { 'X-Total-Count': '1' } }),
      'PUT /vehiculos/1': { body: VEHICULO },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const capacidad = await screen.findByLabelText('Capacidad (kg)');
    expect(screen.getByLabelText('Placa')).toBeDisabled();
    await userEvent.clear(capacidad);
    await userEvent.type(capacidad, '1800');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'PUT')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'PUT')?.[1]?.body));
    expect(cuerpo.capacidad_kg).toBe(1800);
    expect(cuerpo.placa).toBeUndefined();
  });

  it('muestra el error de la API al guardar', async () => {
    renderConSesion(<Conductores />, 'ADMIN', {
      '/conductores': { body: [], headers: { 'X-Total-Count': '0' } },
      'POST /conductores': { status: 422, body: { detail: [{ loc: ['body', 'dni'], msg: 'formato inválido' }] } },
    });
    await userEvent.click(await screen.findByRole('button', { name: '+ Nuevo' }));
    await userEvent.type(screen.getByLabelText('Nombre'), 'Ana Pérez');
    await userEvent.type(screen.getByLabelText('DNI'), '123');
    await userEvent.type(screen.getByLabelText('Licencia'), 'A-IIb-55');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('dni: formato inválido');
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('cancela un pedido después de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { fetchFalso } = renderConSesion(<Pedidos />, 'ADMIN', {
      '/pedidos': { body: pedidos(1, 1), headers: { 'X-Total-Count': '1' } },
      'DELETE /pedidos/1': { status: 204 },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'DELETE')).toBe(true));
  });

  it('el conductor no ve botones de edición', async () => {
    renderConSesion(<Vehiculos />, 'CONDUCTOR', { '/vehiculos': { body: [VEHICULO], headers: { 'X-Total-Count': '1' } } });
    await screen.findByText('ABC-101');
    await waitFor(() => expect(screen.queryByRole('button', { name: '+ Nuevo' })).not.toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument();
  });
});

describe('Preferencias de recepción', () => {
  const PREF = { id: 1, cliente: 'Restaurante Wanka', hora_desde: '09:00', hora_hasta: '11:00', dias: '1,2,3', notas: null };

  it('lista, guarda y elimina preferencias', async () => {
    const { fetchFalso } = renderConSesion(<Preferencias />, 'PLANIFICADOR', {
      '/preferencias': { body: [PREF] },
      'PUT /preferencias/': { body: PREF },
      'DELETE /preferencias/': { status: 204 },
    });
    expect(await screen.findByText('Restaurante Wanka')).toBeInTheDocument();
    expect(screen.getByText('09:00 – 11:00')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Cliente (igual que en el pedido)'), 'Botica Mantaro');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'PUT')).toBe(true));
    const put = fetchFalso.mock.calls.find((c) => c[1]?.method === 'PUT');
    expect(String(put?.[0])).toContain('/preferencias/Botica%20Mantaro');
    expect(JSON.parse(String(put?.[1]?.body)).notas).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'DELETE')).toBe(true));
  });

  it('muestra el error de validación de la API', async () => {
    renderConSesion(<Preferencias />, 'ADMIN', {
      '/preferencias': { body: [] },
      'PUT /preferencias/': { status: 422, body: { detail: 'hora_desde debe ser menor que hora_hasta' } },
    });
    await userEvent.type(await screen.findByLabelText('Cliente (igual que en el pedido)'), 'X');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('hora_desde debe ser menor que hora_hasta');
  });

  it('el conductor solo ve la lista', async () => {
    renderConSesion(<Preferencias />, 'CONDUCTOR', { '/preferencias': { body: [PREF] } });
    await screen.findByText('Restaurante Wanka');
    await waitFor(() => expect(screen.queryByRole('form')).not.toBeInTheDocument());
  });
});

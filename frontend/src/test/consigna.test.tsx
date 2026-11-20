import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { descargar } from '../api';
import { Administracion } from '../pages/Administracion';
import { Inicio, SostenibilidadPage } from '../pages/Paneles';
import { Rutas } from '../pages/Rutas';
import { renderConSesion, RUTA, simularApi } from './utils';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

const CONF = {
  velocidad_kmh: 25, velocidad_punta_kmh: 15, factor_vial: 1.3, peso_co2: 1, servicio_min: 10, limite_segundos: 30,
  precio_diesel_galon: 17.5, costo_mantenimiento_km: 1.2, digitos_placa_restringidos: '',
};

describe('Administración (RF-012)', () => {
  const rutasApi = (extra = {}) => ({
    '/auth/usuarios': { body: [{ id: 1, correo: 'admin@ecologistica.pe', nombre: 'Administrador', rol: 'ADMIN', activo: true },
      { id: 5, correo: 'rosa@ecologistica.pe', nombre: 'Rosa', rol: 'PLANIFICADOR', activo: false }] },
    '/configuracion': { body: CONF },
    '/auditoria': (_i?: RequestInit, url?: string) => ({
      body: [{ id: url?.includes('pagina=2') ? 20 : 1, fecha: '2026-11-14T03:00:00', correo: 'admin@ecologistica.pe', accion: 'POST',
        recurso: '/api/vehiculos', estado_http: 201 }],
      headers: { 'X-Total-Count': '20' },
    }),
    ...extra,
  });

  it('lista usuarios, crea uno y cambia su estado', async () => {
    const { fetchFalso } = renderConSesion(<Administracion />, 'ADMIN', rutasApi({
      'POST /auth/usuarios': { status: 201, body: { id: 6 } },
      'PUT /auth/usuarios/5': { body: { id: 5, activo: true } },
    }));
    expect(await screen.findByText('rosa@ecologistica.pe')).toBeInTheDocument();
    const form = screen.getByRole('form', { name: 'Crear usuario' });
    await userEvent.type(within(form).getByLabelText('Nombre'), 'Luis Quispe');
    await userEvent.type(within(form).getByLabelText('Correo'), 'luis@ecologistica.pe');
    await userEvent.type(within(form).getByLabelText('Contraseña inicial'), 'Clave1234');
    await userEvent.selectOptions(within(form).getByLabelText('Rol'), 'CONDUCTOR');
    await userEvent.click(within(form).getByRole('button', { name: 'Crear usuario' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo).toEqual({ nombre: 'Luis Quispe', correo: 'luis@ecologistica.pe', password: 'Clave1234', rol: 'CONDUCTOR' });
    await userEvent.click(screen.getByRole('button', { name: 'Activar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/auth/usuarios/5'))).toBe(true));
  });

  it('muestra errores al crear o cambiar usuarios', async () => {
    renderConSesion(<Administracion />, 'ADMIN', rutasApi({
      'POST /auth/usuarios': { status: 409, body: { detail: 'El correo ya está registrado' } },
      'PUT /auth/usuarios/5': { status: 409, body: { detail: 'No permitido' } },
    }));
    const form = await screen.findByRole('form', { name: 'Crear usuario' });
    await userEvent.type(within(form).getByLabelText('Nombre'), 'Repetido');
    await userEvent.type(within(form).getByLabelText('Correo'), 'rosa@ecologistica.pe');
    await userEvent.type(within(form).getByLabelText('Contraseña inicial'), 'Clave1234');
    await userEvent.click(within(form).getByRole('button', { name: 'Crear usuario' }));
    expect(await screen.findByText('El correo ya está registrado')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Activar' }));
    expect(await screen.findByText('No permitido')).toBeInTheDocument();
  });

  it('guarda los parámetros del motor', async () => {
    const { fetchFalso } = renderConSesion(<Administracion />, 'ADMIN', rutasApi({
      'PUT /configuracion': { body: { ...CONF, velocidad_kmh: 30 } },
    }));
    const vel = await screen.findByLabelText('Velocidad urbana promedio (km/h)');
    await userEvent.clear(vel);
    await userEvent.type(vel, '30');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar parámetros' }));
    expect(await screen.findByRole('status')).toHaveTextContent('Parámetros guardados');
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'PUT')?.[1]?.body));
    expect(cuerpo.velocidad_kmh).toBe(30);
  });

  it('muestra el error al guardar parámetros y si no carga la configuración', async () => {
    renderConSesion(<Administracion />, 'ADMIN', rutasApi({
      'PUT /configuracion': { status: 422, body: { detail: 'valor fuera de rango' } },
    }));
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar parámetros' }));
    expect(await screen.findByText('valor fuera de rango')).toBeInTheDocument();
  });

  it('informa si la configuración no se puede leer', async () => {
    renderConSesion(<Administracion />, 'ADMIN', rutasApi({ '/configuracion': { status: 403, body: { detail: 'Sin permiso' } } }));
    expect(await screen.findByText('Sin permiso')).toBeInTheDocument();
  });

  it('pagina la bitácora de auditoría', async () => {
    renderConSesion(<Administracion />, 'ADMIN', rutasApi());
    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByText('/api/vehiculos')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('Página 2 de 2')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    expect(await screen.findByText('Página 1 de 2')).toBeInTheDocument();
  });

  it('deja la bitácora vacía si falla', async () => {
    renderConSesion(<Administracion />, 'ADMIN', rutasApi({ '/auditoria': { status: 500, body: {} } }));
    await screen.findByText('Bitácora de auditoría');
    expect(screen.queryByText('/api/vehiculos')).not.toBeInTheDocument();
  });
});

describe('RF-005 y RF-006', () => {
  it('el dashboard muestra combustible, ventanas y equivalentes', async () => {
    renderConSesion(<Inicio />, 'PLANIFICADOR', {
      '/indicadores': { body: {
        pedidos_por_estado: {}, rutas: 2, vehiculos_activos: 3, entregas_planificadas: 20, distancia_km: 28.06,
        ahorro_km: 27.74, ahorro_km_pct: 49.7, co2_kg: 5.43, ahorro_co2_kg: 7.21, co2_por_entrega_kg: 0.272,
        combustible_ahorrado_l: 2.66, electricidad_ahorrada_kwh: 0.68, ahorro_combustible_soles: 11.6,
        cumplimiento_ventanas_pct: 100, arboles_equivalentes: 0.33 } },
    });
    expect(await screen.findByText('2.66 L')).toBeInTheDocument();
    expect(screen.getByText('100 %')).toBeInTheDocument();
    expect(screen.getByText('0.33 árboles')).toBeInTheDocument();
  });

  it('descarga el reporte PDF', async () => {
    const crear = vi.fn(() => 'blob:x');
    vi.stubGlobal('URL', { ...URL, createObjectURL: crear, revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { fetchFalso } = renderConSesion(<SostenibilidadPage />, 'PLANIFICADOR', {
      '/indicadores/sostenibilidad': { body: { co2_emitido_kg: 1, co2_evitado_por_optimizacion_kg: 1, co2_compensado_kg: 0,
        co2_neto_kg: 1, por_combustible: {} } },
      '/compensacion/plan': { body: { co2_pendiente_kg: 1, opciones: [] } },
      '/indicadores/reporte.pdf': { body: {} },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Descargar reporte PDF' }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(crear).toHaveBeenCalled();
    expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/indicadores/reporte.pdf'))).toBe(true);
  });

  it('informa si el PDF no se puede generar', async () => {
    renderConSesion(<SostenibilidadPage />, 'PLANIFICADOR', {
      '/indicadores/sostenibilidad': { body: { co2_emitido_kg: 1, co2_evitado_por_optimizacion_kg: 1, co2_compensado_kg: 0,
        co2_neto_kg: 1, por_combustible: {} } },
      '/compensacion/plan': { body: { co2_pendiente_kg: 1, opciones: [] } },
      '/indicadores/reporte.pdf': { status: 500, body: {} },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Descargar reporte PDF' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo descargar (500)');
  });

  it('descargar funciona sin sesión', async () => {
    const f = simularApi({ '/x.pdf': { body: {} } });
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:y', revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    await descargar('/x.pdf', 'x.pdf');
    expect(f.mock.calls[0][1]?.headers).toEqual({});
  });
});

describe('RF-007 y RF-008 en la pantalla Rutas', () => {
  it('re-optimiza por un pedido nuevo elegido de la lista', async () => {
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [{ ...RUTA, partida_lat: -12.056, partida_lng: -75.216 }] },
      '/pedidos': { body: [{ id: 21, codigo: 'PED-0021', cliente_nombre: 'Bodega Nueva', peso_kg: 40, estado: 'PENDIENTE' }] },
      'POST /rutas/7/reoptimizar': { body: { estado: 'FACTIBLE', rutas: [], no_asignados: [], distancia_total_km: 0,
        co2_total_kg: 0, ahorro_km: 0, ahorro_co2_kg: 0, tiempo_calculo_ms: 5 } },
    });
    await screen.findByText('Ruta #7 · ABC-101 (DIESEL)');
    await userEvent.selectOptions(screen.getByLabelText('Ruta'), '7');
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'PEDIDO_NUEVO');
    await screen.findByRole('option', { name: 'PED-0021 · Bodega Nueva (40 kg)' });
    await userEvent.selectOptions(screen.getByLabelText('Pedido nuevo que se agrega'), '21');
    await userEvent.click(screen.getByRole('button', { name: 'Re-optimizar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/reoptimizar'))).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => String(c[0]).includes('/reoptimizar'))?.[1]?.body));
    expect(cuerpo).toMatchObject({ tipo: 'PEDIDO_NUEVO', pedido_id: 21 });
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'CANCELACION');
    expect(screen.getByLabelText('Pedido que se cancela')).toBeInTheDocument();
  });
});

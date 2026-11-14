import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Inicio, SostenibilidadPage } from '../pages/Paneles';
import { renderConSesion } from './utils';

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

const DASH = {
  pedidos_por_estado: { PENDIENTE: 4, PLANIFICADO: 16 }, rutas: 2, vehiculos_activos: 3, entregas_planificadas: 16,
  distancia_km: 28.06, ahorro_km: 27.74, ahorro_km_pct: 49.7, co2_kg: 5.43, ahorro_co2_kg: 7.21, co2_por_entrega_kg: 0.272,
};
const SOST = {
  co2_emitido_kg: 5.43, co2_evitado_por_optimizacion_kg: 7.21, co2_compensado_kg: 1, co2_neto_kg: 4.43,
  por_combustible: { DIESEL: { km: 17.09, co2_kg: 5.04, rutas: 1 } },
};
const PLAN = {
  co2_pendiente_kg: 4.43,
  opciones: [
    { accion: 'Reforestación', arboles_necesarios_por_anio: 1, supuesto: '22 kg por árbol' },
    { accion: 'Bonos de carbono', costo_estimado_soles: 0.27, supuesto: 'S/ 60 por tonelada' },
  ],
};

describe('Dashboard', () => {
  it('muestra los indicadores', async () => {
    renderConSesion(<Inicio />, 'PLANIFICADOR', { '/indicadores': { body: DASH } });
    expect(await screen.findByText('28.06 km')).toBeInTheDocument();
    expect(screen.getByText('Ahorro 27.74 km (49.7 %)')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('muestra el error si la API falla', async () => {
    renderConSesion(<Inicio />, 'PLANIFICADOR', { '/indicadores': { status: 500, body: { detail: 'Fallo' } } });
    expect(await screen.findByText('Fallo')).toBeInTheDocument();
  });
});

describe('Sostenibilidad', () => {
  const rutas = { '/indicadores/sostenibilidad': { body: SOST }, '/compensacion/plan': { body: PLAN } };

  it('muestra el reporte y el plan de compensación', async () => {
    renderConSesion(<SostenibilidadPage />, 'PLANIFICADOR', rutas);
    expect(await screen.findByText('4.43 kg', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('DIESEL')).toBeInTheDocument();
    expect(await screen.findByText(/1 árboles\/año/)).toBeInTheDocument();
    expect(screen.getByText(/S\/ 0.27/)).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Registrar compensación' })).not.toBeInTheDocument();
  });

  it('el administrador registra una compensación', async () => {
    const { fetchFalso } = renderConSesion(<SostenibilidadPage />, 'ADMIN', {
      ...rutas,
      'POST /compensacion': { status: 201, body: { id: 1 } },
    });
    const form = await screen.findByRole('form', { name: 'Registrar compensación' });
    await userEvent.type(screen.getByLabelText('Acción'), 'Plantón de quinuales');
    await userEvent.type(screen.getByLabelText('kg CO₂'), '50');
    await userEvent.type(screen.getByLabelText('Costo (S/)'), '120');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo).toMatchObject({ accion: 'Plantón de quinuales', co2_kg: 50, costo_soles: 120, proveedor: null });
    expect(form).toBeInTheDocument();
  });

  it('muestra el error al registrar', async () => {
    renderConSesion(<SostenibilidadPage />, 'ADMIN', {
      ...rutas,
      'POST /compensacion': { status: 403, body: { detail: 'No tiene permisos para esta acción' } },
    });
    await screen.findByRole('form', { name: 'Registrar compensación' });
    await userEvent.type(screen.getByLabelText('Acción'), 'Plantón');
    await userEvent.type(screen.getByLabelText('kg CO₂'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tiene permisos para esta acción');
  });
});

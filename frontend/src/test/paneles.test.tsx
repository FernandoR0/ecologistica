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
  combustible_ahorrado_l: 3.1, electricidad_ahorrada_kwh: 0.5, ahorro_combustible_soles: 14.33, cumplimiento_ventanas_pct: 100,
  arboles_equivalentes: 0.33, mensaje: 'Has ahorrado S/ 14.33 en combustible hoy',
};
const SOST = {
  co2_emitido_kg: 5.43, co2_evitado_por_optimizacion_kg: 7.21, co2_compensado_kg: 1, co2_neto_kg: 4.43,
  creditos_carbono_soles: 0.43, avance_cero_neto_pct: 18.4,
  por_combustible: { DIESEL: { km: 17.09, co2_kg: 5.04, rutas: 1 } },
};
const PLAN = {
  co2_pendiente_kg: 4.43,
  meta: 'Operación carbono neutral en 3 años',
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
    expect(screen.getByRole('status')).toHaveTextContent('Has ahorrado S/ 14.33 en combustible hoy');
  });

  it('el conductor va directo a su modo conductor', async () => {
    const { fetchFalso } = renderConSesion(<Inicio />, 'CONDUCTOR', { '/indicadores': { body: DASH } });
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/auth/me'))).toBe(true));
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/indicadores'))).toBe(false);
  });

  it('muestra el error si la API falla', async () => {
    renderConSesion(<Inicio />, 'PLANIFICADOR', { '/indicadores': { status: 500, body: { detail: 'Fallo' } } });
    expect(await screen.findByText('Fallo')).toBeInTheDocument();
  });
});

describe('Sostenibilidad', () => {
  const LCC = {
    dias: 1, total_soles: 210.5,
    vehiculos: [{ placa: 'ABC-101', km: 17.1, combustible_soles: 8.8, mantenimiento_soles: 20.52, depreciacion_soles: 65.75,
      seguros_soles: 9.59, total_soles: 104.66, costo_por_km: 6.12 }],
  };
  const rutas = {
    '/indicadores/sostenibilidad': { body: SOST }, '/compensacion/plan': { body: PLAN }, '/indicadores/costo-ciclo-vida': { body: LCC },
  };

  it('muestra el reporte y el plan de compensación', async () => {
    renderConSesion(<SostenibilidadPage />, 'AUDITOR', rutas);
    expect(await screen.findByText('4.43 kg', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText('S/ 0.43')).toBeInTheDocument();
    expect(await screen.findByText('104.66')).toBeInTheDocument();
    expect(screen.getByText(/Meta: Operación carbono neutral en 3 años/)).toBeInTheDocument();
    expect(screen.getByText('DIESEL')).toBeInTheDocument();
    expect(await screen.findByText(/1 árboles\/año/)).toBeInTheDocument();
    expect(screen.getByText(/S\/ 0.27/)).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Registrar compensación' })).not.toBeInTheDocument();
  });

  it('el planificador registra una compensación', async () => {
    const { fetchFalso } = renderConSesion(<SostenibilidadPage />, 'PLANIFICADOR', {
      ...rutas,
      'POST /compensacion': { status: 201, body: { id: 1 } },
    });
    const form = await screen.findByRole('form', { name: 'Registrar compensación' });
    await userEvent.selectOptions(screen.getByLabelText('Acción'), 'BONO_CARBONO');
    await userEvent.type(screen.getByLabelText('Proveedor'), 'Programa de reforestación de Junín');
    await userEvent.type(screen.getByLabelText('kg CO₂'), '50');
    await userEvent.type(screen.getByLabelText('Costo (S/)'), '120');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'POST')).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo).toMatchObject({ accion: 'BONO_CARBONO', co2_kg: 50, costo_soles: 120, proveedor: 'Programa de reforestación de Junín' });
    expect(form).toBeInTheDocument();
  });

  it('muestra el error al registrar', async () => {
    renderConSesion(<SostenibilidadPage />, 'ADMIN', {
      ...rutas,
      'POST /compensacion': { status: 403, body: { detail: 'No tiene permisos para esta acción' } },
    });
    await screen.findByRole('form', { name: 'Registrar compensación' });
    await userEvent.type(screen.getByLabelText('kg CO₂'), '5');
    await userEvent.click(screen.getByRole('button', { name: 'Registrar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No tiene permisos para esta acción');
  });
});

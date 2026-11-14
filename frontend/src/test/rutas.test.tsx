import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapaRutas } from '../components/MapaRutas';
import { Rutas } from '../pages/Rutas';
import { renderConSesion, RUTA } from './utils';

afterEach(() => {
  vi.unstubAllGlobals();
  sessionStorage.clear();
});

const PLAN = {
  estado: 'FACTIBLE', rutas: [RUTA], no_asignados: [15], distancia_total_km: 12.5, co2_total_kg: 3.68,
  ahorro_km: 7.6, ahorro_co2_kg: 2.22, tiempo_calculo_ms: 1500,
};

describe('pantalla Rutas', () => {
  it('lista las rutas vigentes con sus paradas', async () => {
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [RUTA, { ...RUTA, id: 8, estado: 'COMPLETADA' }] },
    });
    expect(await screen.findByText('Ruta #7 · ABC-101 (DIESEL)')).toBeInTheDocument();
    expect(screen.queryByText(/Ruta #8/)).not.toBeInTheDocument();
    expect(screen.getByText(/Bodega Doña Rosa/)).toBeInTheDocument();
    expect(String(fetchFalso.mock.calls.find((c) => String(c[0]).includes('/rutas'))?.[0])).toContain(
      'estado=PLANIFICADA,EN_CURSO',
    );
    expect(screen.getByRole('region', { name: 'Mapa de rutas' })).toBeInTheDocument();
  });

  it('genera rutas y muestra el resumen con los pedidos sin asignar', async () => {
    renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [] },
      'POST /rutas/optimizar': { body: PLAN },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Generar rutas optimizadas' }));
    const resumen = await screen.findByRole('status');
    expect(resumen).toHaveTextContent('FACTIBLE');
    expect(resumen).toHaveTextContent('ahorro 7.6 km');
    expect(resumen).toHaveTextContent('1 pedido(s) sin asignar');
    expect(resumen).toHaveTextContent('#15');
  });

  it('muestra el error cuando no hay pedidos', async () => {
    renderConSesion(<Rutas />, 'ADMIN', {
      '/rutas': { body: [] },
      'POST /rutas/optimizar': { status: 409, body: { detail: 'No hay pedidos pendientes para planificar' } },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Generar rutas optimizadas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay pedidos pendientes para planificar');
  });

  it('registra un incidente y re-optimiza', async () => {
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [RUTA] },
      'POST /rutas/7/reoptimizar': { body: { ...PLAN, no_asignados: [], rutas: [{ ...RUTA, id: 9, ruta_origen_id: 7 }] } },
    });
    await screen.findByText('Ruta #7 · ABC-101 (DIESEL)');
    await userEvent.selectOptions(screen.getByLabelText('Ruta'), '7');
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'AVERIA_VEHICULO');
    await userEvent.type(screen.getByLabelText('Pedidos ya entregados (IDs, separados por coma)'), '11, 12');
    await userEvent.click(screen.getByRole('button', { name: 'Re-optimizar' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('FACTIBLE'));
    const llamada = fetchFalso.mock.calls.find((c) => String(c[0]).includes('/reoptimizar'));
    expect(JSON.parse(String(llamada?.[1]?.body))).toEqual({
      tipo: 'AVERIA_VEHICULO', hora_actual: '10:00', demora_min: 30, paradas_completadas: [11, 12],
    });
  });

  it('muestra el error al re-optimizar', async () => {
    renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [RUTA] },
      'POST /rutas/7/reoptimizar': { status: 409, body: { detail: 'No hay vehículos disponibles para re-optimizar' } },
    });
    await screen.findByText('Ruta #7 · ABC-101 (DIESEL)');
    await userEvent.selectOptions(screen.getByLabelText('Ruta'), '7');
    await userEvent.click(screen.getByRole('button', { name: 'Re-optimizar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay vehículos disponibles');
  });

  it('el conductor ve solo sus rutas y no puede generar', async () => {
    const { fetchFalso } = renderConSesion(<Rutas />, 'CONDUCTOR', { '/rutas/mias': { body: [RUTA] } });
    expect(await screen.findByText('Ruta #7 · ABC-101 (DIESEL)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Generar rutas optimizadas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Registrar incidente' })).not.toBeInTheDocument();
    expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/rutas/mias'))).toBe(true);
  });
});

describe('MapaRutas', () => {
  it('dibuja el depósito, la línea de cada ruta y las paradas numeradas', () => {
    const { container, rerender } = render(<MapaRutas rutas={[]} />);
    rerender(<MapaRutas rutas={[RUTA]} />);
    const pines = container.querySelectorAll('.pin span');
    expect(Array.from(pines).map((p) => p.textContent)).toEqual(['1', '2']);
    expect(container.querySelectorAll('path.leaflet-interactive').length).toBeGreaterThanOrEqual(2);
  });
});

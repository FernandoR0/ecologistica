import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapaRutas } from '../components/MapaRutas';
import { MiRuta } from '../pages/MiRuta';
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
const ZONAS = [
  { id: 1, nombre: 'Centro de Huancayo', tipo: 'RESTRINGIDA', poligono: [[-12.064, -75.21], [-12.064, -75.205], [-12.07, -75.205]] },
  { id: 2, nombre: 'Distrito de Chilca', tipo: 'DISTRITO', poligono: [[-12.08, -75.21], [-12.08, -75.2], [-12.09, -75.2]] },
];

describe('pantalla Rutas', () => {
  it('lista las rutas vigentes con tramos, congestión y entregas fuera de ventana', async () => {
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', { '/rutas': { body: [RUTA] }, '/zonas': { body: ZONAS } });
    expect(await screen.findByText('Ruta #7 · ABC-101 (DIESEL)')).toBeInTheDocument();
    expect(screen.getByText(/Bodega Doña Rosa/)).toHaveTextContent('congestión alta');
    expect(screen.getByText(/Minimarket El Sol/)).toHaveTextContent('fuera de ventana');
    expect(String(fetchFalso.mock.calls.find((c) => String(c[0]).includes('/rutas'))?.[0])).toContain(
      'estado=PLANIFICADA,EN_CURSO',
    );
    expect(screen.getByRole('region', { name: 'Mapa de rutas' })).toBeInTheDocument();
    expect(screen.getByLabelText('Leyenda del mapa')).toHaveTextContent('alta (hora punta)');
  });

  it('genera rutas y muestra el resumen con los pedidos sin asignar', async () => {
    renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [] },
      '/zonas': { body: [] },
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
      '/zonas': { status: 500, body: {} },
      'POST /rutas/optimizar': { status: 409, body: { detail: 'No hay pedidos pendientes para planificar' } },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Generar rutas optimizadas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay pedidos pendientes para planificar');
  });

  it('registra un accidente con descripción y re-optimiza', async () => {
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [RUTA] },
      '/zonas': { body: [] },
      'POST /rutas/7/reoptimizar': { body: { ...PLAN, no_asignados: [], rutas: [{ ...RUTA, id: 9, ruta_origen_id: 7, descanso_min: 60 }] } },
    });
    await screen.findByText('Ruta #7 · ABC-101 (DIESEL)');
    await userEvent.selectOptions(screen.getByLabelText('Ruta'), '7');
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'ACCIDENTE');
    await userEvent.type(screen.getByLabelText('Pedidos ya entregados (IDs, separados por coma)'), '11, 12');
    await userEvent.type(screen.getByLabelText('Descripción'), 'Choque en Av. Ferrocarril');
    await userEvent.click(screen.getByRole('button', { name: 'Re-optimizar' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('FACTIBLE'));
    const llamada = fetchFalso.mock.calls.find((c) => String(c[0]).includes('/reoptimizar'));
    expect(JSON.parse(String(llamada?.[1]?.body))).toEqual({
      tipo: 'ACCIDENTE', hora_actual: '10:00', demora_min: 30, paradas_completadas: [11, 12],
      descripcion: 'Choque en Av. Ferrocarril',
    });
  });

  it('pide el ID del pedido nuevo o cancelado', async () => {
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [RUTA] },
      '/zonas': { body: [] },
      'POST /rutas/7/reoptimizar': { body: PLAN },
    });
    await screen.findByText('Ruta #7 · ABC-101 (DIESEL)');
    await userEvent.selectOptions(screen.getByLabelText('Ruta'), '7');
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'PEDIDO_NUEVO');
    await userEvent.type(screen.getByLabelText('ID del pedido nuevo'), '21');
    await userEvent.click(screen.getByRole('button', { name: 'Re-optimizar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/reoptimizar'))).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => String(c[0]).includes('/reoptimizar'))?.[1]?.body));
    expect(cuerpo.pedido_id).toBe(21);
  });

  it('muestra el error al re-optimizar', async () => {
    renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [RUTA] },
      '/zonas': { body: [] },
      'POST /rutas/7/reoptimizar': { status: 409, body: { detail: 'No hay vehículos disponibles para re-optimizar' } },
    });
    await screen.findByText('Ruta #7 · ABC-101 (DIESEL)');
    await userEvent.selectOptions(screen.getByLabelText('Ruta'), '7');
    await userEvent.click(screen.getByRole('button', { name: 'Re-optimizar' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('No hay vehículos disponibles');
  });

  it('el auditor ve las rutas pero no puede generar ni re-optimizar', async () => {
    renderConSesion(<Rutas />, 'AUDITOR', { '/rutas': { body: [RUTA] }, '/zonas': { body: [] } });
    expect(await screen.findByText('Ruta #7 · ABC-101 (DIESEL)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Generar rutas optimizadas' })).not.toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Registrar incidente' })).not.toBeInTheDocument();
  });
});

describe('Modo conductor (US-014)', () => {
  it('muestra la siguiente entrega con alertas y la marca como entregada', async () => {
    const { fetchFalso } = renderConSesion(<MiRuta />, 'CONDUCTOR', {
      '/rutas/mias': { body: [RUTA] },
      'PATCH /rutas/7/paradas/1/entregada': { body: {} },
    });
    expect(await screen.findByRole('heading', { name: 'Siguiente entrega' })).toBeInTheDocument();
    expect(screen.getByText('Bodega Doña Rosa', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Tráfico alto (hora punta)');
    await userEvent.click(screen.getByRole('button', { name: '✔ Entregado' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => c[1]?.method === 'PATCH')).toBe(true));
  });

  it('indica la entrega fuera de horario y la ruta completada', async () => {
    const segunda = { ...RUTA, paradas: [{ ...RUTA.paradas[0], estado: 'ENTREGADA' }, RUTA.paradas[1]] };
    const { unmount } = renderConSesion(<MiRuta />, 'CONDUCTOR', { '/rutas/mias': { body: [segunda] } });
    expect(await screen.findByText(/Llegarás fuera del horario/)).toBeInTheDocument();
    unmount();
    const hecha = { ...RUTA, paradas: RUTA.paradas.map((p) => ({ ...p, estado: 'ENTREGADA' })) };
    renderConSesion(<MiRuta />, 'CONDUCTOR', { '/rutas/mias': { body: [hecha] } });
    expect(await screen.findByText(/Ruta completada/)).toBeInTheDocument();
  });

  it('avisa si no hay ruta y muestra errores', async () => {
    const { unmount } = renderConSesion(<MiRuta />, 'CONDUCTOR', { '/rutas/mias': { body: [] } });
    expect(await screen.findByText('No tienes una ruta asignada por ahora.')).toBeInTheDocument();
    unmount();
    renderConSesion(<MiRuta />, 'CONDUCTOR', {
      '/rutas/mias': { body: [RUTA] },
      'PATCH /rutas/7/paradas/1/entregada': { status: 403, body: { detail: 'Solo puede marcar entregas de su propia ruta' } },
    });
    await userEvent.click(await screen.findByRole('button', { name: '✔ Entregado' }));
    expect(await screen.findByText('Solo puede marcar entregas de su propia ruta')).toBeInTheDocument();
  });
});

describe('MapaRutas', () => {
  it('dibuja depósito, tramos coloreados, paradas numeradas y zonas', () => {
    const { container, rerender } = render(<MapaRutas rutas={[]} />);
    rerender(<MapaRutas rutas={[RUTA]} zonas={ZONAS as never} />);
    const pines = container.querySelectorAll('.pin span');
    expect(Array.from(pines).map((p) => p.textContent)).toEqual(['1', '2']);
    // borde de la ruta + 2 tramos + 2 zonas
    expect(container.querySelectorAll('path.leaflet-interactive').length).toBeGreaterThanOrEqual(5);
  });

  it('avisa cuando no carga el mapa base', async () => {
    const { container } = render(<MapaRutas rutas={[RUTA]} />);
    const mosaico = container.querySelector('img.leaflet-tile');
    if (mosaico) fireEvent.error(mosaico);
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('No se pudo cargar el mapa base'));
  });
});

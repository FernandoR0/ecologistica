import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapaRutas } from '../components/MapaRutas';
import { reducirFoto } from '../foto';
import { MiRuta } from '../pages/MiRuta';

vi.mock('../foto', () => ({ reducirFoto: vi.fn() }));
const foto = { reducirFoto: vi.mocked(reducirFoto) };
import { Rutas } from '../pages/Rutas';
import { renderConSesion, RUTA } from './utils';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
  localStorage.clear();
});

const SIGUIENTE = /^(Primera entrega|Ahora vas a) · \d+ de \d+$/;

const sinRed = () => {
  throw new TypeError('Failed to fetch');
};

const PLAN = {
  estado: 'FACTIBLE', rutas: [RUTA], no_asignados: [15], distancia_total_km: 12.5, co2_total_kg: 3.68,
  ahorro_km: 7.6, ahorro_co2_kg: 2.22, tiempo_calculo_ms: 1500,
};
const ZONAS = [
  { id: 1, nombre: 'Centro de Huancayo', tipo: 'RESTRINGIDA', poligono: [[-12.064, -75.21], [-12.064, -75.205], [-12.07, -75.205]] },
  { id: 2, nombre: 'Distrito de Chilca', tipo: 'DISTRITO', poligono: [[-12.08, -75.21], [-12.08, -75.2], [-12.09, -75.2]] },
];

describe('pantalla Rutas', () => {
  it('el planificador ve la foto con la que el conductor confirmó la entrega', async () => {
    const crear = vi.fn(() => 'blob:foto-1');
    const revocar = vi.fn();
    Object.assign(URL, { createObjectURL: crear, revokeObjectURL: revocar });
    const conFoto = { ...RUTA, paradas: [{ ...RUTA.paradas[0], estado: 'ENTREGADA', con_foto: true }, RUTA.paradas[1]] };
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas/7/paradas/1/evidencia': { body: {} },
      '/rutas': { body: [conFoto] },
      '/zonas': { body: [] },
    });
    expect(await screen.findByText(/Bodega Doña Rosa/)).toHaveTextContent('entregado');
    expect(screen.getAllByRole('button', { name: '📷 Ver foto' })).toHaveLength(1);
    await userEvent.click(screen.getByRole('button', { name: '📷 Ver foto' }));
    expect(await screen.findByRole('img', { name: 'Foto de la entrega a Bodega Doña Rosa' })).toHaveAttribute('src', 'blob:foto-1');
    expect(fetchFalso.mock.calls.some((c) => String(c[0]).endsWith('/rutas/7/paradas/1/evidencia'))).toBe(true);
    await userEvent.click(screen.getByRole('button', { name: '📷 Ver foto' }));
    expect(revocar).toHaveBeenCalledWith('blob:foto-1');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('avisa si la foto de la entrega no se puede cargar', async () => {
    const conFoto = { ...RUTA, paradas: [{ ...RUTA.paradas[0], estado: 'ENTREGADA', con_foto: true }] };
    renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas/7/paradas/1/evidencia': { status: 404, body: { detail: 'La entrega no tiene foto' } },
      '/rutas': { body: [conFoto] },
      '/zonas': { body: [] },
    });
    await userEvent.click(await screen.findByRole('button', { name: '📷 Ver foto' }));
    expect(await screen.findByText('No se pudo cargar la foto (404)')).toBeInTheDocument();
  });

  it('lista las rutas vigentes con tramos, congestión y entregas fuera de ventana', async () => {
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', { '/rutas': { body: [RUTA] }, '/zonas': { body: ZONAS } });
    expect(await screen.findByText('Ruta #7 · ABC-101 (DIESEL)')).toBeInTheDocument();
    expect(screen.getByText(/Bodega Doña Rosa/)).toHaveTextContent('congestión alta');
    expect(screen.getByText(/Minimarket El Sol/)).toHaveTextContent('fuera de ventana');
    // Solo las rutas de hoy y las que siguen en curso
    expect(String(fetchFalso.mock.calls.find((c) => String(c[0]).includes('/rutas'))?.[0])).toContain('vigentes=true');
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
    expect(resumen).not.toHaveTextContent('Se volvieron a planificar');
  });

  it('avisa cuando se rehacen las rutas que aún no salían', async () => {
    renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [] },
      '/zonas': { body: [] },
      'POST /rutas/optimizar': { body: { ...PLAN, rutas_reemplazadas: 2 } },
    });
    await userEvent.click(await screen.findByRole('button', { name: 'Generar rutas optimizadas' }));
    expect(await screen.findByRole('status')).toHaveTextContent(
      'Se volvieron a planificar 2 ruta(s) que aún no salían, junto con los pedidos nuevos. Las rutas en reparto no se modificaron.');
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
    // Ya no se escriben IDs de pedidos entregados: los marca el conductor
    expect(screen.queryByLabelText(/Pedidos ya entregados/)).not.toBeInTheDocument();
    expect((screen.getByLabelText('Hora actual') as HTMLInputElement).value).toMatch(/^\d\d:\d\d$/);
    fireEvent.change(screen.getByLabelText('Hora actual'), { target: { value: '10:00' } });
    await userEvent.type(screen.getByLabelText('Descripción'), 'Choque en Av. Ferrocarril');
    await userEvent.click(screen.getByRole('button', { name: 'Re-optimizar' }));
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('FACTIBLE'));
    const llamada = fetchFalso.mock.calls.find((c) => String(c[0]).includes('/reoptimizar'));
    expect(JSON.parse(String(llamada?.[1]?.body))).toEqual({
      tipo: 'ACCIDENTE', hora_actual: '10:00', demora_min: 30, paradas_completadas: [],
      descripcion: 'Choque en Av. Ferrocarril',
    });
  });

  it('elige el pedido nuevo de una lista de pendientes', async () => {
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [RUTA] },
      '/zonas': { body: [] },
      '/pedidos': { body: [{ id: 21, codigo: 'PED-0021', cliente_nombre: 'Bodega San Carlos', peso_kg: 30, estado: 'PENDIENTE' }] },
      'POST /rutas/7/reoptimizar': { body: PLAN },
    });
    await screen.findByText('Ruta #7 · ABC-101 (DIESEL)');
    await userEvent.selectOptions(screen.getByLabelText('Ruta'), '7');
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'PEDIDO_NUEVO');
    const lista = await screen.findByLabelText('Pedido nuevo que se agrega');
    await screen.findByRole('option', { name: 'PED-0021 · Bodega San Carlos (30 kg)' });
    expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/pedidos?estado=PENDIENTE'))).toBe(true);
    await userEvent.selectOptions(lista, '21');
    await userEvent.click(screen.getByRole('button', { name: 'Re-optimizar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/reoptimizar'))).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => String(c[0]).includes('/reoptimizar'))?.[1]?.body));
    expect(cuerpo.pedido_id).toBe(21);
  });

  it('para cancelar ofrece solo los pedidos pendientes de la ruta elegida', async () => {
    const enCurso = { ...RUTA, paradas: [{ ...RUTA.paradas[0], estado: 'ENTREGADA' }, RUTA.paradas[1]] };
    const { fetchFalso } = renderConSesion(<Rutas />, 'PLANIFICADOR', {
      '/rutas': { body: [enCurso] },
      '/zonas': { body: [] },
      'POST /rutas/7/reoptimizar': { body: PLAN },
    });
    await screen.findByText('Ruta #7 · ABC-101 (DIESEL)');
    await userEvent.selectOptions(screen.getByLabelText('Tipo'), 'CANCELACION');
    expect(screen.getByRole('option', { name: 'No hay pedidos para elegir' })).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText('Ruta'), '7');
    const lista = screen.getByLabelText('Pedido que se cancela');
    expect(screen.queryByRole('option', { name: /Bodega Doña Rosa/ })).not.toBeInTheDocument();
    await userEvent.selectOptions(lista, '12');
    expect(screen.getByRole('option', { name: 'PED-0012 · Minimarket El Sol (09:05)' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Re-optimizar' }));
    await waitFor(() => expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/reoptimizar'))).toBe(true));
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => String(c[0]).includes('/reoptimizar'))?.[1]?.body));
    expect(cuerpo).toMatchObject({ tipo: 'CANCELACION', pedido_id: 12 });
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
    expect(await screen.findByRole('heading', { name: SIGUIENTE })).toBeInTheDocument();
    expect(screen.getByText('Bodega Doña Rosa', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Tráfico alto (hora punta)');
    await userEvent.click(screen.getByRole('button', { name: '✔ Entregado a Bodega Doña Rosa' }));
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
    await userEvent.click(await screen.findByRole('button', { name: '✔ Entregado a Bodega Doña Rosa' }));
    expect(await screen.findByText('Solo puede marcar entregas de su propia ruta')).toBeInTheDocument();
  });

  it('abre la navegación a la siguiente entrega en Google Maps', async () => {
    renderConSesion(<MiRuta />, 'CONDUCTOR', { '/rutas/mias': { body: [RUTA] } });
    const enlace = await screen.findByRole('link', { name: '🧭 Cómo llegar a Bodega Doña Rosa' });
    expect(enlace).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=-12.06,-75.21&travelmode=driving');
    expect(enlace).toHaveAttribute('target', '_blank');
  });

  it('confirma la entrega a la vista y muestra el avance y la siguiente parada', async () => {
    let entregada = false;
    const { container } = renderConSesion(<MiRuta />, 'CONDUCTOR', {
      '/rutas/mias': () => ({
        body: [entregada
          ? { ...RUTA, paradas: [{ ...RUTA.paradas[0], estado: 'ENTREGADA', entregada_en: '2026-11-20T13:32:00Z' }, RUTA.paradas[1]] }
          : RUTA],
      }),
      'PATCH /rutas/7/paradas/1/entregada': () => {
        entregada = true;
        return { body: {} };
      },
    });
    expect(await screen.findByRole('heading', { name: 'Primera entrega · 1 de 2' })).toBeInTheDocument();
    expect(screen.getByLabelText('Avance de la ruta: 0 de 2 entregas')).toHaveAttribute('value', '0');
    await userEvent.click(screen.getByRole('button', { name: '✔ Entregado a Bodega Doña Rosa' }));
    await waitFor(() => expect(container.querySelector('.confirmacion-entrega')).toHaveTextContent(
      /✔ Entregado a Bodega Doña Rosa a las \d\d:\d\d.*Registrado en el sistema\./));
    expect(await screen.findByRole('heading', { name: 'Ahora vas a · 2 de 2' })).toBeInTheDocument();
    expect(screen.getByText('Minimarket El Sol', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByLabelText('Avance de la ruta: 1 de 2 entregas')).toHaveAttribute('value', '1');
    expect(screen.getByText(/✔ 08:20 · Bodega Doña Rosa \(entregado \d\d:\d\d\)/)).toBeInTheDocument();
    expect(screen.getByText(/➜ 09:05 · Minimarket El Sol/)).toBeInTheDocument();
  });

  it('adjunta una foto opcional y la envía junto con la entrega', async () => {
    const reducir = foto.reducirFoto.mockReset().mockResolvedValue('data:image/jpeg;base64,QUJD');
    let entregada = false;
    const { fetchFalso } = renderConSesion(<MiRuta />, 'CONDUCTOR', {
      '/rutas/mias': () => ({
        body: [entregada ? { ...RUTA, paradas: [{ ...RUTA.paradas[0], estado: 'ENTREGADA', con_foto: true }, RUTA.paradas[1]] } : RUTA],
      }),
      'PATCH /rutas/7/paradas/1/entregada': () => {
        entregada = true;
        return { body: {} };
      },
      'PUT /rutas/7/paradas/1/evidencia': { body: {} },
    });
    const entrada = await screen.findByLabelText('📷 Tomar foto de la entrega (opcional)');
    expect(entrada).toHaveAttribute('accept', 'image/*');
    expect(entrada).toHaveAttribute('capture', 'environment');
    await userEvent.upload(entrada, new File(['x'], 'entrega.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByRole('img', { name: 'Foto de la entrega a Bodega Doña Rosa' })).toHaveAttribute(
      'src', 'data:image/jpeg;base64,QUJD');
    await userEvent.click(screen.getByRole('button', { name: 'Quitar foto' }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    await userEvent.upload(screen.getByLabelText('📷 Tomar foto de la entrega (opcional)'),
      new File(['x'], 'entrega.jpg', { type: 'image/jpeg' }));
    await userEvent.click(await screen.findByRole('button', { name: '✔ Entregado a Bodega Doña Rosa' }));
    expect(await screen.findByText(/📷 Con foto de confirmación\./)).toBeInTheDocument();
    const put = fetchFalso.mock.calls.find((c) => c[1]?.method === 'PUT');
    expect(JSON.parse(String(put?.[1]?.body))).toEqual({ imagen: 'data:image/jpeg;base64,QUJD' });
    expect(await screen.findByText(/Bodega Doña Rosa \(entregado 📷\)/)).toBeInTheDocument();
    expect(reducir).toHaveBeenCalledTimes(2);
  });

  it('avisa si la foto no se puede leer', async () => {
    foto.reducirFoto.mockReset().mockRejectedValue(new Error('No se pudo leer la foto. Intenta tomarla de nuevo.'));
    renderConSesion(<MiRuta />, 'CONDUCTOR', { '/rutas/mias': { body: [RUTA] } });
    await userEvent.upload(await screen.findByLabelText('📷 Tomar foto de la entrega (opcional)'),
      new File(['x'], 'mala.jpg', { type: 'image/jpeg' }));
    expect(await screen.findByText('No se pudo leer la foto. Intenta tomarla de nuevo.')).toBeInTheDocument();
  });
});

describe('Modo conductor sin conexión (RNF-006)', () => {
  it('muestra la ruta guardada en el celular cuando no hay señal', async () => {
    const { unmount } = renderConSesion(<MiRuta />, 'CONDUCTOR', { '/rutas/mias': { body: [RUTA] } });
    expect(await screen.findByRole('heading', { name: SIGUIENTE })).toBeInTheDocument();
    unmount();
    renderConSesion(<MiRuta />, 'CONDUCTOR', { '/rutas/mias': sinRed });
    expect(await screen.findByText(/📴 Sin conexión\. Se muestra tu ruta guardada a las/)).toBeInTheDocument();
    expect(screen.getByText('Bodega Doña Rosa', { selector: 'b' })).toBeInTheDocument();
    expect(screen.queryByText(/No se pudo conectar/)).not.toBeInTheDocument();
  });

  it('sin ruta guardada explica que no hay conexión', async () => {
    renderConSesion(<MiRuta />, 'CONDUCTOR', { '/rutas/mias': sinRed });
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo conectar con el servidor');
    expect(screen.queryByText('No tienes una ruta asignada por ahora.')).not.toBeInTheDocument();
  });

  it('marca la entrega sin señal y la envía sola cuando vuelve la conexión', async () => {
    let conectado = true;
    const enviadas: string[] = [];
    const { fetchFalso } = renderConSesion(<MiRuta />, 'CONDUCTOR', {
      '/rutas/mias': () => (conectado ? { body: [RUTA] } : sinRed()),
      'PATCH /rutas/7/paradas': (_i, url) => {
        if (!conectado) return sinRed();
        enviadas.push(String(url));
        return { body: {} };
      },
    });
    await screen.findByRole('heading', { name: SIGUIENTE });
    conectado = false;
    await userEvent.click(screen.getByRole('button', { name: '✔ Entregado a Bodega Doña Rosa' }));
    expect(await screen.findByText('⏳ 1 entrega pendiente de enviar.')).toBeInTheDocument();
    expect(screen.getByText(/📴 Sin conexión/)).toBeInTheDocument();
    // La pantalla avanza a la siguiente entrega aunque no haya señal
    expect(screen.getByText('Minimarket El Sol', { selector: 'b' })).toBeInTheDocument();
    expect(screen.getByText(/Bodega Doña Rosa \(entregado \d\d:\d\d\)/)).toBeInTheDocument();
    expect(screen.getByText(/Se enviará al volver la señal\./)).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('eco_entregas_pendientes')!)).toEqual([{ rutaId: 7, paradaId: 1 }]);

    conectado = true;
    fireEvent(window, new Event('online'));
    await waitFor(() => expect(enviadas).toEqual(['/rutas/7/paradas/1/entregada']));
    await waitFor(() => expect(screen.queryByText(/pendiente de enviar/)).not.toBeInTheDocument());
    expect(screen.queryByText(/📴 Sin conexión/)).not.toBeInTheDocument();
    expect(localStorage.getItem('eco_entregas_pendientes')).toBe('[]');
    expect(fetchFalso).toHaveBeenCalled();
  });

  it('si no llega el evento "online", reintenta solo cada 15 segundos', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      let conectado = false;
      localStorage.setItem('eco_mi_ruta', JSON.stringify({ rutas: [RUTA], guardadaEn: '2026-11-20T15:00:00Z' }));
      renderConSesion(<MiRuta />, 'CONDUCTOR', { '/rutas/mias': () => (conectado ? { body: [RUTA] } : sinRed()) });
      expect(await screen.findByText(/📴 Sin conexión/)).toBeInTheDocument();
      conectado = true;
      await vi.advanceTimersByTimeAsync(15_000);
      await waitFor(() => expect(screen.queryByText(/📴 Sin conexión/)).not.toBeInTheDocument());
    } finally {
      vi.useRealTimers();
    }
  });

  it('descarta una entrega pendiente que la API rechaza y sigue con las demás', async () => {
    localStorage.setItem('eco_entregas_pendientes', JSON.stringify([{ rutaId: 7, paradaId: 1 }, { rutaId: 7, paradaId: 2 }]));
    const { fetchFalso } = renderConSesion(<MiRuta />, 'CONDUCTOR', {
      '/rutas/mias': { body: [RUTA] },
      'PATCH /rutas/7/paradas/1/entregada': { status: 404, body: { detail: 'Parada no existe en esta ruta' } },
      'PATCH /rutas/7/paradas/2/entregada': { body: {} },
    });
    expect(await screen.findByRole('heading', { name: SIGUIENTE })).toBeInTheDocument();
    expect(fetchFalso.mock.calls.filter((c) => c[1]?.method === 'PATCH')).toHaveLength(2);
    expect(localStorage.getItem('eco_entregas_pendientes')).toBe('[]');
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

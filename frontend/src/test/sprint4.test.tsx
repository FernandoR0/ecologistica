import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { api, apiPaginado, SERVICIO_NO_DISPONIBLE, SIN_CONEXION } from '../api';
import { Administracion } from '../pages/Administracion';
import { Encuesta } from '../pages/Encuesta';
import { renderConSesion } from './utils';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  sessionStorage.clear();
});

const PREGUNTAS = Array.from({ length: 10 }, (_, i) => `Pregunta ${i + 1}`);

describe('Encuesta SUS (ENB-007)', () => {
  it('envía las 10 respuestas, las tareas y el perfil', async () => {
    const { fetchFalso } = renderConSesion(<Encuesta />, 'PLANIFICADOR', {
      '/sus/preguntas': { body: { preguntas: PREGUNTAS } },
      'POST /sus': { status: 201, body: { puntaje: 80 } },
    });
    await screen.findByText('1. Pregunta 1');
    await userEvent.click(screen.getByLabelText(/T1\./));
    await userEvent.click(screen.getByLabelText(/T4\./));
    await userEvent.type(screen.getByLabelText('Código de participante (P1, P2…)'), 'p1');
    await userEvent.type(screen.getByLabelText(/Perfil/), 'Estudiante de ingeniería');
    const valores = [4, 2, 4, 1, 4, 2, 5, 2, 4, 2];
    for (const [i, v] of valores.entries()) {
      const grupo = screen.getByRole('group', { name: `${i + 1}. Pregunta ${i + 1}` });
      await userEvent.click(grupo.querySelector(`input[value="${v}"]`)!);
    }
    await userEvent.click(screen.getByRole('button', { name: 'Enviar respuestas' }));
    expect(await screen.findByRole('status')).toHaveTextContent('puntaje SUS 80');
    const cuerpo = JSON.parse(String(fetchFalso.mock.calls.find((c) => c[1]?.method === 'POST')?.[1]?.body));
    expect(cuerpo).toEqual({
      codigo_participante: 'P1', perfil: 'Estudiante de ingeniería', respuestas: valores, tareas_completadas: 2, comentario: null,
    });
  });

  it('señala la pregunta faltante y los errores de la API', async () => {
    renderConSesion(<Encuesta />, 'PLANIFICADOR', {
      '/sus/preguntas': { body: { preguntas: PREGUNTAS } },
      'POST /sus': { status: 409, body: { detail: 'Ese código de participante ya respondió la encuesta' } },
    });
    await screen.findByText('1. Pregunta 1');
    await userEvent.type(screen.getByLabelText('Código de participante (P1, P2…)'), 'P1');
    await userEvent.type(screen.getByLabelText(/Perfil/), 'Docente');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar respuestas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Falta responder la pregunta 1.');
    for (let i = 0; i < 10; i += 1) {
      const grupo = screen.getByRole('group', { name: `${i + 1}. Pregunta ${i + 1}` });
      await userEvent.click(grupo.querySelector('input[value="3"]')!);
    }
    await userEvent.type(screen.getByLabelText('Comentario (opcional)'), 'Bien');
    await userEvent.click(screen.getByRole('button', { name: 'Enviar respuestas' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('ya respondió');
  });
});

describe('Administración para el auditor', () => {
  it('solo consulta usuarios, exporta la auditoría y ve los resultados SUS', async () => {
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:csv', revokeObjectURL: vi.fn() });
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const { fetchFalso } = renderConSesion(<Administracion />, 'AUDITOR', {
      '/auth/usuarios': { body: [{ id: 1, correo: 'admin@ecologistica.pe', nombre: 'Administrador', rol: 'ADMIN', activo: true }] },
      '/auditoria/exportar.csv': { body: {} },
      '/auditoria': { body: [], headers: { 'X-Total-Count': '0' } },
      '/sus/resultados': { body: {
        n: 1, promedio: 80, grado: 'A-', adjetivo: 'Bueno', aprobado: true,
        respuestas: [{ id: 1, codigo_participante: 'P1', perfil: 'Estudiante', respuestas: [4, 2, 4, 1, 4, 2, 5, 2, 4, 2], puntaje: 80 }],
      } },
    });
    expect(await screen.findByText('admin@ecologistica.pe')).toBeInTheDocument();
    expect(screen.getByText('Acceso de auditor: solo consulta y exportación.')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Crear usuario' })).not.toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Parámetros del motor' })).not.toBeInTheDocument();
    expect(await screen.findByText(/grado A- \(Bueno\)/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));
    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(fetchFalso.mock.calls.some((c) => String(c[0]).includes('/auditoria/exportar.csv'))).toBe(true);
  });
});

describe('Resiliencia del cliente HTTP', () => {
  it('traduce una caída de red a un mensaje comprensible', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(api('/vehiculos')).rejects.toThrow(SIN_CONEXION);
    await expect(apiPaginado('/pedidos', 1)).rejects.toThrow(SIN_CONEXION);
  });

  it('explica el 503 del servidor y deja pasar la cancelación intencional', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 503 })));
    await expect(api('/vehiculos')).rejects.toThrow(`${SERVICIO_NO_DISPONIBLE} (Error 503)`);
    const abort = Object.assign(new Error('abortado'), { name: 'AbortError' });
    vi.stubGlobal('fetch', vi.fn(async () => { throw abort; }));
    await expect(api('/vehiculos')).rejects.toBe(abort);
  });
});

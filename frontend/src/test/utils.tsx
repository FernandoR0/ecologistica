import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { API_URL, type Rol } from '../api';
import { AuthProvider } from '../auth';

export interface RespuestaFalsa {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
}
type Manejador = RespuestaFalsa | ((init?: RequestInit, url?: string) => RespuestaFalsa);

/**
 * Reemplaza fetch por respuestas fijas. Las claves son "METODO /ruta" (GET por defecto)
 * y se comparan por prefijo, empezando por la ruta más larga.
 */
export function simularApi(rutas: Record<string, Manejador>) {
  const claves = Object.keys(rutas)
    .map((k) => {
      const [metodo, ruta] = k.includes(' ') ? k.split(' ') : ['GET', k];
      return { k, metodo, ruta };
    })
    .sort((a, b) => b.ruta.length - a.ruta.length);

  const fetchFalso = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada).replace(API_URL, '');
    const metodo = init?.method ?? 'GET';
    const c = claves.find((x) => x.metodo === metodo && url.startsWith(x.ruta));
    const m = c ? rutas[c.k] : { status: 404, body: { detail: `Sin respuesta simulada para ${metodo} ${url}` } };
    const r = typeof m === 'function' ? m(init, url) : m;
    const status = r.status ?? 200;
    return new Response(status === 204 ? null : JSON.stringify(r.body ?? {}), {
      status,
      headers: { 'Content-Type': 'application/json', ...(r.headers ?? {}) },
    });
  });
  vi.stubGlobal('fetch', fetchFalso);
  return fetchFalso;
}

export const USUARIOS: Record<Rol, { id: number; correo: string; nombre: string; rol: Rol }> = {
  ADMIN: { id: 1, correo: 'admin@ecologistica.pe', nombre: 'Administrador', rol: 'ADMIN' },
  PLANIFICADOR: { id: 2, correo: 'plan@ecologistica.pe', nombre: 'Rosa', rol: 'PLANIFICADOR' },
  CONDUCTOR: { id: 3, correo: 'cond@ecologistica.pe', nombre: 'Luis', rol: 'CONDUCTOR' },
};

/** Renderiza con sesión iniciada (token en sessionStorage y /auth/me simulado). */
export function renderConSesion(ui: ReactNode, rol: Rol, rutas: Record<string, Manejador> = {}, ruta = '/') {
  sessionStorage.setItem('eco_token', 'token-de-prueba');
  const fetchFalso = simularApi({ '/auth/me': { body: USUARIOS[rol] }, ...rutas });
  const resultado = render(
    <AuthProvider>
      <MemoryRouter initialEntries={[ruta]}>{ui}</MemoryRouter>
    </AuthProvider>,
  );
  return { ...resultado, fetchFalso };
}

export const VEHICULO = {
  id: 1, placa: 'ABC-101', tipo: 'Furgón', capacidad_kg: 1500, combustible: 'DIESEL', consumo_100km: 11, activo: true,
};

export const RUTA = {
  id: 7, fecha: '2026-11-16', vehiculo: VEHICULO, conductor: { id: 1, nombre: 'Luis Quispe' },
  hora_inicio: '08:00', hora_fin: '10:30', distancia_km: 12.5, duracion_min: 150, co2_kg: 3.68,
  distancia_base_km: 20.1, co2_base_kg: 5.9, estado: 'PLANIFICADA', ruta_origen_id: null,
  paradas: [
    { id: 1, orden: 1, hora_llegada: '08:20', estado: 'PENDIENTE',
      pedido: { id: 11, codigo: 'PED-0011', cliente: 'Bodega Doña Rosa', lat: -12.06, lng: -75.21, peso_kg: 80 } },
    { id: 2, orden: 2, hora_llegada: '09:05', estado: 'PENDIENTE',
      pedido: { id: 12, codigo: 'PED-0012', cliente: 'Minimarket El Sol', lat: -12.07, lng: -75.2, peso_kg: 120 } },
  ],
};

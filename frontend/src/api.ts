/** Cliente HTTP mínimo para la API de EcoLogística. */

// En producción la web y la API comparten dominio: Vercel reenvía /api a Render (frontend/vercel.json)
export const API_URL: string = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '/api' : 'http://localhost:8000/api');
const CLAVE_TOKEN = 'eco_token';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export const tokenStore = {
  get: (): string | null => sessionStorage.getItem(CLAVE_TOKEN),
  set: (t: string) => sessionStorage.setItem(CLAVE_TOKEN, t),
  clear: () => sessionStorage.removeItem(CLAVE_TOKEN),
};

/** Convierte el `detail` de FastAPI (texto o lista de errores de validación) en un mensaje legible. */
export function mensajeError(detail: unknown, status: number): string {
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d: { loc?: unknown[]; msg?: string }) => `${(d.loc ?? []).slice(1).join('.')}: ${d.msg ?? ''}`)
      .join(' · ');
  }
  return `Error ${status}`;
}

export const SIN_CONEXION = 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.';
export const SERVICIO_NO_DISPONIBLE = 'El servicio no está disponible en este momento. Inténtalo nuevamente en unos segundos.';

/** `fetch` con mensajes comprensibles ante caídas de red o del servidor (resiliencia). */
async function solicitar(url: string, opciones: RequestInit = {}): Promise<Response> {
  let resp: Response;
  try {
    resp = await fetch(url, opciones);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ApiError(0, SIN_CONEXION);
  }
  if ([502, 503, 504].includes(resp.status)) throw new ApiError(resp.status, `${SERVICIO_NO_DISPONIBLE} (Error ${resp.status})`);
  return resp;
}

export async function api<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const resp = await solicitar(`${API_URL}${ruta}`, {
    ...opciones,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opciones.headers,
    },
  });
  if (resp.status === 401 && ruta !== '/auth/login') {
    tokenStore.clear();
    window.location.assign('/login');
  }
  if (!resp.ok) {
    const cuerpo = await resp.json().catch(() => ({}));
    throw new ApiError(resp.status, mensajeError(cuerpo.detail, resp.status));
  }
  return resp.status === 204 ? (undefined as T) : resp.json();
}

/** GET paginado: devuelve la página pedida y el total (cabecera X-Total-Count). */
export async function apiPaginado<T>(ruta: string, pagina: number, limite = 12): Promise<{ datos: T[]; total: number }> {
  const token = tokenStore.get();
  const sep = ruta.includes('?') ? '&' : '?';
  const resp = await solicitar(`${API_URL}${ruta}${sep}pagina=${pagina}&limite=${limite}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!resp.ok) {
    const cuerpo = await resp.json().catch(() => ({}));
    throw new ApiError(resp.status, mensajeError(cuerpo.detail, resp.status));
  }
  const datos: T[] = await resp.json();
  return { datos, total: Number(resp.headers.get('X-Total-Count') ?? datos.length) };
}

/** Descarga un archivo (por ejemplo el reporte PDF) enviando el token. */
export async function descargar(ruta: string, nombre: string): Promise<void> {
  const token = tokenStore.get();
  const resp = await solicitar(`${API_URL}${ruta}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!resp.ok) throw new ApiError(resp.status, `No se pudo descargar (${resp.status})`);
  const url = URL.createObjectURL(await resp.blob());
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}

export const post = <T>(ruta: string, body: unknown) => api<T>(ruta, { method: 'POST', body: JSON.stringify(body) });
export const put = <T>(ruta: string, body: unknown) => api<T>(ruta, { method: 'PUT', body: JSON.stringify(body) });
export const del = (ruta: string) => api<void>(ruta, { method: 'DELETE' });

// ---------- Tipos ----------
export type Rol = 'ADMIN' | 'PLANIFICADOR' | 'CONDUCTOR' | 'AUDITOR';
export interface Usuario { id: number; correo: string; nombre: string; rol: Rol }
export interface Vehiculo {
  id: number; placa: string; tipo: string; capacidad_kg: number; volumen_m3: number; combustible: string;
  rendimiento: number; factor_emision_kg_km: number; anio_fabricacion: number; restringido_centro: boolean; activo: boolean;
}
export interface Cliente {
  id: number; nombre: string; telefono?: string | null; direccion: string; distrito: string; punto_referencia?: string | null;
  restricciones_acceso?: string | null; hora_desde: string; hora_hasta: string; dias_atencion: string; lat: number; lng: number;
}
export interface Pedido {
  id: number; codigo: string; cliente_id: number; cliente_nombre: string; direccion: string; punto_referencia?: string | null;
  lat: number; lng: number; peso_kg: number; volumen_m3: number; ventana_inicio: string; ventana_fin: string;
  prioridad: string; tipo_producto: string; estado: string;
}
/** Datos del pedido que la API manda dentro de cada parada (mapa, lista y modo conductor). */
export type PedidoParada = Pick<
  Pedido, 'id' | 'codigo' | 'cliente_nombre' | 'direccion' | 'punto_referencia' | 'lat' | 'lng' | 'peso_kg' | 'ventana_inicio' | 'ventana_fin'
>;
export type Congestion = 'VERDE' | 'AMARILLO' | 'ROJO';
export interface Parada {
  id: number; orden: number; hora_llegada: string; distancia_tramo_km: number; tiempo_tramo_min: number;
  congestion: Congestion; fuera_ventana: boolean; estado: string; pedido: PedidoParada;
}
export interface Ruta {
  id: number; fecha: string; vehiculo: Vehiculo; conductor: { id: number; nombre: string } | null;
  hora_inicio: string; hora_fin: string; distancia_km: number; duracion_min: number; descanso_min: number; co2_kg: number;
  distancia_base_km: number; co2_base_kg: number; estado: string; ruta_origen_id: number | null; paradas: Parada[];
  partida_lat?: number | null; partida_lng?: number | null;
}
export interface Zona { id: number; nombre: string; tipo: 'RESTRINGIDA' | 'RIESGO' | 'SENSIBLE' | 'DISTRITO'; poligono: [number, number][] }
export interface ResultadoPlan {
  estado: string; rutas: Ruta[]; no_asignados: number[]; distancia_total_km: number; co2_total_kg: number;
  ahorro_km: number; ahorro_co2_kg: number; tiempo_calculo_ms: number;
}

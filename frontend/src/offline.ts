/**
 * RNF-006 · Respaldo local del modo conductor ante cortes de luz o de señal.
 * La última ruta descargada y las entregas marcadas sin conexión se guardan en el celular (localStorage)
 * y las entregas se envían a la API en cuanto vuelve la conexión.
 */
import type { Ruta } from './api';

const CLAVE_RUTA = 'eco_mi_ruta';
const CLAVE_PENDIENTES = 'eco_entregas_pendientes';

export interface RutaGuardada { rutas: Ruta[]; guardadaEn: string }
export interface EntregaPendiente { rutaId: number; paradaId: number }

const leer = <T>(clave: string, porDefecto: T): T => {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
};
const escribir = (clave: string, valor: unknown) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch {
    // Sin espacio o almacenamiento bloqueado: la app sigue funcionando en línea
  }
};

export const respaldo = {
  guardarRuta: (rutas: Ruta[], ahora = new Date()) => escribir(CLAVE_RUTA, { rutas, guardadaEn: ahora.toISOString() }),
  leerRuta: (): RutaGuardada | null => leer<RutaGuardada | null>(CLAVE_RUTA, null),
  pendientes: (): EntregaPendiente[] => leer<EntregaPendiente[]>(CLAVE_PENDIENTES, []),
  agregarPendiente: (e: EntregaPendiente) => {
    const lista = respaldo.pendientes().filter((p) => p.paradaId !== e.paradaId);
    escribir(CLAVE_PENDIENTES, [...lista, e]);
  },
  quitarPendiente: (paradaId: number) =>
    escribir(CLAVE_PENDIENTES, respaldo.pendientes().filter((p) => p.paradaId !== paradaId)),
  limpiar: () => {
    try {
      localStorage.removeItem(CLAVE_RUTA);
      localStorage.removeItem(CLAVE_PENDIENTES);
    } catch {
      // nada que limpiar
    }
  },
};

/** Marca la parada como entregada en una copia de las rutas (para mostrarla así mientras no hay señal). */
export function marcarLocal(rutas: Ruta[], paradaId: number): Ruta[] {
  return rutas.map((r) => ({
    ...r,
    paradas: r.paradas.map((p) => (p.id === paradaId ? { ...p, estado: 'ENTREGADA' } : p)),
  }));
}

/** Enlace para abrir la navegación paso a paso en Google Maps (o la app de mapas del celular). */
export const enlaceComoLlegar = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

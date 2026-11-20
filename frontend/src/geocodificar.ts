/**
 * Búsqueda de direcciones y lugares de Huancayo con Nominatim (OpenStreetMap), el mismo proveedor del mapa.
 * Política de uso de Nominatim: como máximo 1 búsqueda por segundo y sin autocompletar mientras se escribe;
 * por eso se busca solo al pulsar "Buscar" o Enter.
 */
export interface LugarEncontrado {
  nombre: string;
  lat: number;
  lng: number;
  /** Calle y número, para proponer la dirección del registro. */
  direccion: string;
  /** Distrito, barrio y ciudad que devuelve OpenStreetMap, para proponer el distrito. */
  zonas: string[];
}

const URL_NOMINATIM = 'https://nominatim.openstreetmap.org/search';
// Huancayo, El Tambo y Chilca
const VIEWBOX = '-75.32,-11.98,-75.12,-12.14';
const ESPERA_MIN_MS = 1000;
let ultimaBusqueda = 0;

interface RespuestaNominatim {
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: Record<string, string>;
}

export async function buscarLugar(texto: string): Promise<LugarEncontrado[]> {
  const espera = ultimaBusqueda + ESPERA_MIN_MS - Date.now();
  if (espera > 0) await new Promise((ok) => setTimeout(ok, espera));
  ultimaBusqueda = Date.now();
  const params = new URLSearchParams({
    q: texto, format: 'jsonv2', addressdetails: '1', limit: '5', countrycodes: 'pe', viewbox: VIEWBOX, bounded: '1',
    'accept-language': 'es',
  });
  let resp: Response;
  try {
    resp = await fetch(`${URL_NOMINATIM}?${params}`, { referrerPolicy: 'strict-origin-when-cross-origin' });
  } catch {
    throw new Error('No se pudo buscar la dirección. Revisa tu conexión o marca el lugar tocando el mapa.');
  }
  if (!resp.ok) throw new Error('El buscador de direcciones no responde ahora. Marca el lugar tocando el mapa.');
  const datos = (await resp.json()) as RespuestaNominatim[];
  return datos.map((d) => {
    const a = d.address ?? {};
    const calle = [a.road ?? a.pedestrian ?? a.footway, a.house_number].filter(Boolean).join(' ');
    return {
      nombre: d.display_name,
      lat: Number(Number(d.lat).toFixed(6)),
      lng: Number(Number(d.lon).toFixed(6)),
      direccion: calle || d.name || d.display_name.split(',')[0],
      zonas: [a.city_district, a.suburb, a.town, a.city, a.municipality, a.county].filter(Boolean) as string[],
    };
  });
}

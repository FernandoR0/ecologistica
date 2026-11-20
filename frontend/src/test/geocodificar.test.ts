import { afterEach, describe, expect, it, vi } from 'vitest';
import { buscarLugar } from '../geocodificar';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const respuesta = (cuerpo: unknown, status = 200) =>
  new Response(JSON.stringify(cuerpo), { status, headers: { 'Content-Type': 'application/json' } });

describe('buscarLugar (Nominatim / OpenStreetMap)', () => {
  it('busca en Huancayo y devuelve coordenadas, dirección y zonas', async () => {
    const f = vi.fn(async () => respuesta([{
      display_name: 'Jirón Real 500, Huancayo, Junín, Perú', lat: '-12.06821234', lon: '-75.21051234',
      address: { road: 'Jirón Real', house_number: '500', city_district: 'Huancayo', city: 'Huancayo', state: 'Junín' },
    }, {
      display_name: 'Parque Huamanmarca, Huancayo', lat: '-12.069', lon: '-75.207', name: 'Parque Huamanmarca',
      address: { suburb: 'El Tambo' },
    }]));
    vi.stubGlobal('fetch', f);
    const lugares = await buscarLugar('Jr. Real 500');
    const url = new URL(String((f.mock.calls[0] as unknown[])[0]));
    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/search');
    expect(url.searchParams.get('q')).toBe('Jr. Real 500');
    expect(url.searchParams.get('countrycodes')).toBe('pe');
    expect(url.searchParams.get('bounded')).toBe('1');
    expect(lugares[0]).toEqual({
      nombre: 'Jirón Real 500, Huancayo, Junín, Perú', lat: -12.068212, lng: -75.210512, direccion: 'Jirón Real 500',
      zonas: ['Huancayo', 'Huancayo'],
    });
    // Un lugar de referencia sin calle usa su nombre como dirección
    expect(lugares[1]).toMatchObject({ direccion: 'Parque Huamanmarca', zonas: ['El Tambo'] });
  });

  it('espera al menos 1 segundo entre búsquedas (política de uso de Nominatim)', async () => {
    vi.useFakeTimers();
    const f = vi.fn(async () => respuesta([]));
    vi.stubGlobal('fetch', f);
    await vi.advanceTimersByTimeAsync(1500);
    await buscarLugar('primera');
    const segunda = buscarLugar('segunda');
    await vi.advanceTimersByTimeAsync(500);
    expect(f).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(600);
    await segunda;
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('explica los errores de red y de servicio', async () => {
    // Con reloj real: entre las dos búsquedas se respeta la espera de 1 s
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    await expect(buscarLugar('Jr. Real')).rejects.toThrow('No se pudo buscar la dirección');
    vi.stubGlobal('fetch', vi.fn(async () => respuesta({}, 503)));
    await expect(buscarLugar('Jr. Real')).rejects.toThrow('El buscador de direcciones no responde ahora');
  });
});

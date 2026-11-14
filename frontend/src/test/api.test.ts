import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { api, apiPaginado, ApiError, del, post, put, tokenStore } from '../api';
import { simularApi } from './utils';

describe('cliente de la API', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => vi.unstubAllGlobals());

  it('envía el token en la cabecera Authorization', async () => {
    tokenStore.set('abc');
    const f = simularApi({ '/vehiculos': { body: [] } });
    await api('/vehiculos');
    const headers = f.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBe('Bearer abc');
  });

  it('no envía Authorization si no hay sesión', async () => {
    const f = simularApi({ '/health': { body: { status: 'ok' } } });
    await api('/health');
    const headers = f.mock.calls[0][1]?.headers as Record<string, string>;
    expect(headers.Authorization).toBeUndefined();
  });

  it('post, put y del usan el método correcto y devuelven el cuerpo', async () => {
    const f = simularApi({
      'POST /pedidos': { status: 201, body: { id: 1 } },
      'PUT /pedidos/1': { body: { id: 1, peso_kg: 9 } },
      'DELETE /pedidos/1': { status: 204 },
    });
    expect(await post('/pedidos', { a: 1 })).toEqual({ id: 1 });
    expect(await put('/pedidos/1', { peso_kg: 9 })).toEqual({ id: 1, peso_kg: 9 });
    expect(await del('/pedidos/1')).toBeUndefined();
    expect(f.mock.calls.map((c) => c[1]?.method)).toEqual(['POST', 'PUT', 'DELETE']);
    expect(f.mock.calls[0][1]?.body).toBe('{"a":1}');
  });

  it('convierte los errores en ApiError con el mensaje de la API', async () => {
    simularApi({ 'POST /rutas/optimizar': { status: 409, body: { detail: 'No hay pedidos pendientes' } } });
    const error = (await post('/rutas/optimizar', {}).catch((e) => e)) as ApiError;
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(409);
    expect(error.message).toBe('No hay pedidos pendientes');
  });

  it('con 401 borra la sesión y manda al login', async () => {
    tokenStore.set('vencido');
    const asignar = vi.fn();
    vi.stubGlobal('location', { ...window.location, assign: asignar });
    simularApi({ '/vehiculos': { status: 401, body: { detail: 'No autenticado' } } });
    await expect(api('/vehiculos')).rejects.toThrow('No autenticado');
    expect(tokenStore.get()).toBeNull();
    expect(asignar).toHaveBeenCalledWith('/login');
  });

  it('apiPaginado arma la URL y lee X-Total-Count', async () => {
    tokenStore.set('abc');
    const f = simularApi({ '/pedidos': { body: [{ id: 1 }], headers: { 'X-Total-Count': '25' } } });
    const r = await apiPaginado('/pedidos?estado=PENDIENTE', 2, 12);
    expect(r).toEqual({ datos: [{ id: 1 }], total: 25 });
    expect(String(f.mock.calls[0][0])).toContain('/pedidos?estado=PENDIENTE&pagina=2&limite=12');
  });

  it('apiPaginado usa la cantidad recibida si no hay cabecera y propaga errores', async () => {
    simularApi({ '/a': { body: [{ id: 1 }, { id: 2 }] }, '/b': { status: 500, body: {} } });
    expect((await apiPaginado('/a', 1)).total).toBe(2);
    await expect(apiPaginado('/b', 1)).rejects.toThrow('Error 500');
  });
});

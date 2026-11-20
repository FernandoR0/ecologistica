import { afterEach, describe, expect, it, vi } from 'vitest';
import { reducirFoto } from '../foto';

/** jsdom no decodifica imágenes ni dibuja en canvas: se simulan el tamaño de la foto y la compresión. */
function simularImagen(ancho: number, alto: number, falla = false) {
  class ImagenFalsa {
    width = ancho;
    height = alto;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_v: string) {
      queueMicrotask(() => (falla ? this.onerror?.() : this.onload?.()));
    }
  }
  vi.stubGlobal('Image', ImagenFalsa);
  vi.stubGlobal('URL', { ...URL, createObjectURL: vi.fn(() => 'blob:foto'), revokeObjectURL: vi.fn() });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('reducirFoto (foto de confirmación de entrega)', () => {
  it('reduce el lado mayor a 1024 px y baja la calidad hasta quedar por debajo de 350 KB', async () => {
    simularImagen(4000, 3000);
    const dibujar = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: dibujar } as never);
    const calidades: number[] = [];
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (this: HTMLCanvasElement, _t, q) {
      calidades.push(q as number);
      // Las dos primeras calidades todavía pesan demasiado
      return `data:image/jpeg;base64,${'A'.repeat(calidades.length < 3 ? 600_000 : 200_000)}`;
    });
    const datos = await reducirFoto(new File(['x'], 'foto.jpg', { type: 'image/jpeg' }));
    expect(dibujar).toHaveBeenCalledWith(expect.anything(), 0, 0, 1024, 768);
    expect(calidades).toHaveLength(3);
    [0.75, 0.6, 0.45].forEach((q, i) => expect(calidades[i]).toBeCloseTo(q));
    expect(datos.length).toBeLessThan(350 * 1024 * (4 / 3));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:foto');
  });

  it('no agranda una foto pequeña', async () => {
    simularImagen(640, 480);
    const dibujar = vi.fn();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: dibujar } as never);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/jpeg;base64,QUJD');
    expect(await reducirFoto(new File(['x'], 'p.jpg'))).toBe('data:image/jpeg;base64,QUJD');
    expect(dibujar).toHaveBeenCalledWith(expect.anything(), 0, 0, 640, 480);
  });

  it('explica el error si el archivo no es una imagen legible', async () => {
    simularImagen(0, 0, true);
    await expect(reducirFoto(new File(['x'], 'roto.jpg'))).rejects.toThrow('No se pudo leer la foto');
    expect(URL.revokeObjectURL).toHaveBeenCalled();
  });
});

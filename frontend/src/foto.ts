/**
 * Reduce la foto de la cámara antes de enviarla: lado mayor de 1024 px y JPEG comprimido por debajo de 350 KB.
 * Una foto de celular pesa 3-5 MB; reducirla ahorra datos móviles y espacio (Green IT) y cabe en el respaldo local.
 */
const LADO_MAX = 1024;
const MAX_CARACTERES = 350 * 1024 * (4 / 3);

export async function reducirFoto(archivo: File): Promise<string> {
  const url = URL.createObjectURL(archivo);
  try {
    const img = await new Promise<HTMLImageElement>((ok, falla) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => falla(new Error('No se pudo leer la foto. Intenta tomarla de nuevo.'));
      i.src = url;
    });
    const escala = Math.min(1, LADO_MAX / Math.max(img.width, img.height));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.round(img.width * escala);
    lienzo.height = Math.round(img.height * escala);
    lienzo.getContext('2d')!.drawImage(img, 0, 0, lienzo.width, lienzo.height);
    let calidad = 0.75;
    let datos = lienzo.toDataURL('image/jpeg', calidad);
    while (datos.length > MAX_CARACTERES && calidad > 0.3) {
      calidad -= 0.15;
      datos = lienzo.toDataURL('image/jpeg', calidad);
    }
    return datos;
  } finally {
    URL.revokeObjectURL(url);
  }
}

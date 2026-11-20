import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { DEPOSITO } from './MapaRutas';

interface Props {
  lat: unknown;
  lng: unknown;
  onCambiar: (lat: number, lng: number) => void;
  etiqueta?: string;
}

const numero = (v: unknown) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const redondear = (v: number) => Number(v.toFixed(6));

/**
 * RF-009 · El usuario marca la ubicación tocando el mapa o arrastrando el pin; las coordenadas se llenan solas.
 * Corrige el cuello de botella de la encuesta SUS: el formulario pedía escribir latitud y longitud.
 */
export function SelectorUbicacion({ lat, lng, onCambiar, etiqueta = 'Ubicación en el mapa' }: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const pin = useRef<L.Marker | null>(null);
  const aviso = useRef(onCambiar);
  aviso.current = onCambiar;

  const la = numero(lat);
  const ln = numero(lng);
  const marcado = Number.isFinite(la) && Number.isFinite(ln);

  useEffect(() => {
    if (!contenedor.current || mapa.current) return;
    const m = L.map(contenedor.current).setView(DEPOSITO, 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      referrerPolicy: 'strict-origin-when-cross-origin',
    }).addTo(m);
    m.on('click', (e: L.LeafletMouseEvent) => aviso.current(redondear(e.latlng.lat), redondear(e.latlng.lng)));
    mapa.current = m;
    return () => {
      m.remove();
      mapa.current = null;
      pin.current = null;
    };
  }, []);

  useEffect(() => {
    const m = mapa.current;
    if (!m) return;
    if (!marcado) {
      pin.current?.remove();
      pin.current = null;
      return;
    }
    if (!pin.current) {
      pin.current = L.marker([la, ln], {
        draggable: true,
        title: 'Lugar de entrega',
        icon: L.divIcon({ className: 'pin-ubicacion', html: '<span></span>', iconSize: [26, 26], iconAnchor: [13, 26] }),
      })
        .on('dragend', () => {
          const p = pin.current!.getLatLng();
          aviso.current(redondear(p.lat), redondear(p.lng));
        })
        .addTo(m);
      if (!m.getBounds().contains([la, ln])) m.setView([la, ln], 16);
    } else {
      pin.current.setLatLng([la, ln]);
    }
  }, [la, ln, marcado]);

  return (
    <fieldset className="selector-ubicacion">
      <legend>{etiqueta}</legend>
      <p className="muted">
        Mueve y acerca el mapa hasta encontrar el lugar y tócalo para poner el pin. Puedes arrastrar el pin para
        ajustarlo.
      </p>
      <div ref={contenedor} className="mapa mapa-selector" role="region" aria-label="Mapa para marcar la ubicación" />
      <p role="status" className={marcado ? 'ubicacion-ok' : 'muted'}>
        {marcado ? `✔ Ubicación marcada (${la.toFixed(5)}, ${ln.toFixed(5)})` : 'Aún no se ha marcado la ubicación.'}
      </p>
    </fieldset>
  );
}

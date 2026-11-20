import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buscarLugar, type LugarEncontrado } from '../geocodificar';
import { DEPOSITO } from './MapaRutas';

interface Props {
  lat: unknown;
  lng: unknown;
  onCambiar: (lat: number | '', lng: number | '') => void;
  /** Se llama al elegir un resultado del buscador, para proponer la dirección y el distrito. */
  onLugar?: (lugar: LugarEncontrado) => void;
  etiqueta?: string;
  /** Texto del estado cuando no hay ubicación (por ejemplo, "se usará la del cliente"). */
  sinUbicacion?: string;
  opcional?: boolean;
}

const numero = (v: unknown) => (v === '' || v === null || v === undefined ? NaN : Number(v));
const redondear = (v: number) => Number(v.toFixed(6));

/**
 * RF-009 · El usuario busca la dirección o un lugar de referencia, o toca el mapa; el pin se puede arrastrar para
 * ajustarlo y las coordenadas se llenan solas. Corrige los cuellos de botella de la encuesta SUS: el formulario
 * pedía escribir latitud y longitud, y un participante sugirió buscar por dirección o referencia.
 */
export function SelectorUbicacion({
  lat, lng, onCambiar, onLugar, etiqueta = 'Ubicación en el mapa', sinUbicacion = 'Aún no se ha marcado la ubicación.',
  opcional = false,
}: Props) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const pin = useRef<L.Marker | null>(null);
  const aviso = useRef(onCambiar);
  aviso.current = onCambiar;
  const [texto, setTexto] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [resultados, setResultados] = useState<LugarEncontrado[] | null>(null);
  const [errorBusqueda, setErrorBusqueda] = useState('');

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
    } else {
      pin.current.setLatLng([la, ln]);
    }
    if (!m.getBounds().contains([la, ln])) m.setView([la, ln], 17);
  }, [la, ln, marcado]);

  const buscar = async () => {
    if (texto.trim().length < 3) {
      setErrorBusqueda('Escribe al menos 3 letras de la dirección o del lugar.');
      return;
    }
    setBuscando(true);
    setErrorBusqueda('');
    try {
      setResultados(await buscarLugar(texto.trim()));
    } catch (e) {
      setResultados(null);
      setErrorBusqueda((e as Error).message);
    } finally {
      setBuscando(false);
    }
  };

  const elegir = (r: LugarEncontrado) => {
    aviso.current(r.lat, r.lng);
    mapa.current?.setView([r.lat, r.lng], 17);
    onLugar?.(r);
    setResultados(null);
  };

  // Enter busca en lugar de enviar el formulario completo
  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      void buscar();
    }
  };

  return (
    <fieldset className="selector-ubicacion">
      <legend>{etiqueta}</legend>
      <div className="buscador-lugar" role="search">
        <label className="buscador-campo">
          Buscar dirección o lugar de referencia
          <input
            type="search" value={texto} placeholder="Ej.: Jr. Real 500 o Parque Huamanmarca"
            onChange={(e) => setTexto(e.target.value)} onKeyDown={alTeclear}
          />
        </label>
        <button type="button" onClick={() => void buscar()} disabled={buscando}>
          {buscando ? 'Buscando…' : '🔍 Buscar'}
        </button>
      </div>
      {errorBusqueda && <p className="error" role="alert">{errorBusqueda}</p>}
      {resultados && resultados.length === 0 && (
        <p className="aviso" role="status">
          No encontramos ese lugar en Huancayo. Prueba con la calle y el número o un lugar conocido, o toca el mapa.
        </p>
      )}
      {resultados && resultados.length > 0 && (
        <ul className="resultados-lugar" aria-label="Resultados de la búsqueda">
          {resultados.map((r) => (
            <li key={`${r.lat},${r.lng}`}>
              <button type="button" className="secundario" onClick={() => elegir(r)}>📍 {r.nombre}</button>
            </li>
          ))}
        </ul>
      )}
      <p className="muted">
        Si no aparece (por ejemplo, "Mz. C Lote 5"), mueve el mapa y tócalo en el lugar. Puedes arrastrar el pin para
        ajustarlo.
      </p>
      <div ref={contenedor} className="mapa mapa-selector" role="region" aria-label="Mapa para marcar la ubicación" />
      <p role="status" className={marcado ? 'ubicacion-ok' : 'muted'}>
        {marcado ? `✔ Ubicación marcada (${la.toFixed(5)}, ${ln.toFixed(5)})` : sinUbicacion}
        {marcado && opcional && (
          <>
            {' '}
            <button type="button" className="secundario" onClick={() => aviso.current('', '')}>Quitar ubicación</button>
          </>
        )}
      </p>
    </fieldset>
  );
}

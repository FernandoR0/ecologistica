import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Congestion, Ruta, Zona } from '../api';

const COLORES = ['#0f766e', '#b45309', '#7c3aed', '#be123c', '#1d4ed8', '#4d7c0f'];
export const COLOR_CONGESTION: Record<Congestion, string> = { VERDE: '#15803d', AMARILLO: '#ca8a04', ROJO: '#dc2626' };
const ESTILO_ZONA: Record<Zona['tipo'], L.PathOptions> = {
  DISTRITO: { color: '#475569', weight: 1.5, dashArray: '6 4', fillOpacity: 0 },
  RESTRINGIDA: { color: '#c2410c', weight: 2, fillColor: '#fb923c', fillOpacity: 0.15 },
  RIESGO: { color: '#b91c1c', weight: 2, fillColor: '#ef4444', fillOpacity: 0.15 },
  SENSIBLE: { color: '#7c3aed', weight: 2, fillColor: '#a78bfa', fillOpacity: 0.12 },
};
export const DEPOSITO: [number, number] = [-12.0651, -75.2049];

const Muestra = ({ color }: { color: string }) => (
  <span aria-hidden="true" className="muestra" style={{ background: color }} />
);

/** RF-004 · Depósito, rutas con tramos coloreados por congestión, paradas numeradas, distritos y zonas. */
export function MapaRutas({ rutas, zonas = [] }: { rutas: Ruta[]; zonas?: Zona[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const capaZonas = useRef<L.LayerGroup | null>(null);
  const [sinMapaBase, setSinMapaBase] = useState(false);

  useEffect(() => {
    if (!contenedor.current || mapa.current) return;
    mapa.current = L.map(contenedor.current).setView(DEPOSITO, 13);
    // Política de uso de OSM: los mosaicos deben pedirse con el Referer del sitio. Algunos proxys
    // (por ejemplo, GitHub Codespaces) envían "same-origin" y OSM bloquea las solicitudes sin Referer.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
      referrerPolicy: 'strict-origin-when-cross-origin',
    })
      .on('tileerror', () => setSinMapaBase(true))
      .addTo(mapa.current);
    capaZonas.current = L.layerGroup().addTo(mapa.current);
    capa.current = L.layerGroup().addTo(mapa.current);
    return () => {
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

  useEffect(() => {
    const grupo = capaZonas.current;
    if (!grupo) return;
    grupo.clearLayers();
    zonas.forEach((z) => L.polygon(z.poligono, ESTILO_ZONA[z.tipo]).bindTooltip(z.nombre).addTo(grupo));
  }, [zonas]);

  useEffect(() => {
    const grupo = capa.current;
    if (!grupo || !mapa.current) return;
    grupo.clearLayers();
    L.circleMarker(DEPOSITO, { radius: 9, color: '#111827', fillOpacity: 1 })
      .bindTooltip('Depósito DistriRápido')
      .addTo(grupo);
    const limites = L.latLngBounds([DEPOSITO]);
    rutas.forEach((r, i) => {
      const color = COLORES[i % COLORES.length];
      // La ruta sale de su punto de partida (casa del conductor o última entrega) y vuelve al depósito
      const partida: [number, number] = r.partida_lat != null && r.partida_lng != null ? [r.partida_lat, r.partida_lng] : DEPOSITO;
      const puntos: [number, number][] = [partida, ...r.paradas.map((p) => [p.pedido.lat, p.pedido.lng] as [number, number]), DEPOSITO];
      // Borde con el color de la ruta y tramo interior con el color de su congestión
      L.polyline(puntos, { color, weight: 9, opacity: 0.35 }).bindTooltip(`${r.vehiculo.placa}`).addTo(grupo);
      r.paradas.forEach((p, k) => {
        L.polyline([puntos[k], puntos[k + 1]], { color: COLOR_CONGESTION[p.congestion], weight: 4, opacity: 0.95 })
          .bindTooltip(
            `Tramo a la parada ${p.orden}: ${p.distancia_tramo_km.toFixed(2)} km · ${p.tiempo_tramo_min} min · congestión ${p.congestion.toLowerCase()}`,
          )
          .addTo(grupo);
        limites.extend([p.pedido.lat, p.pedido.lng]);
        L.marker([p.pedido.lat, p.pedido.lng], {
          icon: L.divIcon({ className: 'pin', html: `<span style="background:${color}">${p.orden}</span>` }),
          title: `Parada ${p.orden}: ${p.pedido.cliente_nombre}`,
        })
          .bindPopup(
            `<b>${p.pedido.cliente_nombre}</b><br>${p.pedido.codigo} · ${p.pedido.peso_kg} kg<br>` +
              `Llegada ${p.hora_llegada} (ventana ${p.pedido.ventana_inicio}-${p.pedido.ventana_fin})` +
              (p.fuera_ventana ? '<br><b>Llega fuera de la ventana</b>' : ''),
          )
          .addTo(grupo);
      });
    });
    if (rutas.length) mapa.current.fitBounds(limites, { padding: [30, 30] });
  }, [rutas]);

  return (
    <div>
      {sinMapaBase && <p className="aviso" role="status">No se pudo cargar el mapa base. Las rutas y paradas siguen disponibles.</p>}
      <div ref={contenedor} className="mapa" role="region" aria-label="Mapa de rutas" />
      <p className="leyenda" aria-label="Leyenda del mapa">
        Congestión del tramo: <Muestra color={COLOR_CONGESTION.VERDE} /> fluida{' '}
        <Muestra color={COLOR_CONGESTION.AMARILLO} /> moderada <Muestra color={COLOR_CONGESTION.ROJO} /> alta (hora punta)
        · Zonas: <Muestra color="#c2410c" /> acceso restringido <Muestra color="#b91c1c" /> riesgo{' '}
        <Muestra color="#475569" /> límite distrital
      </p>
    </div>
  );
}

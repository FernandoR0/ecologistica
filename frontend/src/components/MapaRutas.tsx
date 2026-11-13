import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Ruta } from '../api';

const COLORES = ['#0f766e', '#b45309', '#7c3aed', '#be123c', '#1d4ed8', '#4d7c0f'];
export const DEPOSITO: [number, number] = [-12.0651, -75.2049];

/** RF-004 · Muestra el depósito y cada ruta con sus paradas numeradas (OpenStreetMap). */
export function MapaRutas({ rutas }: { rutas: Ruta[] }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!contenedor.current || mapa.current) return;
    mapa.current = L.map(contenedor.current).setView(DEPOSITO, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(mapa.current);
    capa.current = L.layerGroup().addTo(mapa.current);
    return () => {
      mapa.current?.remove();
      mapa.current = null;
    };
  }, []);

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
      const puntos: [number, number][] = [DEPOSITO, ...r.paradas.map((p) => [p.pedido.lat, p.pedido.lng] as [number, number]), DEPOSITO];
      L.polyline(puntos, { color, weight: 4, opacity: 0.8 }).bindTooltip(`${r.vehiculo.placa}`).addTo(grupo);
      r.paradas.forEach((p) => {
        limites.extend([p.pedido.lat, p.pedido.lng]);
        L.marker([p.pedido.lat, p.pedido.lng], {
          icon: L.divIcon({ className: 'pin', html: `<span style="background:${color}">${p.orden}</span>` }),
        })
          .bindPopup(`<b>${p.pedido.cliente}</b><br>${p.pedido.codigo} · ${p.pedido.peso_kg} kg<br>Llegada ${p.hora_llegada}`)
          .addTo(grupo);
      });
    });
    if (rutas.length) mapa.current.fitBounds(limites, { padding: [30, 30] });
  }, [rutas]);

  return <div ref={contenedor} className="mapa" role="region" aria-label="Mapa de rutas" />;
}

/** RF-003 generar rutas · RF-004 mapa · RF-007 re-optimizar ante incidentes. */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, post, type ResultadoPlan, type Ruta, type Zona } from '../api';
import { useAuth } from '../auth';
import { MapaRutas } from '../components/MapaRutas';

const TIPOS = {
  TRAFICO: 'Tráfico',
  ACCIDENTE: 'Accidente de tránsito',
  BLOQUEO_VIA: 'Bloqueo de vía',
  CLIMA: 'Lluvia / clima',
  AVERIA_VEHICULO: 'Avería del vehículo',
  PEDIDO_NUEVO: 'Pedido nuevo',
  CANCELACION: 'Cancelación de pedido',
};
const CON_PEDIDO = ['PEDIDO_NUEVO', 'CANCELACION'];
const CONGESTION = { VERDE: 'fluida', AMARILLO: 'moderada', ROJO: 'alta' };

export function Rutas() {
  const { usuario } = useAuth();
  const gestiona = usuario?.rol === 'ADMIN' || usuario?.rol === 'PLANIFICADOR';
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [zonas, setZonas] = useState<Zona[]>([]);
  const [resultado, setResultado] = useState<ResultadoPlan | null>(null);
  const [calculando, setCalculando] = useState(false);
  const [error, setError] = useState('');
  const [incidente, setIncidente] = useState({
    ruta: 0, tipo: 'TRAFICO', hora_actual: '10:00', demora_min: 30, completados: '', pedido: '', descripcion: '',
  });

  const cargar = useCallback(() => {
    api<Ruta[]>('/rutas?estado=PLANIFICADA,EN_CURSO&limite=100').then(setRutas).catch((e) => setError(e.message));
  }, []);
  useEffect(cargar, [cargar]);
  useEffect(() => {
    api<Zona[]>('/zonas').then(setZonas).catch(() => setZonas([]));
  }, []);

  const optimizar = async () => {
    setCalculando(true);
    setError('');
    try {
      setResultado(await post<ResultadoPlan>('/rutas/optimizar', {}));
      cargar();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCalculando(false);
    }
  };

  const reoptimizar = async (e: FormEvent) => {
    e.preventDefault();
    setCalculando(true);
    setError('');
    try {
      const completados = incidente.completados.split(',').map((s) => Number(s.trim())).filter(Boolean);
      setResultado(
        await post<ResultadoPlan>(`/rutas/${incidente.ruta}/reoptimizar`, {
          tipo: incidente.tipo, hora_actual: incidente.hora_actual, demora_min: Number(incidente.demora_min),
          paradas_completadas: completados, descripcion: incidente.descripcion || null,
          ...(CON_PEDIDO.includes(incidente.tipo) ? { pedido_id: Number(incidente.pedido) } : {}),
        }),
      );
      cargar();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setCalculando(false);
    }
  };

  return (
    <section>
      <header className="fila-titulo">
        <h1>Rutas</h1>
        {gestiona && (
          <button onClick={optimizar} disabled={calculando}>
            {calculando ? 'Calculando…' : 'Generar rutas optimizadas'}
          </button>
        )}
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      {resultado && (
        <div className="tarjeta" role="status">
          <b>{resultado.estado}</b> · {resultado.rutas.length} rutas · {resultado.distancia_total_km.toFixed(1)} km ·{' '}
          {resultado.co2_total_kg.toFixed(2)} kg CO₂ · ahorro {resultado.ahorro_km.toFixed(1)} km /{' '}
          {resultado.ahorro_co2_kg.toFixed(2)} kg CO₂ · {resultado.tiempo_calculo_ms} ms
          {resultado.no_asignados.length > 0 && (
            <p className="error">
              {resultado.no_asignados.length} pedido(s) sin asignar por capacidad, ventana, jornada o zona restringida:{' '}
              {resultado.no_asignados.map((id) => `#${id}`).join(', ')}
            </p>
          )}
        </div>
      )}

      <MapaRutas rutas={rutas} zonas={zonas} />

      <div className="tarjetas">
        {rutas.map((r) => (
          <article key={r.id} className="tarjeta">
            <h3>Ruta #{r.id} · {r.vehiculo.placa} ({r.vehiculo.combustible})</h3>
            <p className="muted">
              {r.conductor?.nombre ?? 'Sin conductor'} · {r.hora_inicio}–{r.hora_fin} · {r.distancia_km.toFixed(1)} km ·{' '}
              {r.co2_kg.toFixed(2)} kg CO₂{r.descanso_min ? ` · descanso ${r.descanso_min} min` : ''}
              {r.ruta_origen_id ? ` · re-optimizada de #${r.ruta_origen_id}` : ''}
            </p>
            <ol>
              {r.paradas.map((p) => (
                <li key={p.id}>
                  {p.hora_llegada} · {p.pedido.cliente_nombre} ({p.pedido.codigo}, {p.pedido.peso_kg} kg) · pedido #{p.pedido.id}
                  {' · '}tramo {p.distancia_tramo_km.toFixed(1)} km / {p.tiempo_tramo_min} min, congestión {CONGESTION[p.congestion]}
                  {p.fuera_ventana && <b> · fuera de ventana</b>}
                </li>
              ))}
            </ol>
          </article>
        ))}
      </div>

      {gestiona && rutas.length > 0 && (
        <form className="tarjeta form-grid" onSubmit={reoptimizar} aria-label="Registrar incidente">
          <h2>Registrar incidente y re-optimizar</h2>
          <label>Ruta
            <select required value={incidente.ruta} onChange={(e) => setIncidente({ ...incidente, ruta: Number(e.target.value) })}>
              <option value={0}>—</option>
              {rutas.map((r) => <option key={r.id} value={r.id}>#{r.id} {r.vehiculo.placa}</option>)}
            </select>
          </label>
          <label>Tipo
            <select value={incidente.tipo} onChange={(e) => setIncidente({ ...incidente, tipo: e.target.value })}>
              {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label>Hora actual<input type="time" value={incidente.hora_actual} onChange={(e) => setIncidente({ ...incidente, hora_actual: e.target.value })} /></label>
          <label>Demora (min)<input type="number" min={0} value={incidente.demora_min} onChange={(e) => setIncidente({ ...incidente, demora_min: Number(e.target.value) })} /></label>
          <label>Pedidos ya entregados (IDs, separados por coma)<input value={incidente.completados} onChange={(e) => setIncidente({ ...incidente, completados: e.target.value })} /></label>
          <label>Descripción<input maxLength={250} value={incidente.descripcion} onChange={(e) => setIncidente({ ...incidente, descripcion: e.target.value })} /></label>
          {CON_PEDIDO.includes(incidente.tipo) && (
            <label>ID del pedido{incidente.tipo === 'PEDIDO_NUEVO' ? ' nuevo' : ' a cancelar'}
              <input type="number" min={1} required value={incidente.pedido} onChange={(e) => setIncidente({ ...incidente, pedido: e.target.value })} />
            </label>
          )}
          <div className="acciones"><button type="submit" disabled={calculando || !incidente.ruta}>Re-optimizar</button></div>
        </form>
      )}
    </section>
  );
}

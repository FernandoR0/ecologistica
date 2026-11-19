/** US-014 · Modo conductor (RNF-05 del caso): solo su ruta del día, entregas pendientes y alertas. */
import { useCallback, useEffect, useState } from 'react';
import { api, type Ruta } from '../api';

const ALERTA_CONGESTION = { VERDE: '', AMARILLO: 'Tráfico moderado en el tramo', ROJO: 'Tráfico alto (hora punta) en el tramo' };

export function MiRuta() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    api<Ruta[]>('/rutas/mias')
      .then(setRutas)
      .catch((e) => setError(e.message))
      .finally(() => setCargado(true));
  }, []);
  useEffect(cargar, [cargar]);

  const entregar = async (ruta: Ruta, paradaId: number) => {
    try {
      await api(`/rutas/${ruta.id}/paradas/${paradaId}/entregada`, { method: 'PATCH' });
      cargar();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!cargado) return <p className="muted">Cargando tu ruta…</p>;
  return (
    <section className="modo-conductor">
      <h1>Mi ruta de hoy</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {rutas.length === 0 && <p className="tarjeta">No tienes una ruta asignada por ahora.</p>}
      {rutas.map((r) => {
        const pendientes = r.paradas.filter((p) => p.estado !== 'ENTREGADA');
        const siguiente = pendientes[0];
        return (
          <article key={r.id} className="tarjeta">
            <p className="grande">
              🚚 {r.vehiculo.placa} · salida {r.hora_inicio} · regreso aprox. {r.hora_fin}
            </p>
            <p>
              Entregas pendientes: <b>{pendientes.length}</b> de {r.paradas.length}
              {r.descanso_min ? ` · incluye ${r.descanso_min} min de descanso` : ''}
            </p>
            {siguiente ? (
              <div className="siguiente" aria-live="polite">
                <h2>Siguiente entrega</h2>
                <p className="grande"><b>{siguiente.pedido.cliente_nombre}</b></p>
                <p>📍 {siguiente.pedido.direccion}{siguiente.pedido.punto_referencia ? ` · ${siguiente.pedido.punto_referencia}` : ''}</p>
                <p>🕑 Llegada estimada {siguiente.hora_llegada} (recibe de {siguiente.pedido.ventana_inicio} a {siguiente.pedido.ventana_fin})</p>
                {ALERTA_CONGESTION[siguiente.congestion] && (
                  <p className="alerta" role="alert">⚠ {ALERTA_CONGESTION[siguiente.congestion]}: {siguiente.tiempo_tramo_min} min</p>
                )}
                {siguiente.fuera_ventana && <p className="alerta">⚠ Llegarás fuera del horario del cliente; avisa al planificador.</p>}
                <button className="boton-grande" onClick={() => entregar(r, siguiente.id)}>✔ Entregado</button>
              </div>
            ) : (
              <p className="grande">✔ Ruta completada. Regresa al depósito.</p>
            )}
            <ol className="lista-grande">
              {r.paradas.map((p) => (
                <li key={p.id} className={p.estado === 'ENTREGADA' ? 'hecho' : ''}>
                  {p.hora_llegada} · {p.pedido.cliente_nombre} {p.estado === 'ENTREGADA' ? '(entregado)' : ''}
                </li>
              ))}
            </ol>
          </article>
        );
      })}
    </section>
  );
}

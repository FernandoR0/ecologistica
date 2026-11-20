/** US-014 · Modo conductor (RNF-05 del caso): solo su ruta del día, entregas pendientes y alertas. */
import { useCallback, useEffect, useState } from 'react';
import { api, ApiError, type Ruta } from '../api';
import { enlaceComoLlegar, marcarLocal, respaldo } from '../offline';

const ALERTA_CONGESTION = { VERDE: '', AMARILLO: 'Tráfico moderado en el tramo', ROJO: 'Tráfico alto (hora punta) en el tramo' };
const REINTENTO_MS = 15_000;
const sinRed = (e: unknown) => e instanceof ApiError && e.status === 0;
const hora = (iso: string) => new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });

export function MiRuta() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState('');
  const [sinConexion, setSinConexion] = useState<string | null>(null);
  const [porEnviar, setPorEnviar] = useState(respaldo.pendientes().length);

  /** Envía las entregas marcadas sin conexión; las que fallan por red quedan para el siguiente intento. */
  const enviarPendientes = useCallback(async () => {
    for (const p of respaldo.pendientes()) {
      try {
        await api(`/rutas/${p.rutaId}/paradas/${p.paradaId}/entregada`, { method: 'PATCH' });
        respaldo.quitarPendiente(p.paradaId);
      } catch (e) {
        if (sinRed(e)) break;
        respaldo.quitarPendiente(p.paradaId); // la API la rechazó (por ejemplo, ruta re-optimizada): no se reintenta
      }
    }
    setPorEnviar(respaldo.pendientes().length);
  }, []);

  const cargar = useCallback(async () => {
    try {
      await enviarPendientes();
      const datos = await api<Ruta[]>('/rutas/mias');
      const quedan = respaldo.pendientes();
      const vista = quedan.reduce((rs, p) => marcarLocal(rs, p.paradaId), datos);
      setRutas(vista);
      respaldo.guardarRuta(vista);
      setSinConexion(null);
      setError('');
    } catch (e) {
      const guardada = respaldo.leerRuta();
      if (sinRed(e) && guardada) {
        setRutas(guardada.rutas);
        setSinConexion(hora(guardada.guardadaEn));
        setError('');
      } else {
        setError((e as Error).message);
      }
    } finally {
      setCargado(true);
    }
  }, [enviarPendientes]);

  useEffect(() => {
    void cargar();
    const alVolver = () => void cargar();
    window.addEventListener('online', alVolver);
    return () => window.removeEventListener('online', alVolver);
  }, [cargar]);

  // El evento "online" no siempre llega (celulares, algunos navegadores): mientras falte señal se reintenta
  useEffect(() => {
    if (!sinConexion && porEnviar === 0) return;
    const id = window.setInterval(() => void cargar(), REINTENTO_MS);
    return () => window.clearInterval(id);
  }, [sinConexion, porEnviar, cargar]);

  const entregar = async (ruta: Ruta, paradaId: number) => {
    try {
      await api(`/rutas/${ruta.id}/paradas/${paradaId}/entregada`, { method: 'PATCH' });
      await cargar();
    } catch (e) {
      if (!sinRed(e)) {
        setError((e as Error).message);
        return;
      }
      // Sin señal: se registra en el celular y se envía al volver la conexión
      respaldo.agregarPendiente({ rutaId: ruta.id, paradaId });
      const vista = marcarLocal(rutas, paradaId);
      setRutas(vista);
      respaldo.guardarRuta(vista);
      setPorEnviar(respaldo.pendientes().length);
      setSinConexion((s) => s ?? hora(new Date().toISOString()));
    }
  };

  if (!cargado) return <p className="muted">Cargando tu ruta…</p>;
  return (
    <section className="modo-conductor">
      <h1>Mi ruta de hoy</h1>
      {sinConexion && (
        <p className="aviso-offline" role="status">
          📴 Sin conexión. Se muestra tu ruta guardada a las {sinConexion}. Puedes seguir marcando entregas: se
          enviarán solas cuando vuelva la señal.
        </p>
      )}
      {porEnviar > 0 && (
        <p className="aviso-offline" role="status">
          ⏳ {porEnviar === 1 ? '1 entrega pendiente de enviar' : `${porEnviar} entregas pendientes de enviar`}.
        </p>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {rutas.length === 0 && !error && <p className="tarjeta">No tienes una ruta asignada por ahora.</p>}
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
                <div className="acciones-conductor">
                  <a className="boton-grande secundario" href={enlaceComoLlegar(siguiente.pedido.lat, siguiente.pedido.lng)}
                    target="_blank" rel="noopener noreferrer">
                    🧭 Cómo llegar
                  </a>
                  <button className="boton-grande" onClick={() => entregar(r, siguiente.id)}>✔ Entregado</button>
                </div>
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

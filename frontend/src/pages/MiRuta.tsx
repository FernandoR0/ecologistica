/** US-014 · Modo conductor (RNF-05 del caso): solo su ruta del día, entregas pendientes y alertas. */
import { useCallback, useEffect, useState, type ChangeEvent } from 'react';
import { api, ApiError, type Ruta } from '../api';
import { reducirFoto } from '../foto';
import { enlaceComoLlegar, marcarLocal, respaldo } from '../offline';

const ALERTA_CONGESTION = { VERDE: '', AMARILLO: 'Tráfico moderado en el tramo', ROJO: 'Tráfico alto (hora punta) en el tramo' };
const REINTENTO_MS = 15_000;
const sinRed = (e: unknown) => e instanceof ApiError && e.status === 0;
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
const subirFoto = (rutaId: number, paradaId: number, imagen: string) =>
  api(`/rutas/${rutaId}/paradas/${paradaId}/evidencia`, { method: 'PUT', body: JSON.stringify({ imagen }) });

/** Confirmación que queda a la vista después de pulsar "Entregado" (sugerencia de la prueba SUS). */
interface Confirmacion { cliente: string; hora: string; conFoto: boolean; pendiente: boolean }

export function MiRuta() {
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [cargado, setCargado] = useState(false);
  const [error, setError] = useState('');
  const [sinConexion, setSinConexion] = useState<string | null>(null);
  const [porEnviar, setPorEnviar] = useState(respaldo.pendientes().length);
  const [foto, setFoto] = useState<string | null>(null);
  const [confirmacion, setConfirmacion] = useState<Confirmacion | null>(null);
  const [enviando, setEnviando] = useState(false);

  /** Envía las entregas marcadas sin conexión; las que fallan por red quedan para el siguiente intento. */
  const enviarPendientes = useCallback(async () => {
    for (const p of respaldo.pendientes()) {
      try {
        await api(`/rutas/${p.rutaId}/paradas/${p.paradaId}/entregada`, { method: 'PATCH' });
        if (p.foto) await subirFoto(p.rutaId, p.paradaId, p.foto);
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
      const vista = quedan.reduce((rs, p) => marcarLocal(rs, p.paradaId, { con_foto: !!p.foto }), datos);
      setRutas(vista);
      respaldo.guardarRuta(vista);
      setSinConexion(null);
      setConfirmacion((c) => (c && quedan.length === 0 ? { ...c, pendiente: false } : c));
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

  const elegirFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;
    try {
      setFoto(await reducirFoto(archivo));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const entregar = async (ruta: Ruta, paradaId: number, cliente: string) => {
    const ahora = new Date().toISOString();
    const conFoto = !!foto;
    setEnviando(true);
    try {
      await api(`/rutas/${ruta.id}/paradas/${paradaId}/entregada`, { method: 'PATCH' });
      if (foto) {
        try {
          await subirFoto(ruta.id, paradaId, foto);
        } catch (e) {
          if (!sinRed(e)) throw e;
          respaldo.agregarPendiente({ rutaId: ruta.id, paradaId, foto });
          setPorEnviar(respaldo.pendientes().length);
        }
      }
      setConfirmacion({ cliente, hora: hora(ahora), conFoto, pendiente: false });
      setFoto(null);
      await cargar();
    } catch (e) {
      if (!sinRed(e)) {
        setError((e as Error).message);
        return;
      }
      // Sin señal: se registra en el celular y se envía al volver la conexión
      respaldo.agregarPendiente({ rutaId: ruta.id, paradaId, ...(foto ? { foto } : {}) });
      const vista = marcarLocal(rutas, paradaId, { entregada_en: ahora, con_foto: conFoto });
      setRutas(vista);
      respaldo.guardarRuta(vista);
      setPorEnviar(respaldo.pendientes().length);
      setSinConexion((s) => s ?? hora(ahora));
      setConfirmacion({ cliente, hora: hora(ahora), conFoto, pendiente: true });
      setFoto(null);
    } finally {
      setEnviando(false);
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
      {confirmacion && (
        <div className="confirmacion-entrega" role="status" aria-live="polite">
          <p className="grande">✔ Entregado a <b>{confirmacion.cliente}</b> a las {confirmacion.hora}</p>
          <p>
            {confirmacion.conFoto ? '📷 Con foto de confirmación. ' : ''}
            {confirmacion.pendiente ? 'Se enviará al volver la señal.' : 'Registrado en el sistema.'}
          </p>
        </div>
      )}
      {error && <p className="error" role="alert">{error}</p>}
      {rutas.length === 0 && !error && <p className="tarjeta">No tienes una ruta asignada por ahora.</p>}
      {rutas.map((r) => {
        const pendientes = r.paradas.filter((p) => p.estado !== 'ENTREGADA');
        const hechas = r.paradas.length - pendientes.length;
        const siguiente = pendientes[0];
        return (
          <article key={r.id} className="tarjeta">
            <p className="grande">
              🚚 {r.vehiculo.placa} · salida {r.hora_inicio} · regreso aprox. {r.hora_fin}
            </p>
            <p>
              Entregadas <b>{hechas}</b> de {r.paradas.length} · pendientes <b>{pendientes.length}</b>
              {r.descanso_min ? ` · incluye ${r.descanso_min} min de descanso` : ''}
            </p>
            <progress className="avance" max={r.paradas.length} value={hechas}
              aria-label={`Avance de la ruta: ${hechas} de ${r.paradas.length} entregas`} />
            {siguiente ? (
              <div className="siguiente">
                <h2>{hechas === 0 ? 'Primera entrega' : 'Ahora vas a'} · {hechas + 1} de {r.paradas.length}</h2>
                <p className="grande"><b>{siguiente.pedido.cliente_nombre}</b></p>
                <p>📍 {siguiente.pedido.direccion}{siguiente.pedido.punto_referencia ? ` · ${siguiente.pedido.punto_referencia}` : ''}</p>
                <p>🕑 Llegada estimada {siguiente.hora_llegada} (recibe de {siguiente.pedido.ventana_inicio} a {siguiente.pedido.ventana_fin})</p>
                {ALERTA_CONGESTION[siguiente.congestion] && (
                  <p className="alerta" role="alert">⚠ {ALERTA_CONGESTION[siguiente.congestion]}: {siguiente.tiempo_tramo_min} min</p>
                )}
                {siguiente.fuera_ventana && <p className="alerta">⚠ Llegarás fuera del horario del cliente; avisa al planificador.</p>}
                <a className="boton-grande secundario" href={enlaceComoLlegar(siguiente.pedido.lat, siguiente.pedido.lng)}
                  target="_blank" rel="noopener noreferrer">
                  🧭 Cómo llegar a {siguiente.pedido.cliente_nombre}
                </a>
                <div className="paso-entrega">
                  <p className="muted">Al llegar y dejar el pedido:</p>
                  {foto ? (
                    <div className="vista-foto">
                      <img src={foto} alt={`Foto de la entrega a ${siguiente.pedido.cliente_nombre}`} />
                      <button type="button" className="secundario" onClick={() => setFoto(null)}>Quitar foto</button>
                    </div>
                  ) : (
                    <label className="boton-grande secundario boton-foto">
                      📷 Tomar foto de la entrega (opcional)
                      <input type="file" accept="image/*" capture="environment" onChange={elegirFoto} />
                    </label>
                  )}
                  <button className="boton-grande" disabled={enviando}
                    onClick={() => entregar(r, siguiente.id, siguiente.pedido.cliente_nombre)}>
                    {enviando ? 'Registrando…' : `✔ Entregado a ${siguiente.pedido.cliente_nombre}`}
                  </button>
                </div>
              </div>
            ) : (
              <p className="grande ruta-completa">🏁 Ruta completada. Regresa al depósito.</p>
            )}
            <ol className="lista-grande">
              {r.paradas.map((p) => (
                <li key={p.id} className={p.estado === 'ENTREGADA' ? 'hecho' : p === siguiente ? 'actual' : ''}>
                  {p.estado === 'ENTREGADA' ? '✔ ' : p === siguiente ? '➜ ' : ''}
                  {p.hora_llegada} · {p.pedido.cliente_nombre}
                  {p.estado === 'ENTREGADA'
                    ? ` (entregado${p.entregada_en ? ` ${hora(p.entregada_en)}` : ''}${p.con_foto ? ' 📷' : ''})`
                    : ''}
                </li>
              ))}
            </ol>
          </article>
        );
      })}
    </section>
  );
}

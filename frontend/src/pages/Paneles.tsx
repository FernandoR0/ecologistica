/** RF-005 dashboard · RF-006 sostenibilidad · RF-010 compensación de carbono. */
import { useEffect, useState, type FormEvent } from 'react';
import { api, descargar, post } from '../api';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth';

interface Dashboard {
  pedidos_por_estado: Record<string, number>; rutas: number; vehiculos_activos: number; entregas_planificadas: number;
  distancia_km: number; ahorro_km: number; ahorro_km_pct: number; co2_kg: number; ahorro_co2_kg: number; co2_por_entrega_kg: number;
  combustible_ahorrado_l: number; electricidad_ahorrada_kwh: number; ahorro_combustible_soles: number;
  cumplimiento_ventanas_pct: number; arboles_equivalentes: number; mensaje: string;
}
interface Sostenibilidad {
  co2_emitido_kg: number; co2_evitado_por_optimizacion_kg: number; co2_compensado_kg: number; co2_neto_kg: number;
  creditos_carbono_soles: number; avance_cero_neto_pct: number;
  por_combustible: Record<string, { km: number; co2_kg: number; rutas: number }>;
}
interface PlanCompensacion { co2_pendiente_kg: number; meta: string; opciones: Record<string, string | number>[] }
interface CostoVehiculo {
  placa: string; km: number; combustible_soles: number; mantenimiento_soles: number; depreciacion_soles: number;
  seguros_soles: number; total_soles: number; costo_por_km: number;
}
interface CostoCicloVida { dias: number; vehiculos: CostoVehiculo[]; total_soles: number }

function Kpi({ titulo, valor, detalle }: { titulo: string; valor: string | number; detalle?: string }) {
  return (
    <div className="kpi">
      <span className="muted">{titulo}</span>
      <strong>{valor}</strong>
      {detalle && <small>{detalle}</small>}
    </div>
  );
}

export function Inicio() {
  const { usuario } = useAuth();
  const esConductor = usuario?.rol === 'CONDUCTOR';
  const [d, setD] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!usuario || esConductor) return;
    api<Dashboard>('/indicadores').then(setD).catch((e) => setError(e.message));
  }, [usuario, esConductor]);
  // RF-011: el conductor entra directamente al modo conductor
  if (esConductor) return <Navigate to="/mi-ruta" replace />;
  if (error) return <p className="error">{error}</p>;
  if (!d) return <p className="muted">Cargando indicadores…</p>;
  return (
    <section>
      <h1>Dashboard</h1>
      <p className="mensaje-ahorro" role="status">{d.mensaje}</p>
      <div className="kpis">
        <Kpi titulo="Pedidos pendientes" valor={d.pedidos_por_estado.PENDIENTE ?? 0} />
        <Kpi titulo="Entregas planificadas" valor={d.entregas_planificadas} />
        <Kpi titulo="Rutas" valor={d.rutas} detalle={`${d.vehiculos_activos} vehículos activos`} />
        <Kpi titulo="Distancia" valor={`${d.distancia_km} km`} detalle={`Ahorro ${d.ahorro_km} km (${d.ahorro_km_pct} %)`} />
        <Kpi titulo="CO₂ emitido" valor={`${d.co2_kg} kg`} detalle={`Evitado ${d.ahorro_co2_kg} kg`} />
        <Kpi titulo="CO₂ por entrega" valor={`${d.co2_por_entrega_kg} kg`} />
        <Kpi titulo="Combustible ahorrado" valor={`${d.combustible_ahorrado_l} L`} detalle={`S/ ${d.ahorro_combustible_soles} · ${d.electricidad_ahorrada_kwh} kWh eléctricos`} />
        <Kpi titulo="Entregas dentro de su ventana" valor={`${d.cumplimiento_ventanas_pct} %`} />
        <Kpi titulo="Ahorro frente a la ruta secuencial" valor={`${d.ahorro_km_pct} %`} detalle="Menos kilómetros que repartir en el orden de registro" />
        <Kpi titulo="Equivale a" valor={`${d.arboles_equivalentes} árboles`} detalle="CO₂ evitado frente a lo que absorbe un árbol en un año" />
      </div>
    </section>
  );
}

export function SostenibilidadPage() {
  const { usuario } = useAuth();
  const [s, setS] = useState<Sostenibilidad | null>(null);
  const [plan, setPlan] = useState<PlanCompensacion | null>(null);
  const [lcc, setLcc] = useState<CostoCicloVida | null>(null);
  const [form, setForm] = useState({ fecha: new Date().toISOString().slice(0, 10), accion: 'REFORESTACION', proveedor: '', co2_kg: '', costo_soles: '' });
  const [error, setError] = useState('');

  const cargar = () => {
    api<Sostenibilidad>('/indicadores/sostenibilidad').then(setS).catch((e) => setError(e.message));
    api<PlanCompensacion>('/compensacion/plan').then(setPlan).catch((e) => setError(e.message));
    api<CostoCicloVida>('/indicadores/costo-ciclo-vida').then(setLcc).catch((e) => setError(e.message));
  };
  useEffect(cargar, []);

  const [descargando, setDescargando] = useState(false);
  const pdf = async () => {
    setDescargando(true);
    try {
      await descargar('/indicadores/reporte.pdf', `reporte-sostenibilidad-${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDescargando(false);
    }
  };

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await post('/compensacion', { ...form, co2_kg: Number(form.co2_kg), costo_soles: Number(form.costo_soles || 0), proveedor: form.proveedor || null });
      setForm({ ...form, co2_kg: '', costo_soles: '' });
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section>
      <header className="fila-titulo">
        <h1>Reporte de sostenibilidad</h1>
        <button onClick={pdf} disabled={descargando}>{descargando ? 'Generando…' : 'Descargar reporte PDF'}</button>
      </header>
      {error && <p className="error" role="alert">{error}</p>}
      {s && (
        <>
          <div className="kpis">
            <Kpi titulo="CO₂ emitido" valor={`${s.co2_emitido_kg} kg`} />
            <Kpi titulo="Evitado por optimización" valor={`${s.co2_evitado_por_optimizacion_kg} kg`} />
            <Kpi titulo="Compensado" valor={`${s.co2_compensado_kg} kg`} />
            <Kpi titulo="Huella neta" valor={`${s.co2_neto_kg} kg`} />
            <Kpi titulo="Ahorro en créditos de carbono" valor={`S/ ${s.creditos_carbono_soles}`} detalle="CO₂ evitado a S/ 60 por tonelada" />
            <Kpi titulo="Avance a cero carbono neto" valor={`${s.avance_cero_neto_pct} %`} detalle="CO₂ compensado / CO₂ emitido" />
          </div>
          <table>
            <thead><tr><th>Combustible</th><th>Rutas</th><th>km</th><th>kg CO₂</th></tr></thead>
            <tbody>
              {Object.entries(s.por_combustible).map(([k, v]) => (
                <tr key={k}><td>{k}</td><td>{v.rutas}</td><td>{v.km}</td><td>{v.co2_kg}</td></tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {lcc && (
        <div className="tarjeta">
          <h2>Costo del ciclo de vida de la flota ({lcc.dias} días)</h2>
          <p className="muted">Combustible + mantenimiento (S/ 1,20 por km) + depreciación (20 % anual) + seguros prorrateados.</p>
          <div className="tabla-scroll">
            <table>
              <thead><tr><th>Placa</th><th>km</th><th>Combustible</th><th>Mantenimiento</th><th>Depreciación</th><th>Seguros</th><th>Total (S/)</th><th>S/ por km</th></tr></thead>
              <tbody>
                {lcc.vehiculos.map((v) => (
                  <tr key={v.placa}>
                    <td>{v.placa}</td><td>{v.km}</td><td>{v.combustible_soles}</td><td>{v.mantenimiento_soles}</td>
                    <td>{v.depreciacion_soles}</td><td>{v.seguros_soles}</td><td>{v.total_soles}</td><td>{v.costo_por_km}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>Total de la flota: <b>S/ {lcc.total_soles}</b></p>
        </div>
      )}

      {plan && (
        <div className="tarjeta">
          <h2>Plan de compensación de carbono</h2>
          <p>CO₂ pendiente de compensar: <b>{plan.co2_pendiente_kg} kg</b> · Meta: {plan.meta}</p>
          <ul>
            {plan.opciones.map((o, i) => (
              <li key={i}>
                {String(o.accion)} — {'arboles_necesarios_por_anio' in o ? `${o.arboles_necesarios_por_anio} árboles/año` : `S/ ${o.costo_estimado_soles}`}{' '}
                <small className="muted">({String(o.supuesto)})</small>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(usuario?.rol === 'ADMIN' || usuario?.rol === 'PLANIFICADOR') && (
        <form className="tarjeta form-grid" onSubmit={registrar} aria-label="Registrar compensación">
          <h2>Registrar compensación</h2>
          <label>Fecha<input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></label>
          <label>Acción
            <select value={form.accion} onChange={(e) => setForm({ ...form, accion: e.target.value })}>
              <option value="REFORESTACION">Reforestación</option>
              <option value="BONO_CARBONO">Bono de carbono</option>
            </select>
          </label>
          <label>Proveedor<input value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} /></label>
          <label>kg CO₂<input type="number" step="0.1" required value={form.co2_kg} onChange={(e) => setForm({ ...form, co2_kg: e.target.value })} /></label>
          <label>Costo (S/)<input type="number" step="0.01" value={form.costo_soles} onChange={(e) => setForm({ ...form, costo_soles: e.target.value })} /></label>
          <div className="acciones"><button type="submit">Registrar</button></div>
        </form>
      )}
    </section>
  );
}

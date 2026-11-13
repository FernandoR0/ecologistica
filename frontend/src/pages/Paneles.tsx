/** RF-005 dashboard · RF-006 sostenibilidad · RF-010 compensación de carbono. */
import { useEffect, useState, type FormEvent } from 'react';
import { api, post } from '../api';
import { useAuth } from '../auth';

interface Dashboard {
  pedidos_por_estado: Record<string, number>; rutas: number; vehiculos_activos: number; entregas_planificadas: number;
  distancia_km: number; ahorro_km: number; ahorro_km_pct: number; co2_kg: number; ahorro_co2_kg: number; co2_por_entrega_kg: number;
}
interface Sostenibilidad {
  co2_emitido_kg: number; co2_evitado_por_optimizacion_kg: number; co2_compensado_kg: number; co2_neto_kg: number;
  por_combustible: Record<string, { km: number; co2_kg: number; rutas: number }>;
}
interface PlanCompensacion { co2_pendiente_kg: number; opciones: Record<string, string | number>[] }

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
  const [d, setD] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<Dashboard>('/indicadores').then(setD).catch((e) => setError(e.message));
  }, []);
  if (error) return <p className="error">{error}</p>;
  if (!d) return <p className="muted">Cargando indicadores…</p>;
  return (
    <section>
      <h1>Dashboard</h1>
      <div className="kpis">
        <Kpi titulo="Pedidos pendientes" valor={d.pedidos_por_estado.PENDIENTE ?? 0} />
        <Kpi titulo="Entregas planificadas" valor={d.entregas_planificadas} />
        <Kpi titulo="Rutas" valor={d.rutas} detalle={`${d.vehiculos_activos} vehículos activos`} />
        <Kpi titulo="Distancia" valor={`${d.distancia_km} km`} detalle={`Ahorro ${d.ahorro_km} km (${d.ahorro_km_pct} %)`} />
        <Kpi titulo="CO₂ emitido" valor={`${d.co2_kg} kg`} detalle={`Evitado ${d.ahorro_co2_kg} kg`} />
        <Kpi titulo="CO₂ por entrega" valor={`${d.co2_por_entrega_kg} kg`} />
      </div>
    </section>
  );
}

export function SostenibilidadPage() {
  const { usuario } = useAuth();
  const [s, setS] = useState<Sostenibilidad | null>(null);
  const [plan, setPlan] = useState<PlanCompensacion | null>(null);
  const [form, setForm] = useState({ fecha: new Date().toISOString().slice(0, 10), accion: '', proveedor: '', co2_kg: '', costo_soles: '' });
  const [error, setError] = useState('');

  const cargar = () => {
    api<Sostenibilidad>('/indicadores/sostenibilidad').then(setS).catch((e) => setError(e.message));
    api<PlanCompensacion>('/compensacion/plan').then(setPlan).catch((e) => setError(e.message));
  };
  useEffect(cargar, []);

  const registrar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await post('/compensacion', { ...form, co2_kg: Number(form.co2_kg), costo_soles: Number(form.costo_soles || 0), proveedor: form.proveedor || null });
      setForm({ ...form, accion: '', co2_kg: '', costo_soles: '' });
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section>
      <h1>Reporte de sostenibilidad</h1>
      {error && <p className="error" role="alert">{error}</p>}
      {s && (
        <>
          <div className="kpis">
            <Kpi titulo="CO₂ emitido" valor={`${s.co2_emitido_kg} kg`} />
            <Kpi titulo="Evitado por optimización" valor={`${s.co2_evitado_por_optimizacion_kg} kg`} />
            <Kpi titulo="Compensado" valor={`${s.co2_compensado_kg} kg`} />
            <Kpi titulo="Huella neta" valor={`${s.co2_neto_kg} kg`} />
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

      {plan && (
        <div className="tarjeta">
          <h2>Plan de compensación de carbono</h2>
          <p>CO₂ pendiente de compensar: <b>{plan.co2_pendiente_kg} kg</b></p>
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

      {usuario?.rol === 'ADMIN' && (
        <form className="tarjeta form-grid" onSubmit={registrar} aria-label="Registrar compensación">
          <h2>Registrar compensación</h2>
          <label>Fecha<input type="date" required value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></label>
          <label>Acción<input required value={form.accion} onChange={(e) => setForm({ ...form, accion: e.target.value })} /></label>
          <label>Proveedor<input value={form.proveedor} onChange={(e) => setForm({ ...form, proveedor: e.target.value })} /></label>
          <label>kg CO₂<input type="number" step="0.1" required value={form.co2_kg} onChange={(e) => setForm({ ...form, co2_kg: e.target.value })} /></label>
          <label>Costo (S/)<input type="number" step="0.01" value={form.costo_soles} onChange={(e) => setForm({ ...form, costo_soles: e.target.value })} /></label>
          <div className="acciones"><button type="submit">Registrar</button></div>
        </form>
      )}
    </section>
  );
}

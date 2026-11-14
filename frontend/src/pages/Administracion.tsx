/** RF-012 · Usuarios, parámetros del motor y bitácora de auditoría (solo ADMIN). */
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, apiPaginado, post, put, type Rol, type Usuario } from '../api';

interface UsuarioFila extends Usuario { activo: boolean }
interface Configuracion {
  velocidad_kmh: number; factor_vial: number; peso_co2: number; servicio_min: number; limite_segundos: number;
  precio_combustible_soles: number;
}
interface Registro { id: number; fecha: string; correo: string | null; accion: string; recurso: string; estado_http: number }

const CAMPOS_CONF: { nombre: keyof Configuracion; etiqueta: string; paso: string }[] = [
  { nombre: 'velocidad_kmh', etiqueta: 'Velocidad urbana promedio (km/h)', paso: '0.1' },
  { nombre: 'factor_vial', etiqueta: 'Factor vial (calles / línea recta)', paso: '0.01' },
  { nombre: 'peso_co2', etiqueta: 'Peso del CO₂ en el objetivo (Green VRP)', paso: '0.1' },
  { nombre: 'servicio_min', etiqueta: 'Minutos de descarga por parada', paso: '1' },
  { nombre: 'limite_segundos', etiqueta: 'Tiempo máximo del motor (s)', paso: '1' },
  { nombre: 'precio_combustible_soles', etiqueta: 'Precio del diésel (S/ por galón)', paso: '0.01' },
];

function Usuarios() {
  const [lista, setLista] = useState<UsuarioFila[]>([]);
  const [form, setForm] = useState({ nombre: '', correo: '', password: '', rol: 'PLANIFICADOR' as Rol });
  const [error, setError] = useState('');
  const cargar = useCallback(() => {
    api<UsuarioFila[]>('/auth/usuarios').then(setLista).catch((e) => setError(e.message));
  }, []);
  useEffect(cargar, [cargar]);

  const crear = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await post('/auth/usuarios', form);
      setForm({ nombre: '', correo: '', password: '', rol: 'PLANIFICADOR' });
      setError('');
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };
  const cambiar = async (u: UsuarioFila) => {
    try {
      await put(`/auth/usuarios/${u.id}`, { activo: !u.activo });
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="tarjeta">
      <h2>Usuarios</h2>
      {error && <p className="error" role="alert">{error}</p>}
      <form className="form-grid" onSubmit={crear} aria-label="Crear usuario">
        <label>Nombre<input required minLength={3} value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
        <label>Correo<input type="email" required value={form.correo} onChange={(e) => setForm({ ...form, correo: e.target.value })} /></label>
        <label>Contraseña inicial<input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
        <label>Rol
          <select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value as Rol })}>
            <option>ADMIN</option><option>PLANIFICADOR</option><option>CONDUCTOR</option>
          </select>
        </label>
        <div className="acciones"><button type="submit">Crear usuario</button></div>
      </form>
      <table>
        <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th /></tr></thead>
        <tbody>
          {lista.map((u) => (
            <tr key={u.id}>
              <td>{u.nombre}</td><td>{u.correo}</td><td>{u.rol}</td><td>{u.activo ? 'Activo' : 'Inactivo'}</td>
              <td><button className="secundario" onClick={() => cambiar(u)}>{u.activo ? 'Desactivar' : 'Activar'}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ParametrosMotor() {
  const [conf, setConf] = useState<Configuracion | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    api<Configuracion>('/configuracion').then(setConf).catch((e) => setError(e.message));
  }, []);
  if (!conf) return <div className="tarjeta">{error ? <p className="error">{error}</p> : <p className="muted">Cargando parámetros…</p>}</div>;

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setConf(await put<Configuracion>('/configuracion', conf));
      setMensaje('Parámetros guardados. Se aplican en la próxima planificación.');
      setError('');
    } catch (err) {
      setError((err as Error).message);
      setMensaje('');
    }
  };

  return (
    <form className="tarjeta form-grid" onSubmit={guardar} aria-label="Parámetros del motor">
      <h2>Parámetros del motor de rutas</h2>
      {CAMPOS_CONF.map((c) => (
        <label key={c.nombre}>{c.etiqueta}
          <input type="number" step={c.paso} required value={conf[c.nombre]}
            onChange={(e) => setConf({ ...conf, [c.nombre]: Number(e.target.value) })} />
        </label>
      ))}
      <div className="acciones"><button type="submit">Guardar parámetros</button></div>
      {mensaje && <p role="status">{mensaje}</p>}
      {error && <p className="error" role="alert">{error}</p>}
    </form>
  );
}

function Auditoria() {
  const [filas, setFilas] = useState<Registro[]>([]);
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  useEffect(() => {
    apiPaginado<Registro>('/auditoria', pagina, 12).then((r) => {
      setFilas(r.datos);
      setTotal(r.total);
    }).catch(() => setFilas([]));
  }, [pagina]);
  const paginas = Math.max(1, Math.ceil(total / 12));
  return (
    <div className="tarjeta">
      <h2>Bitácora de auditoría</h2>
      <div className="tabla-scroll">
        <table>
          <thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Recurso</th><th>Resultado</th></tr></thead>
          <tbody>
            {filas.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.fecha).toLocaleString('es-PE')}</td><td>{r.correo ?? '—'}</td><td>{r.accion}</td>
                <td>{r.recurso}</td><td>{r.estado_http}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {total > 12 && (
        <nav className="paginacion" aria-label="Paginación de auditoría">
          <button className="secundario" disabled={pagina === 1} onClick={() => setPagina(pagina - 1)}>Anterior</button>
          <span>Página {pagina} de {paginas}</span>
          <button className="secundario" disabled={pagina >= paginas} onClick={() => setPagina(pagina + 1)}>Siguiente</button>
        </nav>
      )}
    </div>
  );
}

export function Administracion() {
  return (
    <section>
      <h1>Administración</h1>
      <Usuarios />
      <ParametrosMotor />
      <Auditoria />
    </section>
  );
}

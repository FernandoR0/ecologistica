/** RF-001 flota · RF-002 pedidos · RF-008 conductores · RF-009 preferencias. */
import { useEffect, useState, type FormEvent } from 'react';
import { api, del, put } from '../api';
import { useAuth } from '../auth';
import { CrudPage } from '../components/CrudPage';

const usePuedeEditar = () => {
  const { usuario } = useAuth();
  return usuario?.rol === 'ADMIN' || usuario?.rol === 'PLANIFICADOR';
};

export function Vehiculos() {
  return (
    <CrudPage
      titulo="Flota"
      ruta="/vehiculos"
      puedeEditar={usePuedeEditar()}
      campos={[
        { nombre: 'placa', etiqueta: 'Placa', requerido: true, soloCrear: true },
        { nombre: 'tipo', etiqueta: 'Tipo' },
        { nombre: 'capacidad_kg', etiqueta: 'Capacidad (kg)', tipo: 'number', requerido: true },
        { nombre: 'combustible', etiqueta: 'Combustible', tipo: 'select', opciones: ['DIESEL', 'GASOLINA', 'GLP', 'GNV', 'ELECTRICO'] },
        { nombre: 'consumo_100km', etiqueta: 'Consumo /100 km (L o kWh)', tipo: 'number', paso: '0.1', requerido: true },
        { nombre: 'activo', etiqueta: 'Activo', tipo: 'checkbox' },
      ]}
      columnas={[
        { campo: 'placa', etiqueta: 'Placa' },
        { campo: 'tipo', etiqueta: 'Tipo' },
        { campo: 'capacidad_kg', etiqueta: 'Capacidad (kg)' },
        { campo: 'combustible', etiqueta: 'Combustible' },
        { campo: 'consumo_100km', etiqueta: 'Consumo' },
        { campo: 'activo', etiqueta: 'Activo' },
      ]}
    />
  );
}

export function Conductores() {
  return (
    <CrudPage
      titulo="Conductores"
      ruta="/conductores"
      puedeEditar={usePuedeEditar()}
      campos={[
        { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
        { nombre: 'dni', etiqueta: 'DNI', requerido: true, soloCrear: true },
        { nombre: 'licencia', etiqueta: 'Licencia', requerido: true },
        { nombre: 'telefono', etiqueta: 'Teléfono' },
        { nombre: 'hora_inicio', etiqueta: 'Inicio de jornada', tipo: 'time' },
        { nombre: 'jornada_max_min', etiqueta: 'Jornada máx. (min)', tipo: 'number' },
        { nombre: 'vehiculo_id', etiqueta: 'ID vehículo asignado', tipo: 'number' },
        { nombre: 'activo', etiqueta: 'Activo', tipo: 'checkbox' },
      ]}
      columnas={[
        { campo: 'nombre', etiqueta: 'Nombre' },
        { campo: 'dni', etiqueta: 'DNI' },
        { campo: 'licencia', etiqueta: 'Licencia' },
        { campo: 'hora_inicio', etiqueta: 'Inicio' },
        { campo: 'jornada_max_min', etiqueta: 'Jornada (min)' },
        { campo: 'vehiculo_id', etiqueta: 'Vehículo' },
        { campo: 'activo', etiqueta: 'Activo' },
      ]}
    />
  );
}

export function Pedidos() {
  return (
    <CrudPage
      titulo="Pedidos"
      ruta="/pedidos"
      borrarTexto="Cancelar"
      puedeEditar={usePuedeEditar()}
      campos={[
        { nombre: 'codigo', etiqueta: 'Código', requerido: true, soloCrear: true },
        { nombre: 'cliente', etiqueta: 'Cliente', requerido: true },
        { nombre: 'direccion', etiqueta: 'Dirección', requerido: true },
        { nombre: 'distrito', etiqueta: 'Distrito', tipo: 'select', opciones: ['Huancayo', 'El Tambo', 'Chilca', 'Pilcomayo'] },
        { nombre: 'lat', etiqueta: 'Latitud', tipo: 'number', paso: 'any', requerido: true },
        { nombre: 'lng', etiqueta: 'Longitud', tipo: 'number', paso: 'any', requerido: true },
        { nombre: 'peso_kg', etiqueta: 'Peso (kg)', tipo: 'number', requerido: true },
        { nombre: 'ventana_inicio', etiqueta: 'Ventana desde', tipo: 'time' },
        { nombre: 'ventana_fin', etiqueta: 'Ventana hasta', tipo: 'time' },
        { nombre: 'prioridad', etiqueta: 'Prioridad (1 alta – 3 baja)', tipo: 'number' },
      ]}
      columnas={[
        { campo: 'codigo', etiqueta: 'Código' },
        { campo: 'cliente', etiqueta: 'Cliente' },
        { campo: 'distrito', etiqueta: 'Distrito' },
        { campo: 'peso_kg', etiqueta: 'Peso' },
        { campo: 'ventana_inicio', etiqueta: 'Desde' },
        { campo: 'ventana_fin', etiqueta: 'Hasta' },
        { campo: 'prioridad', etiqueta: 'Prioridad' },
        { campo: 'estado', etiqueta: 'Estado' },
      ]}
    />
  );
}

interface Preferencia { id: number; cliente: string; hora_desde: string; hora_hasta: string; dias: string; notas?: string }

export function Preferencias() {
  const [lista, setLista] = useState<Preferencia[]>([]);
  const [form, setForm] = useState({ cliente: '', hora_desde: '09:00', hora_hasta: '11:00', dias: '1,2,3,4,5,6', notas: '' });
  const [error, setError] = useState('');
  const puede = usePuedeEditar();
  const cargar = () => {
    api<Preferencia[]>('/preferencias').then(setLista).catch((e) => setError(e.message));
  };
  useEffect(cargar, []);

  const guardar = async (e: FormEvent) => {
    e.preventDefault();
    const { cliente, ...datos } = form;
    try {
      await put(`/preferencias/${encodeURIComponent(cliente)}`, { ...datos, notas: datos.notas || null });
      setError('');
      cargar();
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <section>
      <h1>Preferencias de recepción</h1>
      <p className="muted">El motor de rutas solo programa la entrega dentro del horario preferido por el cliente.</p>
      {error && <p className="error" role="alert">{error}</p>}
      {puede && (
        <form className="tarjeta form-grid" onSubmit={guardar} aria-label="Formulario de preferencia">
          <label>Cliente (igual que en el pedido)<input required value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} /></label>
          <label>Desde<input type="time" required value={form.hora_desde} onChange={(e) => setForm({ ...form, hora_desde: e.target.value })} /></label>
          <label>Hasta<input type="time" required value={form.hora_hasta} onChange={(e) => setForm({ ...form, hora_hasta: e.target.value })} /></label>
          <label>Días (1=lun … 7=dom)<input value={form.dias} onChange={(e) => setForm({ ...form, dias: e.target.value })} /></label>
          <label>Notas<input value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} /></label>
          <div className="acciones"><button type="submit">Guardar</button></div>
        </form>
      )}
      <table>
        <thead><tr><th>Cliente</th><th>Horario</th><th>Días</th><th>Notas</th>{puede && <th />}</tr></thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.id}>
              <td>{p.cliente}</td><td>{p.hora_desde} – {p.hora_hasta}</td><td>{p.dias}</td><td>{p.notas ?? '—'}</td>
              {puede && (
                <td><button className="peligro" onClick={() => del(`/preferencias/${encodeURIComponent(p.cliente)}`).then(cargar)}>Eliminar</button></td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

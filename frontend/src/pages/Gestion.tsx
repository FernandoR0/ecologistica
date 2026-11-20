/** RF-001 flota · RF-002 pedidos · RF-008 conductores · RF-009 clientes. */
import { useEffect, useState } from 'react';
import { api, type Cliente, type Vehiculo } from '../api';
import { useAuth } from '../auth';
import { CrudPage } from '../components/CrudPage';

const usePuedeEditar = () => {
  const { usuario } = useAuth();
  return usuario?.rol === 'ADMIN' || usuario?.rol === 'PLANIFICADOR';
};

const DISTRITOS = ['Huancayo', 'El Tambo', 'Chilca'];
const CATEGORIAS = ['A-I', 'A-IIa', 'A-IIb', 'A-IIIa', 'A-IIIb', 'A-IIIc', 'B-IIb', 'B-IIc'];

export function Vehiculos() {
  return (
    <CrudPage
      titulo="Flota"
      ruta="/vehiculos"
      puedeEditar={usePuedeEditar()}
      campos={[
        { nombre: 'placa', etiqueta: 'Placa', requerido: true, soloCrear: true },
        { nombre: 'tipo', etiqueta: 'Tipo', tipo: 'select', opciones: ['CAMIONETA', 'FURGON', 'MOTO'], requerido: true },
        { nombre: 'capacidad_kg', etiqueta: 'Capacidad de carga (kg)', tipo: 'number', requerido: true },
        { nombre: 'volumen_m3', etiqueta: 'Volumen (m³)', tipo: 'number', paso: '0.1', requerido: true },
        { nombre: 'combustible', etiqueta: 'Combustible', tipo: 'select', opciones: ['DIESEL', 'GASOLINA', 'GLP', 'GNV', 'ELECTRICO'], requerido: true },
        { nombre: 'rendimiento', etiqueta: 'Rendimiento (km/L, km/m³ o km/kWh)', tipo: 'number', paso: '0.1', requerido: true },
        { nombre: 'anio_fabricacion', etiqueta: 'Año de fabricación', tipo: 'number', requerido: true },
        { nombre: 'valor_adquisicion_soles', etiqueta: 'Valor de adquisición (S/)', tipo: 'number' },
        { nombre: 'seguro_anual_soles', etiqueta: 'Seguros por año: SOAT + vehicular (S/)', tipo: 'number' },
        { nombre: 'activo', etiqueta: 'Activo', tipo: 'checkbox' },
      ]}
      columnas={[
        { campo: 'placa', etiqueta: 'Placa' },
        { campo: 'tipo', etiqueta: 'Tipo' },
        { campo: 'capacidad_kg', etiqueta: 'kg' },
        { campo: 'volumen_m3', etiqueta: 'm³' },
        { campo: 'combustible', etiqueta: 'Combustible' },
        { campo: 'rendimiento', etiqueta: 'Rendimiento' },
        { campo: 'factor_emision_kg_km', etiqueta: 'kg CO₂/km' },
        { campo: 'anio_fabricacion', etiqueta: 'Año' },
        { campo: 'restringido_centro', etiqueta: 'Restringido en el Centro' },
        { campo: 'activo', etiqueta: 'Activo' },
      ]}
    />
  );
}

function useVehiculos() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  useEffect(() => {
    api<Vehiculo[]>('/vehiculos?activo=true&limite=100').then(setVehiculos).catch(() => setVehiculos([]));
  }, []);
  return vehiculos.map((v) => ({ valor: v.id, etiqueta: `${v.placa} (${v.tipo})` }));
}

export function Conductores() {
  const vehiculos = useVehiculos();
  return (
    <CrudPage
      titulo="Conductores"
      ruta="/conductores"
      puedeEditar={usePuedeEditar()}
      campos={[
        { nombre: 'nombre', etiqueta: 'Nombre', requerido: true },
        { nombre: 'dni', etiqueta: 'DNI', requerido: true, soloCrear: true },
        { nombre: 'licencia', etiqueta: 'N.º de licencia', requerido: true },
        { nombre: 'categoria_licencia', etiqueta: 'Categoría de licencia', tipo: 'select', opciones: CATEGORIAS, requerido: true },
        { nombre: 'anios_experiencia', etiqueta: 'Años de experiencia', tipo: 'number' },
        { nombre: 'telefono', etiqueta: 'Teléfono de contacto' },
        { nombre: 'disponible_desde', etiqueta: 'Disponible desde', tipo: 'time' },
        { nombre: 'disponible_hasta', etiqueta: 'Disponible hasta', tipo: 'time' },
        { nombre: 'jornada_max_min', etiqueta: 'Jornada máxima (min)', tipo: 'number' },
        { nombre: 'vehiculo_id', etiqueta: 'Vehículo asignado', tipo: 'select', opciones: vehiculos, numerico: true },
        {
          nombre: 'partida', etiqueta: 'Punto de partida del conductor (opcional)', tipo: 'ubicacion',
          claves: ['partida_lat', 'partida_lng'], ayuda: 'Sin punto de partida: sale del depósito.',
        },
        { nombre: 'activo', etiqueta: 'Activo', tipo: 'checkbox' },
      ]}
      columnas={[
        { campo: 'nombre', etiqueta: 'Nombre' },
        { campo: 'dni', etiqueta: 'DNI' },
        { campo: 'categoria_licencia', etiqueta: 'Licencia' },
        { campo: 'anios_experiencia', etiqueta: 'Experiencia (años)' },
        { campo: 'telefono', etiqueta: 'Teléfono' },
        { campo: 'disponible_desde', etiqueta: 'Desde' },
        { campo: 'disponible_hasta', etiqueta: 'Hasta' },
        { campo: 'vehiculo_id', etiqueta: 'Vehículo' },
        { campo: 'activo', etiqueta: 'Activo' },
      ]}
    />
  );
}

// Sugerencia de la prueba SUS: un participante escribió "de 12 a 6" pensando en el formato de 12 horas
const AYUDA_HORA = 'Formato de 24 horas, entre 05:00 y 22:00. Ej.: 18:00 = 6 de la tarde.';
const aMin = (h: unknown) => {
  const [hh, mm] = String(h).split(':').map(Number);
  return hh * 60 + mm;
};
const llena = (v: unknown) => v !== '' && v !== undefined && v !== null;

/** Revisa un horario antes de enviarlo y explica el error en palabras simples. */
export function revisarHorario(desde: unknown, hasta: unknown, que: string, rangoOperativo = true): string | null {
  if (!llena(desde) || !llena(hasta)) return null;
  const [d, h] = [aMin(desde), aMin(hasta)];
  if (rangoOperativo && (d < 5 * 60 || h > 22 * 60)) {
    return `${que} debe estar entre 05:00 y 22:00 (formato de 24 horas: 6 de la tarde se escribe 18:00).`;
  }
  if (h <= d) {
    return `${que}: la hora de fin (${String(hasta)}) debe ser después de la de inicio (${String(desde)}). ` +
      'Usa el formato de 24 horas: 6 de la tarde se escribe 18:00.';
  }
  return null;
}

export function Clientes() {
  return (
    <CrudPage
      titulo="Clientes"
      ruta="/clientes"
      puedeEditar={usePuedeEditar()}
      validar={(f) => revisarHorario(f.hora_desde, f.hora_hasta, 'El horario de recepción')}
      campos={[
        { nombre: 'nombre', etiqueta: 'Nombre del cliente', requerido: true },
        { nombre: 'telefono', etiqueta: 'Teléfono' },
        { nombre: 'direccion', etiqueta: 'Dirección', requerido: true },
        { nombre: 'distrito', etiqueta: 'Distrito', tipo: 'select', opciones: DISTRITOS, requerido: true },
        { nombre: 'ubicacion', etiqueta: 'Ubicación del cliente en el mapa', tipo: 'ubicacion', requerido: true },
        { nombre: 'punto_referencia', etiqueta: 'Punto de referencia', ayuda: 'Ejemplo: frente a la bodega El Ahorro' },
        { nombre: 'restricciones_acceso', etiqueta: 'Restricciones de acceso', ayuda: 'Ejemplo: calle angosta, solo camioneta' },
        { nombre: 'hora_desde', etiqueta: 'Recibe desde', tipo: 'time', ayuda: AYUDA_HORA },
        { nombre: 'hora_hasta', etiqueta: 'Recibe hasta', tipo: 'time', ayuda: 'Debe ser después de la hora de inicio.' },
        { nombre: 'dias_atencion', etiqueta: 'Días de atención (LU,MA,MI,JU,VI,SA,DO)' },
        { nombre: 'activo', etiqueta: 'Activo', tipo: 'checkbox' },
      ]}
      columnas={[
        { campo: 'nombre', etiqueta: 'Cliente' },
        { campo: 'distrito', etiqueta: 'Distrito' },
        { campo: 'hora_desde', etiqueta: 'Desde' },
        { campo: 'hora_hasta', etiqueta: 'Hasta' },
        { campo: 'dias_atencion', etiqueta: 'Días' },
        { campo: 'punto_referencia', etiqueta: 'Punto de referencia' },
        { campo: 'restricciones_acceso', etiqueta: 'Restricciones de acceso' },
      ]}
    />
  );
}

export function Pedidos() {
  const [clientes, setClientes] = useState<{ valor: number; etiqueta: string }[]>([]);
  useEffect(() => {
    api<Cliente[]>('/clientes?activo=true&limite=100')
      .then((cs) => setClientes(cs.map((c) => ({ valor: c.id, etiqueta: c.nombre }))))
      .catch(() => setClientes([]));
  }, []);
  // Sugerencia de la prueba SUS: mostrar el límite de la flota y avisar en el formulario, no recién al generar rutas
  const [flota, setFlota] = useState<{ kg: number; m3: number } | null>(null);
  useEffect(() => {
    api<Vehiculo[]>('/vehiculos?activo=true&limite=100')
      .then((vs) => setFlota(vs.length
        ? { kg: Math.max(...vs.map((v) => v.capacidad_kg)), m3: Math.max(...vs.map((v) => v.volumen_m3)) }
        : null))
      .catch(() => setFlota(null));
  }, []);
  const validar = (f: Record<string, unknown>) => {
    if (flota && llena(f.peso_kg) && Number(f.peso_kg) > flota.kg) {
      return `Ningún vehículo de la flota puede llevar ${f.peso_kg} kg: el de mayor capacidad carga ${flota.kg} kg. ` +
        'Divide el pedido o registra un vehículo más grande en Flota.';
    }
    if (flota && llena(f.volumen_m3) && Number(f.volumen_m3) > flota.m3) {
      return `Ningún vehículo de la flota puede llevar ${f.volumen_m3} m³: el de mayor volumen lleva ${flota.m3} m³. ` +
        'Divide el pedido o registra un vehículo más grande en Flota.';
    }
    return revisarHorario(f.ventana_inicio, f.ventana_fin, 'La ventana de entrega', false);
  };
  return (
    <CrudPage
      titulo="Pedidos"
      ruta="/pedidos"
      borrarTexto="Cancelar"
      puedeEditar={usePuedeEditar()}
      validar={validar}
      campos={[
        { nombre: 'codigo', etiqueta: 'Código', automatico: true },
        { nombre: 'cliente_id', etiqueta: 'Cliente', tipo: 'select', opciones: clientes, numerico: true, requerido: true, soloCrear: true },
        { nombre: 'direccion', etiqueta: 'Dirección (vacío = la del cliente)' },
        { nombre: 'punto_referencia', etiqueta: 'Punto de referencia' },
        {
          nombre: 'ubicacion', etiqueta: 'Otra ubicación de entrega (opcional)', tipo: 'ubicacion',
          ayuda: 'Sin ubicación: se entrega en la del cliente.',
        },
        {
          nombre: 'peso_kg', etiqueta: 'Peso (kg)', tipo: 'number', paso: '0.1', requerido: true,
          ayuda: flota ? `Máximo ${flota.kg} kg (vehículo de mayor capacidad).` : undefined,
        },
        {
          nombre: 'volumen_m3', etiqueta: 'Volumen (m³)', tipo: 'number', paso: '0.01',
          ayuda: flota ? `Máximo ${flota.m3} m³ (vehículo de mayor volumen).` : undefined,
        },
        { nombre: 'ventana_inicio', etiqueta: 'Entregar desde (vacío = horario del cliente)', tipo: 'time', ayuda: AYUDA_HORA },
        { nombre: 'ventana_fin', etiqueta: 'Entregar hasta', tipo: 'time' },
        { nombre: 'prioridad', etiqueta: 'Prioridad', tipo: 'select', opciones: ['EXPRESS', 'ESTANDAR', 'ECONOMICO'] },
        { nombre: 'tipo_producto', etiqueta: 'Tipo de producto', tipo: 'select', opciones: ['PERECEDERO', 'NO_PERECEDERO'] },
      ]}
      columnas={[
        { campo: 'codigo', etiqueta: 'Código' },
        { campo: 'cliente_nombre', etiqueta: 'Cliente' },
        { campo: 'peso_kg', etiqueta: 'kg' },
        { campo: 'volumen_m3', etiqueta: 'm³' },
        { campo: 'ventana_inicio', etiqueta: 'Desde' },
        { campo: 'ventana_fin', etiqueta: 'Hasta' },
        { campo: 'prioridad', etiqueta: 'Prioridad' },
        { campo: 'tipo_producto', etiqueta: 'Producto' },
        { campo: 'estado', etiqueta: 'Estado' },
      ]}
    />
  );
}

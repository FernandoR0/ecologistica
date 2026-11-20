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
        { nombre: 'partida_lat', etiqueta: 'Punto de partida: latitud (vacío = depósito)', tipo: 'number', paso: 'any' },
        { nombre: 'partida_lng', etiqueta: 'Punto de partida: longitud', tipo: 'number', paso: 'any' },
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

export function Clientes() {
  return (
    <CrudPage
      titulo="Clientes"
      ruta="/clientes"
      puedeEditar={usePuedeEditar()}
      campos={[
        { nombre: 'nombre', etiqueta: 'Nombre del cliente', requerido: true },
        { nombre: 'telefono', etiqueta: 'Teléfono' },
        { nombre: 'direccion', etiqueta: 'Dirección', requerido: true },
        { nombre: 'distrito', etiqueta: 'Distrito', tipo: 'select', opciones: DISTRITOS, requerido: true },
        { nombre: 'punto_referencia', etiqueta: 'Punto de referencia', ayuda: 'Ejemplo: frente a la bodega El Ahorro' },
        { nombre: 'restricciones_acceso', etiqueta: 'Restricciones de acceso', ayuda: 'Ejemplo: calle angosta, solo camioneta' },
        { nombre: 'hora_desde', etiqueta: 'Recibe desde', tipo: 'time' },
        { nombre: 'hora_hasta', etiqueta: 'Recibe hasta', tipo: 'time' },
        { nombre: 'dias_atencion', etiqueta: 'Días de atención (LU,MA,MI,JU,VI,SA,DO)' },
        { nombre: 'ubicacion', etiqueta: 'Ubicación del cliente en el mapa', tipo: 'ubicacion', requerido: true },
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
  return (
    <CrudPage
      titulo="Pedidos"
      ruta="/pedidos"
      borrarTexto="Cancelar"
      puedeEditar={usePuedeEditar()}
      campos={[
        { nombre: 'codigo', etiqueta: 'Código', requerido: true, soloCrear: true },
        { nombre: 'cliente_id', etiqueta: 'Cliente', tipo: 'select', opciones: clientes, numerico: true, requerido: true, soloCrear: true },
        { nombre: 'direccion', etiqueta: 'Dirección (vacío = la del cliente)' },
        { nombre: 'punto_referencia', etiqueta: 'Punto de referencia' },
        { nombre: 'lat', etiqueta: 'Latitud (vacío = la del cliente)', tipo: 'number', paso: 'any' },
        { nombre: 'lng', etiqueta: 'Longitud', tipo: 'number', paso: 'any' },
        { nombre: 'peso_kg', etiqueta: 'Peso (kg)', tipo: 'number', paso: '0.1', requerido: true },
        { nombre: 'volumen_m3', etiqueta: 'Volumen (m³)', tipo: 'number', paso: '0.01' },
        { nombre: 'ventana_inicio', etiqueta: 'Entregar desde (vacío = horario del cliente)', tipo: 'time' },
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

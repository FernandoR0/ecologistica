[← Volver al README Principal](../../README.md)

# Manual de usuario y de administrador

| Campo | Valor |
|---|---|
| Proyecto | EcoLogística - Optimizador de rutas sostenibles de última milla para DistriRápido S.A.C. |
| Organización | DistriRápido S.A.C., Huancayo, Junín |
| Curso | Taller de Proyectos 2, Universidad Continental |
| Versión | 1.2.0 |
| Fecha | 20/11/2026 |
| Elaborado por | Fernando Rodrigo Chaupis Espinoza |

---

## 1. Ingreso

1. Abrir https://ecologistica.vercel.app desde una computadora o un celular.
2. Iniciar sesión con el correo y la contraseña entregados por el administrador.
3. Tras 3 intentos fallidos la cuenta se bloquea 15 minutos; el intento queda registrado en la bitácora.

Cada rol ve solo su menú:

| Pantalla | ADMIN | PLANIFICADOR | CONDUCTOR | AUDITOR |
|---|:-:|:-:|:-:|:-:|
| Dashboard | ✔ | ✔ | | ✔ |
| Rutas | ✔ | ✔ | | Solo lectura |
| Mi ruta | | | ✔ | |
| Pedidos, Flota, Conductores y Clientes | ✔ | ✔ | | |
| Sostenibilidad | ✔ | ✔ | ✔ | ✔ |
| Administración | ✔ | | | Solo lectura y exportación |
| Encuesta SUS | ✔ | ✔ | ✔ | ✔ |

## 2. Planificador

1. **Flota:** registrar cada vehículo con placa, tipo (camioneta, furgón o moto), capacidad en kg y m³, combustible,
   rendimiento, año de fabricación, valor de adquisición y seguros. El sistema calcula el factor de emisión y marca si
   el vehículo está restringido en el Centro de Huancayo (diésel de más de 15 años).
2. **Conductores:** registrar nombre, DNI, licencia y su categoría, experiencia, teléfono, horario disponible, jornada
   máxima, vehículo asignado y, si no sale del depósito, su punto de partida (se busca o se marca en el mapa).
3. **Clientes:** registrar dirección, distrito, punto de referencia, restricciones de acceso, horario en que recibe
   (entre 05:00 y 22:00) y días de atención. Para la ubicación, escribir la dirección o un lugar conocido en **Buscar
   dirección o lugar de referencia**, pulsar **Buscar** y elegir el resultado: el pin se coloca solo y, si la dirección
   y el distrito están vacíos, se proponen. Si el lugar no aparece (por ejemplo, "Mz. C Lote 5"), tocar el mapa; el pin
   se puede arrastrar para ajustarlo.
4. **Pedidos:** elegir el cliente e indicar peso, volumen, prioridad (express, estándar o económico) y tipo de producto.
   El código (PED-0001…) lo asigna el sistema. Si se deja vacía la dirección, la ubicación o la ventana, el pedido toma
   las del cliente. **Cancelar** un pedido que ya está en una ruta la re-optimiza sin él; un pedido entregado no se
   puede cancelar.
5. **Rutas → Generar rutas optimizadas:** el motor (Búsqueda Tabú) asigna los pedidos a los vehículos y muestra en el
   mapa cada ruta con sus tramos coloreados por congestión (verde, amarillo, rojo), las zonas restringidas y de riesgo,
   los límites distritales y los descansos del conductor. Los pedidos que no caben se listan como "sin asignar". Si se
   vuelve a generar, las rutas que aún no salieron se planifican de nuevo junto con los pedidos nuevos; las que ya están
   en reparto no cambian. La pantalla muestra solo las rutas de hoy y las que siguen en curso.
6. **Registrar incidente y re-optimizar:** elegir la ruta, el tipo (tráfico, accidente, bloqueo de vía, clima, avería,
   pedido nuevo o cancelación), la hora (se propone la actual) y, si corresponde, el pedido de la lista, y pulsar
   **Re-optimizar**. Las entregas ya hechas se toman de las que marcó el conductor.
7. **Ver foto:** en la lista de paradas, **📷 Ver foto** muestra la foto con la que el conductor confirmó la entrega.

## 3. Conductor

En **Mi ruta** ve el avance de la ruta ("Entregadas 1 de 4") y la siguiente entrega ("Ahora vas a · 2 de 4") con
dirección, punto de referencia, hora estimada y alertas de tráfico, con texto y botones grandes.

1. **🧭 Cómo llegar a (cliente):** abre Google Maps con la ruta desde donde está el conductor; si se desvía, la ruta se
   recalcula.
2. **📷 Tomar foto de la entrega (opcional):** abre la cámara; la foto se reduce antes de enviarse.
3. **✔ Entregado a (cliente):** aparece la confirmación "Entregado a X a las HH:MM" y la pantalla pasa a la siguiente
   entrega. En la lista, las entregas hechas quedan tachadas con su hora (📷 si tienen foto) y la actual con ➜.

**Sin señal (cortes de luz o zonas sin cobertura):** la aplicación abre igual y muestra la ruta guardada con el aviso
📴. Las entregas (y sus fotos) que se marquen quedan en el celular y se envían solas al volver la señal; mientras tanto
aparece "⏳ entregas pendientes de enviar". Al pulsar **Salir** se borran los datos guardados en el celular, por lo que
conviene salir solo después de que se hayan enviado.

## 4. Sostenibilidad

- Indicadores del día: kilómetros, CO₂, combustible ahorrado (litros y soles), entregas dentro de su ventana, ahorro
  frente a la ruta sin optimizar y árboles equivalentes, con la frase de ahorro del día (por ejemplo, "Has ahorrado S/ 8.22 en combustible hoy").
- **Descargar reporte PDF:** emisiones por ruta, costo del ciclo de vida de la flota, créditos de carbono y meta de
  cero neto para el rango de fechas elegido.
- **Plan de compensación de carbono:** árboles necesarios y costo de bonos; el ADMIN registra las compensaciones
  realizadas.

## 5. Administrador

En **Administración**:

1. **Usuarios:** crear usuarios con su rol, activarlos o desactivarlos (el ADMIN no puede desactivarse a sí mismo).
2. **Parámetros del motor de rutas:** velocidad urbana y de hora punta, factor vial, peso del CO₂, minutos de descarga,
   tiempo máximo del motor, precio del diésel y costo de mantenimiento por km. Se aplican al siguiente plan.
3. **Bitácora de auditoría:** consultar las operaciones y los intentos de acceso; **Exportar CSV** (también disponible
   para el AUDITOR).
4. **Resultados de la encuesta SUS:** puntaje de cada participante y promedio global.

## 6. Encuesta SUS

En **Encuesta SUS** el participante escribe su código (P1, P2…), su perfil, marca las tareas que completó y responde
las 10 afirmaciones de 1 a 5. Cada código responde una sola vez.

## 7. Preguntas frecuentes

- *¿Por qué un pedido quedó "sin asignar"?* No cabe en ningún vehículo por peso o volumen, su ventana es imposible,
  excede la jornada del conductor o está en el Centro y solo hay vehículos restringidos.
- *¿Por qué no puedo desactivar un vehículo, conductor o cliente?* Tiene entregas o pedidos pendientes. El mensaje
  indica qué hacer: registrar una avería en Rutas para repartir sus entregas o cancelar sus pedidos.
- *¿Por qué la primera carga tarda unos segundos?* La API usa un plan gratuito que se suspende tras un tiempo sin uso
  y despierta con la primera petición.

---

## Historial de control de cambios

| Versión | Fecha | Autor | Descripción |
|---|---|---|---|
| 1.0.0 | 13/11/2026 | Fernando Rodrigo Chaupis Espinoza | Versión inicial del manual de usuario |
| 1.1.0 | 20/11/2026 | Fernando Rodrigo Chaupis Espinoza | Manual de usuario y de administrador con las pantallas del Sprint 4: clientes, modo conductor, rol AUDITOR, encuesta SUS y URL de producción |
| 1.2.0 | 20/11/2026 | Fernando Rodrigo Chaupis Espinoza | Mejoras de la prueba de usabilidad SUS: buscador de direcciones, código de pedido automático, cancelación y regeneración de rutas, foto y confirmación de entrega, modo sin conexión y menú para celular |

[← Volver al README Principal](../../README.md)

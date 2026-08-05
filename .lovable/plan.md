# Hogar — App familiar (PWA offline)

App web instalable en Android/iOS que centraliza economía, colegio, tareas, vehículos y viajes de la familia. Todo se guarda en el dispositivo, funciona sin conexión, y la sincronización queda preparada como capa aparte para conectar Google Drive más adelante.

## Filosofía de uso

- Abrir y ver de un vistazo: qué hay hoy, cuánto se gasta esta semana.
- Botón "+" siempre visible: registrar cualquier cosa en menos de 10 segundos.
- Nada de listas infinitas: tarjetas resumidas con acceso al detalle.

## Estructura de la app

Barra inferior con 5 destinos y un botón central de añadido rápido:

```text
[ Inicio ]  [ Finanzas ]  ( + )  [ Colegio ]  [ Más ]
                                              └ Hogar · Vehículos · Viajes · Ajustes
```

El botón "+" abre una hoja de acciones contextual: Gasto · Recordatorio · Tarea · Nota de viaje.

## Dashboard (pantalla de inicio)

Saludo + fecha, y tarjetas en este orden:

1. HOY — recordatorios y eventos del día, marcables con un toque.
2. ESTA SEMANA — contadores (7 recordatorios, 3 tareas hogar) que abren su módulo.
3. GASTOS ESTA SEMANA — líneas con concepto e importe y total destacado.
4. GASTOS DEL MES — ingresos, gastos y balance.
5. PRÓXIMOS VIAJES — destino y cuenta atrás.
6. TRABAJOS PENDIENTES — proyectos del hogar en curso.

Cada tarjeta se puede ocultar o reordenar desde Ajustes.

## Módulos

### Finanzas (planificación, no contabilidad)
- Movimiento: importe, categoría, fecha, periodicidad (único, mensual, trimestral, semestral, anual), tipo (gasto/ingreso), vínculo opcional a hijo o vehículo.
- Categorías precargadas y editables: Vivienda, Impuestos, Coche, Suscripciones, Colegio, Cumpleaños, Otros.
- La app expande automáticamente las periodicidades y calcula semana, mes y próximos 30 días.
- Vistas: resumen (barras por categoría), calendario de vencimientos, listado filtrable.

### Colegio (multi-hijo)
- Selector de hijo arriba; cada hijo mantiene su propio espacio: horario semanal, extraescolares, tutor y clase, material, excursiones, comedor, recordatorios y calendario.
- Vista "Semana de Mario": día a día con horas y avisos ("viernes: traer flauta").
- Los gastos escolares se crean desde aquí y aparecen en Finanzas.

### Recordatorios (base única transversal)
- Un solo almacén con etiqueta de ámbito: hogar, hijo, vehículo, trabajo, personal.
- Repetición opcional, hora, y aviso del navegador cuando el usuario lo autoriza.
- El mismo recordatorio se muestra en Dashboard y en la pantalla de su módulo.

### Hogar (tablero tipo Trello simple)
- Columnas: Ideas · Pendiente · En proceso · Finalizado.
- Tarjeta de proyecto: título, notas, presupuesto, enlaces/tienda, fecha objetivo.
- En móvil se navega por pestañas de estado con arrastre entre columnas.

### Vehículos
- Ficha por vehículo: matrícula, marca/modelo.
- Bloques con fecha de vencimiento: seguro, ITV, revisión, neumáticos, impuesto de circulación.
- Cada vencimiento genera recordatorio y, si tiene importe, un gasto previsto.

### Viajes
- Viaje: destino, fechas, hotel, presupuesto.
- Dentro: pendientes, ideas y gastos asociados.
- Cuenta atrás visible en el Dashboard.

## Datos y arquitectura

- Modelo de entidades reutilizables: `Persona`, `Vehículo`, `Categoría`, `Movimiento`, `Recordatorio`, `Tarea`, `Proyecto`, `Viaje`. Recordatorios, tareas y movimientos apuntan a cualquier entidad mediante un vínculo genérico (tipo + id), lo que permite añadir módulos nuevos sin tocar el núcleo.
- Almacenamiento local en el dispositivo (IndexedDB mediante Dexie), equivalente web de SQLite: acceso instantáneo y offline total.
- Capa de repositorios: la interfaz de usuario nunca habla con la base de datos directamente, así el motor de almacenamiento es sustituible.
- Capa de sincronización desacoplada, definida como interfaz `SyncProvider` (exportar/importar JSON completo con marca de tiempo y resolución por versión). Se incluye el proveedor "Solo local" activo y el punto de enchufe listo para Google Drive, iCloud, Dropbox, OneDrive o servidor propio, sin cambiar la lógica de negocio.
- Exportar/Importar copia de seguridad JSON manual desde Ajustes, ya disponible en esta versión.
- Instalable en el móvil (manifiesto e iconos) y funcionamiento sin conexión.

## Detalles técnicos

- React + TanStack Router, Tailwind, shadcn/ui.
- Dexie sobre IndexedDB; esquema versionado con migraciones.
- Zustand o React Query para estado derivado; cálculos de finanzas en funciones puras testeables.
- PWA: manifiesto + service worker con caché del app shell (siguiendo la guía interna de PWA; no se registra en la vista previa del editor).
- Notificaciones locales mediante la API de notificaciones del navegador.
- Sin backend en esta fase: no se activa Lovable Cloud.

## Ampliaciones futuras (previstas en el diseño)

- Sincronización real con Google Drive y otros proveedores.
- Calendario compartido e integración con Google/Apple Calendar.
- Resumen semanal e detección de gastos recurrentes con IA.
- Multiusuario familiar y adjuntos (fotos de facturas, presupuestos).

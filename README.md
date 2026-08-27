# Family Hub Daily

Actúa como un arquitecto de software senior especializado en aplicaciones móviles familiares. Diseña una aplicación multiplataforma (Android e iOS) cuyo objetivo sea centralizar la gestión del hogar. La aplicación debe seguir un enfoque modular, priorizar la simplicidad, la rapidez de uso y el funcionamiento offline. Los datos se almacenarán localmente y la sincronización debe ser opcional y desacoplada del almacenamiento local, permitiendo usar Google Drive inicialmente y poder sustituirlo en el futuro por iCloud, Dropbox, OneDrive o un servidor propio sin modificar la lógica de negocio. Diseña una arquitectura escalable basada en entidades reutilizables, con un Dashboard que muestre los gastos previstos de la semana y del mes, los recordatorios de hoy y de la semana, las tareas pendientes y los próximos eventos. Incluye los módulos de Finanzas, Colegio (con soporte para varios hijos), Tareas del Hogar, Vehículos y Viajes. Para cada módulo define los casos de uso, entidades, relaciones, flujos de navegación, estructura de pantallas, experiencia de usuario y posibles ampliaciones futuras. La interfaz debe estar pensada para un uso diario, permitiendo registrar cualquier información en menos de 10 segundos y ofreciendo una visión clara de la situación familiar.

Concepto

Una aplicación móvil de gestión familiar que centraliza economía, organización, tareas, proyectos del hogar, viajes e información importante en un único lugar, priorizando rapidez de uso, sincronización entre dispositivos y visión semanal.

La filosofía sería:

Abrir la app en menos de 2 segundos.

Ver qué tengo que hacer hoy.

Ver cuánto dinero voy a gastar esta semana.

Añadir algo en menos de 10 segundos.

No más.

Módulos

1. Dashboard

Sería la pantalla principal.

No quiero listas enormes.

Algo parecido a:

Buenos días, Carlos

HOY

---------------------

✓ Llevar uniforme

✓ Dentista 18:30

✓ Pagar comedor

ESTA SEMANA

---------------------

7 recordatorios

3 tareas hogar

GASTOS ESTA SEMANA

---------------------

Hipoteca      820€

Colegio       190€

Gasolina       60€

Amazon         34€

Total: 1104€

GASTOS DEL MES

---------------------

Ingresos

Gastos

Balance

PRÓXIMOS VIAJES

---------------------

Madrid (15 días)

TRABAJOS PENDIENTES

---------------------

Cambiar grifo cocina

Pintar habitación

2. Finanzas

No sería una contabilidad.

Sería una planificación.

Ejemplos:

Vivienda (Hipoteca, Seguro de hogar, , Agua, Luz, Gas)

Impuestos (IBI, IVTM, Impuesto Basuras)

Coche (Seguro, ITV, Revisión)

Suscripciones (Netflix, Amazon)

Colegio (Enseñanza, Comedor, Uniforme, Libros, Extraescolares, Beca)

Cumpleaños

Cada gasto tendría:

importe

categoría

fecha

periodicidad

Único

Mensual

Trimestral

Semestral

Anual

La app calcula automáticamente:

gastos semana

gastos mes

gastos próximos 30 días

3. Colegio

Aquí creo que puedes diferenciarte mucho.

Entidad Niño.

Niño 1

Horario

Extraescolares

Tutor

Clase

Material

Excursiones

Comedor

Recordatorios

Calendario

Cada niño completamente separado.

Ejemplo:

Mario

Lunes

8:30 Colegio

17:00 Inglés

Martes

Fútbol

Viernes

Traer flauta

4. Recordatorios

Todos los recordatorios en una sola base. Después se clasifican por:

hogar

niño1

niña2

coche1

coche2

trabajo

personal

Así una notificación puede aparecer tanto en Dashboard como en Colegio.

5. Hogar

Aquí haría algo tipo Trello muy sencillo.

Estados:

Ideas

Pendiente

En proceso

Finalizado

Ejemplo

Cambiar ventanas

Presupuesto Leroy Merlin

Pendiente

o

Instalar aire acondicionado

Idea

6. Viajes

Muy ligero.

Destino

Fechas

Hotel

Pendientes

Ideas

Presupuesto

Ejemplo:

Londres

Comprar entradas Harry Potter

Pendiente

7. Vehículos

Otro módulo independiente.

Seguro

ITV

Revisión

Neumáticos

Impuesto circulación

Todo con recordatorios.

Tecnologías

Yo intentaría que desde el primer día fuera multiplataforma.

Flutter

Es probablemente la mejor opción.

Ventajas:

Android

iPhone

Web (si algún día quieres)

Muy rápido

Un único código

Base de datos

No usaría Google Drive como base de datos.

Usaría:

SQLite local

Y encima sincronización.

Sincronización

Aquí sí usaría Google Drive.

La idea:

SQLite

↓

JSON

↓

Google Drive

Cada cierto tiempo:

Base local

↓

Exporta JSON

↓

Google Drive

↓

Otro móvil

↓

Descarga JSON

↓

Actualiza SQLite

Así:

funciona offline

muy rápido

el usuario es dueño de sus datos

no necesitas servidores

no pagas hosting

Funciones futuras

- Calendario compartido.

- Integración con Google Calendar o Calendar de Iphone

- IA que resuma la semana o detecte gastos recurrentes.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://home-ax4-life.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6b5f005c-0e25-469f-b91b-695fbc7be8b2).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

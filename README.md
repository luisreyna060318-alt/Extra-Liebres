# Sistema de Actividades Extraescolares - ITCJ

Reescritura completa del sistema original (PHP multipagina + MySQL) como una
**SPA en React** que consume una **API REST en Node.js/Express/TypeScript**,
respaldada por **PostgreSQL**. El codigo PHP original se conserva sin cambios
en [`legacy-php/`](legacy-php) unicamente como referencia historica; ya no se
usa en produccion.

## Arquitectura

```
extra-liebres/
├── backend/            API REST (Node.js + Express + TypeScript + Prisma)
├── frontend/           SPA (React + TypeScript + Vite)
├── legacy-php/         Sistema original en PHP (solo referencia, no usar)
└── docker-compose.yml  PostgreSQL + Adminer + backend + frontend
```

### Backend (`backend/`)

- **Express + TypeScript**, organizado por modulos de dominio (arquitectura
  "feature-first"): `alumnos`, `carreras`, `promotores`, `semestres`,
  `extraescolares`, `grupos`, `alumnosGrupo` (inscripciones) y `busqueda`
  (reportes).
- Cada modulo sigue el patron `routes -> controller -> service -> Prisma`,
  con validacion de entrada con **Zod** y manejo de errores centralizado.
- **Prisma ORM** sobre PostgreSQL (`prisma/schema.prisma`), con migraciones
  versionadas.
- La logica de negocio original se preservo intencionalmente:
  - Generacion automatica de IDs (`idextraescolar`, `idsemestre`, `idgrupo`,
    `idcarrera`) con el mismo formato del sistema legado (ver
    `src/utils/idGenerators.ts`).
  - Reglas de validacion (dias/horarios de grupo, pares mes-inicio/mes-termino
    de semestre, escala de calificacion 0-4 -> desempeno).
  - Semestres solo admiten alta y baja (no edicion), igual que el original.
- **Paginacion real** en todos los listados (`GET /alumnos`, `/promotores`,
  `/semestres`, `/extraescolares`, `/grupos`, `/carreras`): aceptan
  `?page=&pageSize=` y devuelven `{ data, total, page, pageSize }` en vez de
  un arreglo plano. Necesario porque el sistema real tiene 1804 alumnos —
  antes solo se podian ver los primeros 15/100 sin forma de saber cuantos
  habia en total.
- **Borrado con advertencia explicita**: los endpoints `DELETE` cuyo borrado
  tiene efectos secundarios (cascada hacia `grupo`/`alumnosgrupo`, o
  desvinculacion de `grupo.idsemestre`) aceptan `?confirmar=true`. Sin ese
  parametro, si hay registros afectados, responden `409` con el detalle
  exacto del impacto (`{ error, details: { requiereConfirmacion, ... } }`)
  en vez de borrar en silencio. Ver `src/utils/confirmarBorrado.ts` y la
  seccion "Politica de borrado" mas abajo.
- **Sin condicion de carrera al generar IDs**: `generarIdExtraescolar`,
  `generarIdCarrera` y `generarIdGrupo` calculan el siguiente numero leyendo
  la tabla (no hay secuencia de Postgres de por medio), asi que dos altas
  simultaneas pueden calcular el mismo candidato. `src/utils/retry.ts`
  reintenta automaticamente la operacion completa (recalcular ID + insertar)
  cuando la insercion choca contra la restriccion UNIQUE (error `P2002`),
  de forma transparente para quien hizo la solicitud. Verificado con una
  prueba de integracion que dispara 5 altas concurrentes reales.
- **`GET /api/health` verifica la base de datos** (`SELECT 1` via Prisma) y
  responde `503` si Postgres no responde, en vez de solo confirmar que el
  proceso de Express sigue vivo.
- **Filtros combinados y exportacion CSV en Alumnos**: `GET /api/alumnos`
  acepta `idcarrera`, `campus` y `sexo` ademas de `search` (todos
  combinables); `GET /api/alumnos/export` devuelve los mismos resultados
  (sin paginar, hasta 10,000 filas) como CSV con BOM UTF-8 para que Excel
  muestre bien los acentos.

### Frontend (`frontend/`)

- **React 18 + TypeScript + Vite**, enrutado con **React Router**.
- Organizado tambien por caracteristica (`src/features/<entidad>`), cada una
  con su propio `api.ts` (llamadas HTTP), `hooks.ts` (React Query) y
  componentes de UI.
- **TanStack Query** para cache/sincronizacion de datos del servidor.
- **Bootstrap 5** para mantener una apariencia consistente con el sistema
  original, y **react-select** (`AsyncSelect`) como reemplazo moderno de
  Select2 para los combos con busqueda remota (extraescolar, promotor,
  semestre, grupo).
- Rutas: `/`, `/alumnos`, `/carreras`, `/promotores`, `/semestres`,
  `/extraescolares`, `/grupos`, `/busqueda`, `/busqueda/alumno`,
  `/busqueda/grupo`, `/gestionar-alumnos-grupo` (`/carreras` es nueva; el
  resto mapea 1:1 desde la navegacion original).
- Paginacion visible en las 5 tablas principales (`components/ui/Pagination`)
  y un modal de confirmacion (`components/ui/ConfirmDialog`) que reemplaza
  `window.confirm()` para los borrados con efectos secundarios, mostrando el
  mensaje de impacto real que calcula el backend antes de continuar.
- **Notificaciones flotantes (toasts)** en vez de un `<Alert>` fijo arriba de
  cada pagina: `lib/ToastContext.tsx` expone `useToast().showToast(tipo,
  mensaje)`, y `components/ui/ToastStack.tsx` las dibuja fijas arriba a la
  derecha con autodesvanecido (5s). Las 6 paginas con alta/edicion/borrado
  la usan de forma consistente.
- **Alumnos**: filtros combinados (carrera, campus, sexo, ademas del texto
  libre) y un boton "Exportar CSV" que abre `/api/alumnos/export` con los
  mismos filtros activos (descarga nativa del navegador, sin JS adicional).

### Base de datos

El esquema (`backend/prisma/schema.prisma`) se tradujo a PostgreSQL a partir
del volcado MySQL/phpMyAdmin real del sistema original
(`backend/prisma/legacy/extraliebresdb.sql`):

- `alumno`, `carrera`, `promotor`, `semestre`, `extraescolar`, `grupo`,
  `alumnosgrupo` (tabla de enlace alumno-grupo con calificacion/desempeno).
  `carrera` es una tabla nueva que no existia en el sistema original (ahi
  `alumno.carrera` era texto libre); se agrego para evitar inconsistencias
  de captura ("Ing. Industrial" vs "ING. INDUSTRIAL") y poder dar de
  alta/baja carreras sin tocar codigo. `alumno.idcarrera` es ahora una FK.
- Enumeraciones nativas de Postgres para `sexo`, `campus` y los dias de la
  semana. `sexo` es opcional (`Sexo?`) porque en los datos reales hay alumnos
  con ese campo en blanco.
- `nocontrol` se guarda como texto (no como entero) para ser consistente con
  el resto de las llaves de negocio del sistema (`rfc`, `idextraescolar`,
  `idsemestre`, `idgrupo`, `idcarrera`), todas string; el valor numerico
  original se conserva sin cambios, solo cambia el tipo de columna.
- Llaves foraneas explicitas `grupo -> semestre/extraescolar/promotor`,
  `alumno -> carrera` y `alumnosgrupo -> alumno/grupo` (antes solo se
  validaban en PHP).
- **`CHECK` constraint** en `alumnosgrupo.calificacion` (0-4) directamente en
  Postgres, ademas de la validacion en Zod — protege contra cualquier
  escritura que no pase por la API (script, correccion manual).
- **Indices trigram (`pg_trgm`)** en `alumno`/`promotor` (`nombre`,
  `appaterno`, `apmaterno`) para que las busquedas `ILIKE`/`contains` de los
  listados no dependan de un *sequential scan* conforme crece la tabla.

### Politica de borrado

No todos los borrados se comportan igual, segun que tan reversible/grave es
el efecto secundario:

| Entidad | Si tiene dependientes... | Se puede forzar? |
| --- | --- | --- |
| `grupo` | Borra en cascada sus `alumnosgrupo` (calificaciones) | Si, con `?confirmar=true` |
| `alumno` | Borra en cascada su historial en `alumnosgrupo` | Si, con `?confirmar=true` |
| `promotor` | Borra en cascada sus `grupo` (y las inscripciones de esos grupos) | Si, con `?confirmar=true` |
| `extraescolar` | Igual que `promotor` | Si, con `?confirmar=true` |
| `semestre` | Desvincula (`SET NULL`) sus `grupo.idsemestre`, no borra nada | Si, con `?confirmar=true` |
| `carrera` | **Se bloquea siempre** si tiene alumnos asignados | **No** — no existe bypass |

La diferencia con `carrera` es deliberada: cascadear hacia `grupo` o
`alumnosgrupo` borra registros operativos/de inscripcion, pero cascadear
desde `carrera` implicaria borrar **alumnos** (personas), asi que ahi se
prefiere bloquear sin excepcion y pedir reasignar el alumno primero.

El flujo completo (`DELETE` sin confirmar -> `409` con el detalle -> el
usuario ve el mensaje real en un modal -> `DELETE` de nuevo con
`?confirmar=true`) esta implementado una sola vez en
`frontend/src/lib/apiClient.ts` (`getImpactoConfirmacion`) +
`frontend/src/components/ui/ConfirmDialog.tsx`, y cada pagina lo reutiliza.

### Carga de datos reales (`extraliebresdb.sql`)

`backend/prisma/import-legacy.ts` parsea directamente el dump SQL original
(sin necesidad de MySQL) y carga su contenido en PostgreSQL via Prisma:

```bash
docker compose exec backend npm run prisma:import-legacy
# o, sin Docker:
cd backend && npm run prisma:import-legacy
```

Este script **borra el contenido actual de las 7 tablas** y las vuelve a
llenar desde `prisma/legacy/extraliebresdb.sql`, por lo que es seguro
correrlo mas de una vez (idempotente). Ademas de las 6 tablas originales,
**deriva el catalogo `carrera`** a partir de los valores distintos de
`alumno.carrera` en el dump (16 carreras reales, ya bien capturadas, sin
typos) y liga cada alumno por `idcarrera` en vez de guardar el texto suelto.
Tambien normaliza otras particularidades del dato legado: campos vacios
(`''`) se guardan como `NULL`, `CAMPUS 1`/`CAMPUS 2` se mapean a
`CAMPUS_1`/`CAMPUS_2`, y el dump divide la tabla `alumno` en varios `INSERT`
(el parser los concatena todos). Con el archivo actual carga 1804 alumnos,
16 carreras, 25 promotores, 46 actividades extraescolares, 34 grupos y 1
semestre (la tabla `alumnosgrupo` viene vacia en el dump).

`backend/prisma/seed.ts` sigue existiendo por separado como datos de
ejemplo minimos para desarrollo (no se ejecuta junto con la carga real).

### Autenticacion

El sistema original no tenia ningun mecanismo de autenticacion (se confirmo
que ninguna pagina PHP validaba sesion/usuario). Siguiendo lo acordado, esta
version tampoco la incluye. **Antes de exponer esta aplicacion fuera de una
red confiable, se recomienda agregar autenticacion** (por ejemplo JWT +
bcrypt) ya que maneja datos de alumnos.

## Requisitos previos

- Node.js 18 o superior y npm
- PostgreSQL 14+ (local) **o** Docker + Docker Compose

## Puesta en marcha con Docker (recomendado)

```bash
docker compose up --build
```

Esto levanta PostgreSQL, Adminer (`http://localhost:8080`), la API
(`http://localhost:4000`) y el frontend (`http://localhost:5173`). Antes del
primer arranque, corre las migraciones y carga los datos reales del sistema
original:

```bash
docker compose exec backend npm run prisma:deploy
docker compose exec backend npm run prisma:import-legacy
```

## Puesta en marcha manual (sin Docker)

### 1. Base de datos

Crea una base PostgreSQL vacia, por ejemplo:

```sql
CREATE DATABASE extraliebresdb;
CREATE USER extraliebres WITH PASSWORD 'extraliebres';
GRANT ALL PRIVILEGES ON DATABASE extraliebresdb TO extraliebres;
```

### 2. Backend

```bash
cd backend
copy .env.example .env      # en PowerShell: Copy-Item .env.example .env
# edita .env con tu cadena de conexion si es distinta
npm install
npm run prisma:migrate      # crea las tablas
npm run prisma:import-legacy # carga los datos reales de extraliebresdb.sql
npm run dev                 # API en http://localhost:4000
```

### 3. Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev                 # SPA en http://localhost:5173
```

## Scripts utiles

| Backend                    | Descripcion                              |
| --------------------------- | ----------------------------------------- |
| `npm run dev`                | Servidor con recarga en caliente         |
| `npm run build` / `start`    | Compila a `dist/` y lo ejecuta            |
| `npm run prisma:studio`      | Explorador visual de la base de datos     |
| `npm run prisma:migrate`     | Crea/aplica una migracion en desarrollo   |
| `npm run prisma:seed`        | Carga datos de ejemplo minimos            |
| `npm run prisma:import-legacy` | Borra y recarga los datos reales desde `extraliebresdb.sql` |
| `npm test`                   | Corre la suite de Vitest (unitarias + integracion, requiere `extraliebresdb_test`) |
| `npm run test:watch`         | Igual, en modo watch                      |

| Frontend            | Descripcion                    |
| -------------------- | -------------------------------|
| `npm run dev`         | Servidor de desarrollo Vite    |
| `npm run build`       | Build de produccion en `dist/` |
| `npm run preview`     | Sirve el build de produccion   |

## Endpoints principales de la API

Todos bajo el prefijo `/api`. Ver el codigo en `backend/src/modules/*` para
el detalle de cada uno. Los `GET` de listado aceptan `?search=&page=&pageSize=`
y devuelven `{ data, total, page, pageSize }`; los `DELETE` con efectos
secundarios aceptan `?confirmar=true` (ver "Politica de borrado").

- `GET/POST /alumnos`, `GET/PUT/DELETE /alumnos/:nocontrol` (filtros extra:
  `idcarrera`, `campus`, `sexo`)
- `GET /alumnos/export` (CSV, mismos filtros, sin paginar)
- `GET/POST /carreras`, `GET/PUT/DELETE /carreras/:idcarrera` (borrado
  siempre bloqueado si hay alumnos asignados, sin `?confirmar=true`)
- `GET/POST /promotores`, `GET/PUT/DELETE /promotores/:rfc`
- `GET/POST /semestres`, `GET/DELETE /semestres/:idsemestre` (sin edicion)
- `GET/POST /extraescolares`, `GET/PUT/DELETE /extraescolares/:idextraescolar`
- `GET/POST /grupos`, `GET/PUT/DELETE /grupos/:idgrupo`
- `GET/POST/DELETE /grupos/:idgrupo/alumnos` (roster, inscripcion masiva, baja masiva)
- `GET /busqueda/alumnos/:nocontrol/extraescolares` (historial de un alumno)
- `GET /health` (`{ status, database, timestamp }`, `503` si Postgres no responde)

## Estado de verificacion

Este proyecto ya se compilo y se probo de punta a punta con `docker compose
up --build` (backend, frontend, PostgreSQL y Adminer), incluyendo:

- `tsc` sin errores en `backend/` y `frontend/`, y `vite build` de produccion.
- Migracion inicial generada y aplicada (`backend/prisma/migrations/`).
- Carga completa de `backend/prisma/legacy/extraliebresdb.sql` via
  `prisma:import-legacy`, verificada con `SELECT COUNT(*)` directo en
  Postgres: 1804 alumnos, 25 promotores, 46 actividades extraescolares, 34
  grupos y 1 semestre (coincide exactamente con el dump original).
- Pruebas manuales en el navegador con los datos reales ya cargados: listado
  y busqueda de alumnos (incluyendo uno con `sexo` en blanco, mostrado como
  "—"), busqueda de actividades/promotores/grupos en los combos
  `AsyncSelect`, "Ver roster" de un grupo, y generacion automatica de un
  nuevo id de actividad extraescolar (`47-...`) a partir del maximo real
  (46) — luego revertida para no dejar datos de prueba mezclados con los
  reales.
- Llamadas directas a la API (`/api/alumnos`, `/api/grupos`,
  `/api/grupos/:idgrupo/alumnos`, `/api/busqueda/alumnos/:nocontrol/...`)
  devolviendo los datos esperados.

Durante esa verificacion se corrigieron problemas que solo aparecen al
compilar/ejecutar de verdad (no se detectan solo leyendo el codigo):

1. **Tipos de Zod vs. Prisma**: los esquemas con `.refine()`/`.superRefine()`
   (grupos, promotores, semestres) generan `ZodEffects`, no `ZodObject`; el
   middleware `validate()` solo aceptaba `AnyZodObject`. Se amplio a
   `ZodTypeAny`. Los enums validados por Zod (`sexo`, `campus`, `primerdia`,
   `segundodia`) tambien necesitan un cast explicito al tipo del enum de
   Prisma al hacer `create`/`update`.
2. **Prisma + Alpine**: la imagen `node:20-alpine` no trae las librerias de
   OpenSSL que el motor de Prisma necesita en tiempo de ejecucion. Se agrego
   `RUN apk add --no-cache openssl` en el `Dockerfile` del backend y
   `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]` en
   `schema.prisma`. Tambien se movieron `prisma` y `tsx` a `dependencies`
   (antes eran `devDependencies`) porque el contenedor de produccion
   necesita ambos para correr migraciones y el seed con
   `docker compose exec backend ...`.
3. **`INSERT` partido en el dump**: phpMyAdmin divide los volcados grandes
   en varios `INSERT INTO` por tabla — la tabla `alumno` del archivo real
   viene en 4 bloques separados. La primera version del parser solo leia el
   primer bloque (526 de 1804 alumnos); se corrigio para recorrer todas las
   ocurrencias de `INSERT INTO` por tabla y concatenar sus filas.

### Segunda ronda: modulo de Carreras, paginacion, borrado con advertencia

Tras una auditoria completa (integridad de datos, seguridad, UX, backend),
se implemento y **volvio a probar de punta a punta con Docker**:

- Migracion regenerada desde cero (`prisma migrate diff` + edicion manual,
  ya que `prisma migrate dev` no corre en un `docker exec` sin TTY) para
  incluir la tabla `carrera`, el `CHECK` de `calificacion` y los indices
  `pg_trgm`. Verificado con `\d alumnosgrupo` y `pg_indexes` en `psql`.
- **Pagina de Carreras** completa (alta/edicion/borrado/busqueda) probada en
  el navegador con las 16 carreras reales derivadas del dump.
- **Selector de carrera en el formulario de Alumnos**: probado que
  precarga la carrera correcta al editar (`AsyncSelect` con `value`
  controlado) y que el nuevo `idcarrera` se guarda bien.
- **Paginacion real** verificada en Alumnos (1804 registros -> "Mostrando
  1-20 de 1802" tras dos borrados de prueba, "Pagina 1 de 91") y en Grupos.
- **Flujo de borrado con advertencia**, probado tanto por API como en el
  navegador (capturas del modal incluidas durante la sesion): alumno con
  1 inscripcion -> `409` con el mensaje exacto -> modal de confirmacion ->
  reintento con `?confirmar=true` -> borrado exitoso y cascada verificada
  (`GET` del roster del grupo bajo de 1 a 0 inscripciones). Repetido para
  `grupo`, `promotor` (5 grupos, 0 inscripciones) y `semestre` (33 grupos
  quedarian sin semestre). Confirmado que `carrera` **bloquea siempre** sin
  aceptar `?confirmar=true` cuando tiene alumnos asignados.
- Se corrigio un bug real detectado en este ciclo: `ApiError.conflict()`
  no aceptaba un segundo argumento (`details`), necesario para adjuntar el
  detalle de impacto en los nuevos `409`; se le agrego como parametro
  opcional.
- Despues de probar los borrados (que alteran datos), se volvio a correr
  `prisma:import-legacy` para dejar la base exactamente como la entrega el
  dump original antes de apagar los contenedores (`docker compose down`).

### Tercera ronda: se cerraron todos los pendientes salvo autenticacion

Los puntos que la segunda ronda dejo abiertos ya se implementaron y se
verificaron con **pruebas automatizadas reales** (no solo manuales):

1. **Condicion de carrera en generacion de IDs** — resuelta con
   `src/utils/retry.ts` (reintento transparente ante `P2002`). Verificada
   con una prueba de integracion que dispara 5 `POST /api/extraescolares`
   simultaneos: los 5 tienen exito con IDs distintos.
2. **`/api/health`** ahora corre `SELECT 1` contra Postgres y responde `503`
   si la base no contesta.
3. **Filtros combinados + exportar CSV** en Alumnos (`idcarrera`, `campus`,
   `sexo`, ademas del texto libre).
4. **Toasts** reemplazando el `<Alert>` fijo en las 6 paginas con
   alta/edicion/borrado.
5. **Suite de pruebas automatizadas** (backend, `npm test` con **Vitest**):
   - **53 pruebas**, 8 archivos: unitarias puras (generadores de ID,
     `calificacionADesempeno`, `exigirConfirmacionSiHayImpacto`, el
     reintento ante ID duplicado) y de validacion Zod (reglas de horario de
     grupo, pares mes-inicio/mes-termino de semestre, `sexo` opcional de
     alumno).
   - **Pruebas de integracion reales**: levantan `createApp()` y le pegan
     peticiones HTTP (via `supertest`) contra una base de datos Postgres
     **separada** (`extraliebresdb_test`, nunca la de datos reales),
     cubriendo paginacion, validacion de FK carrera->alumno, el flujo
     completo de borrado con confirmacion (`alumno` y `grupo`), el bloqueo
     sin excepcion de `carrera`, y la concurrencia de generacion de IDs.
   - Para correrlas: crea la base `extraliebresdb_test` una vez
     (`CREATE DATABASE extraliebresdb_test;` en el mismo Postgres) y aplica
     las migraciones con `DATABASE_URL` apuntando a ella
     (`npx prisma migrate deploy`). Luego `npm test` (usa `.env.test` si
     `DATABASE_URL` no esta ya definido en el entorno).

**Autenticacion sigue sin implementarse — a proposito.** Fue una decision
explicita tomada al inicio del proyecto ("sin autenticacion por ahora") y
no es un defecto a corregir por si solo; agregarla (login, JWT, proteger
rutas) es un cambio de alcance que conviene decidir aparte, no colar como
parte de "terminar pendientes". Sigue en el radar dado que la base ya tiene
datos reales de 1804 alumnos.

Si vuelves a levantar el proyecto en una maquina distinta y algo falla, es
casi seguro un tema de entorno (variables de `.env`, version de Docker,
puertos ocupados) y no del codigo en si.

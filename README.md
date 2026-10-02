# Sistema de Actividades Extraescolares — ITCJ

Sistema para administrar las actividades extraescolares del Instituto
Tecnológico de Ciudad Juárez: catálogos (carreras, promotores, semestres,
actividades), grupos, alumnos, inscripción de alumnos a grupos con su
calificación y consultas (historial de un alumno, roster de un grupo).

Es la reescritura del sistema original en PHP multipágina + MySQL como una
**SPA en React** que consume una **API REST en Node.js/Express/TypeScript**
respaldada por **PostgreSQL**.

> **Importante: la aplicación no tiene autenticación** (decisión de alcance:
> "sin autenticación por ahora"). Cualquiera que llegue a la aplicación puede
> ver, exportar, modificar y borrar los datos de los alumnos. Por eso Docker
> Compose publica todo **solo en `127.0.0.1`** (esta máquina). No la expongas
> a una red sin antes agregar autenticación y HTTPS (ver
> [Seguridad y despliegue](#seguridad-y-despliegue)).

## Contenido del repositorio

```
extra-liebres/
├── backend/             API REST (Express + TypeScript + Prisma)
│   ├── prisma/          esquema, migraciones, seed sintético e importación del sistema anterior
│   └── src/             módulos por dominio (routes → controller → service → Prisma)
├── frontend/            SPA (React + TypeScript + Vite) y configuración de nginx
├── scripts/respaldos/   respaldo y restauración de la base (los usa el servicio "respaldos")
├── docs/                historial de desarrollo
├── .github/workflows/   integración continua
├── docker-compose.yml   PostgreSQL + API + frontend (nginx) + respaldos (+ Adminer opcional)
└── .env.example         variables de Docker Compose
```

## Puesta en marcha con Docker (recomendada)

Requisitos: Docker Desktop (o Docker Engine + Compose v2).

1. **Variables.** Copia el archivo de ejemplo y cambia la contraseña:

   ```bash
   cp .env.example .env            # PowerShell: Copy-Item .env.example .env
   ```

   Usa una contraseña de letras, números, `-` y `_` (va dentro de la URL de
   conexión). **Si ya tenías el volumen `pgdata`** de una versión anterior, la
   contraseña real es con la que se creó (antes era `extraliebres`): pon esa
   en `.env` o cámbiala dentro de la base con
   `ALTER USER extraliebres WITH PASSWORD '...';`.

2. **Levantar.**

   ```bash
   docker compose up -d --build
   ```

   Esto levanta PostgreSQL, la API (aplica sola las migraciones pendientes al
   arrancar), el frontend en <http://localhost:5173> y el servicio de
   respaldos. El navegador solo habla con nginx; nginx reenvía `/api` a la API.

3. **Datos.** La base empieza vacía. Para tener datos:
   - reales: ver [Carga de datos del sistema anterior](#carga-de-datos-del-sistema-anterior);
   - de ejemplo (ficticios): `docker compose exec backend npm run prisma:seed`
     (se niega a correr si la base ya tiene alumnos reales).

Opcional:

- **Adminer** (explorador de la base, solo desarrollo):
  `docker compose --profile dev up -d adminer` → <http://localhost:8080>,
  servidor `db`.
- **Abrir el frontend a otros equipos**: `FRONTEND_IP=0.0.0.0` en `.env`.
  Hazlo solo dentro de una red controlada: no hay autenticación.

## Puesta en marcha manual (sin Docker)

Requisitos: Node.js 22 LTS (o 20 en adelante), npm y PostgreSQL 14+.

### 1. Base de datos

```sql
CREATE USER extraliebres WITH PASSWORD 'extraliebres';
-- La base debe pertenecer al usuario: en PostgreSQL 15+ un GRANT sobre la
-- base no basta para crear tablas en el esquema public.
CREATE DATABASE extraliebresdb OWNER extraliebres;
CREATE DATABASE extraliebresdb_test OWNER extraliebres;  -- solo para las pruebas
```

### 2. Backend

```bash
cd backend
cp .env.example .env         # PowerShell: Copy-Item .env.example .env
npm ci
npm run prisma:deploy        # crea las tablas (aplica las migraciones)
npm run prisma:seed          # opcional: datos de ejemplo ficticios
npm run dev                  # API en http://localhost:4000
```

Usa `prisma:deploy` (no `prisma:migrate`) para instalar: `prisma:migrate`
(`prisma migrate dev`) es para **crear** migraciones nuevas al cambiar el
esquema.

### 3. Frontend

```bash
cd frontend
npm ci
npm run dev                  # SPA en http://localhost:5173
```

En desarrollo Vite reenvía `/api` a `http://localhost:4000` (cámbialo con la
variable `API_PROXY_TARGET`), así que no hace falta configurar la URL de la API.

## Carga de datos del sistema anterior

`backend/prisma/import-legacy.ts` lee el volcado de MySQL/phpMyAdmin
(`backend/prisma/legacy/extraliebresdb.sql`, **no versionado** porque contiene
datos personales reales) y lo carga en PostgreSQL:

- Primero lee y valida **todo** el volcado; si algo no cuadra, se detiene sin
  tocar la base.
- **Reemplaza** el contenido de las 7 tablas, incluidas las inscripciones y
  calificaciones capturadas en la aplicación. Si la base ya tiene datos, se
  niega a continuar y muestra lo que borraría, salvo que pases
  `--confirmar-borrado`. Respalda antes.
- Todo ocurre en **una sola transacción**: si falla, la base queda como estaba.
- Deriva el catálogo de carreras de los valores de `alumno.carrera`. Los
  alumnos sin carrera quedan en **"SIN CARRERA ASIGNADA (revisar)"**; campus,
  sexo o días no reconocidos, grupos con referencias inválidas, inscripciones
  fuera de rango y duplicados se **reportan** con su número de control o id
  para revisarlos.

Desde el equipo anfitrión (con Docker, la base está en `127.0.0.1:5432`; pon la
contraseña de tu `.env` raíz en el `DATABASE_URL` de `backend/.env`):

```bash
cd backend
npm run prisma:import-legacy                          # se detiene si ya hay datos
npm run prisma:import-legacy -- --confirmar-borrado   # reemplaza los datos
```

O dentro de Docker, montando el volcado solo para esa ejecución (nunca se
copia a la imagen):

```bash
docker compose run --rm -v "$(pwd)/backend/prisma/legacy:/app/prisma/legacy:ro" \
  backend npx tsx prisma/import-legacy.ts --confirmar-borrado
# PowerShell: -v "${PWD}\backend\prisma\legacy:/app/prisma/legacy:ro"
```

## Respaldos y restauración

El servicio `respaldos` de Docker Compose hace un `pg_dump` al arrancar y luego
cada `RESPALDO_INTERVALO_HORAS` (24 por defecto), y borra los de más de
`RESPALDO_RETENCION_DIAS` (14). Los archivos quedan en `./respaldos/`, que git
ignora porque **contienen datos personales**: cópialos con regularidad a otro
lugar, cifrados.

```bash
# Respaldo inmediato
docker compose exec respaldos sh /scripts/respaldar.sh

# Restaurar (reemplaza todo el contenido de la base; antes crea un respaldo de seguridad)
docker compose stop backend
docker compose exec respaldos sh /scripts/restaurar.sh                      # lista los respaldos
docker compose exec respaldos sh /scripts/restaurar.sh <archivo.dump> --confirmar
docker compose start backend
```

Prueba la restauración de vez en cuando: un respaldo que nunca se restauró no
está verificado.

## Pruebas y verificación

```bash
cd backend
DATABASE_URL="postgresql://extraliebres:extraliebres@localhost:5432/extraliebresdb_test?schema=public" \
  npx prisma migrate deploy   # una vez, sobre la base de pruebas
npm test                      # unitarias + integración (usa .env.test)
npm run test:coverage
npm run typecheck             # incluye prisma/ y la configuración de pruebas
npm run lint

cd ../frontend
npm test                      # Vitest + Testing Library
npm run lint
npm run build
```

Las pruebas de integración **borran todas las tablas** de la base de prueba
antes de cada caso. Para evitar accidentes, se cancelan si `DATABASE_URL` no
apunta a una base cuyo nombre termine en `_test`.

En GitHub, el flujo `.github/workflows/ci.yml` ejecuta todo lo anterior (con un
PostgreSQL temporal) en cada pull request y en `main`, además de verificar que
`schema.prisma` coincide con las migraciones y de un `npm audit` de las
dependencias de producción.

## Arquitectura

### Backend (`backend/`)

- **Express + TypeScript** organizado por módulos de dominio: `alumnos`,
  `carreras`, `promotores`, `semestres`, `extraescolares`, `grupos`,
  `alumnosGrupo` (inscripciones) y `busqueda` (reportes). Cada módulo sigue
  `routes → controller → service → Prisma`, con validación de entrada con
  **Zod** (body, params y query) y manejo de errores centralizado.
- **IDs de negocio con el formato del sistema anterior**
  (`src/utils/idGenerators.ts`): `idextraescolar` e `idcarrera` =
  `{consecutivo}-{iniciales}`, `idsemestre` = `EJ-25`/`AD-25`, `idgrupo` =
  `{consecutivo}-{actividad}-{rfc}-{semestre}`. El consecutivo es el mayor
  existente + 1 y se calcula bajo un candado de PostgreSQL
  (`pg_advisory_xact_lock`), así que dos altas simultáneas no lo repiten. Las
  iniciales usan solo letras y dígitos y se limitan a 10.
- **Paginación** en todos los listados (`?page=&pageSize=`, máximo 100) con
  respuesta `{ data, total, page, pageSize }`.
- **Búsqueda por palabras**: cada palabra de `search` debe aparecer en algún
  campo, así que "Juan Pérez" encuentra a quien tenga "Juan" en el nombre y
  "Pérez" en un apellido.
- **Edición**: en los `PUT`, un campo ausente no se modifica y `null` (o `""`)
  lo vacía. En grupos, las reglas de horario se validan sobre el resultado
  final (lo guardado + lo enviado).
- **Inscripciones** en lote (máximo 200 alumnos por operación) en una sola
  transacción.
- **Errores**: respuestas `{ error, details? }` sin metadatos internos; JSON
  malformado → 400, cuerpo demasiado grande → 413.
- **Exportación CSV** de alumnos con los mismos filtros del listado, BOM UTF-8
  para Excel y neutralización de valores que Excel ejecutaría como fórmula.
- `GET /api/health` consulta la base y responde `503` si no contesta.

### Frontend (`frontend/`)

- **React 18 + TypeScript + Vite**, React Router, **TanStack Query** para los
  datos del servidor, **Bootstrap 5** (solo CSS) y **react-select** para los
  combos con búsqueda remota.
- Organizado por característica (`src/features/<entidad>`: `api.ts`,
  `hooks.ts`, componentes). Piezas compartidas en `src/components/ui` y
  `src/lib`: estado de consulta con error y reintento, flujo de borrado con
  confirmación (`useBorradoConConfirmacion`), avisos (toasts), paginación y
  diálogo de confirmación accesible.
- En Docker lo sirve **nginx** (`frontend/nginx/`) con gzip, caché para los
  archivos con hash, cabeceras de seguridad (CSP, `X-Frame-Options`, etc.) y
  proxy de `/api` hacia la API.

### Base de datos

El esquema (`backend/prisma/schema.prisma`) se tradujo a PostgreSQL desde el
volcado del sistema original:

- Tablas `alumno`, `carrera`, `promotor`, `semestre`, `extraescolar`, `grupo` y
  `alumnosgrupo` (inscripción alumno–grupo con calificación y desempeño).
  `carrera` es un catálogo nuevo (antes `alumno.carrera` era texto libre).
- Llaves foráneas explícitas, enums nativos (`sexo`, `campus`, días), `CHECK`
  de `calificacion` entre 0 y 4 e índices trigram (`pg_trgm`) en nombres de
  alumnos y promotores.
- El `CHECK` vive solo en la migración porque Prisma no puede expresarlo; una
  prueba de integración verifica que exista. Los índices trigram sí están
  declarados en el esquema, así que `prisma migrate dev` ya no los elimina.

### Política de borrado

| Entidad | Si tiene dependientes... | ¿Se puede forzar? |
| --- | --- | --- |
| `grupo` | Borra en cascada sus inscripciones (calificaciones) | Sí, con `?confirmar=true` |
| `alumno` | Borra en cascada su historial de inscripciones | Sí, con `?confirmar=true` |
| `promotor` | Borra en cascada sus grupos y las inscripciones de esos grupos | Sí, con `?confirmar=true` |
| `extraescolar` | Igual que `promotor` | Sí, con `?confirmar=true` |
| `semestre` | Desvincula sus grupos (`SET NULL`), no borra nada | Sí, con `?confirmar=true` |
| `carrera` | **Se bloquea siempre** si tiene alumnos | **No** |

Sin `?confirmar=true`, un borrado con impacto responde `409` con el detalle
(`{ error, details: { requiereConfirmacion: true, ... } }`); la interfaz lo
muestra en un diálogo antes de repetir la petición confirmada. El conteo y el
borrado ocurren en la misma transacción.

Los borrados son físicos: no hay papelera ni bitácora. Los respaldos son la
única forma de recuperar algo borrado por error.

## Endpoints de la API

Todos bajo `/api`. Los listados aceptan `?search=&page=&pageSize=`.

- `GET/POST /alumnos`, `GET/PUT/DELETE /alumnos/:nocontrol` (filtros extra:
  `idcarrera`, `campus`, `sexo`)
- `GET /alumnos/export` (CSV con los mismos filtros, hasta 10,000 filas)
- `GET/POST /carreras`, `GET/PUT/DELETE /carreras/:idcarrera`
- `GET/POST /promotores`, `GET/PUT/DELETE /promotores/:rfc`
- `GET/POST /semestres`, `GET/DELETE /semestres/:idsemestre` (sin edición,
  igual que el sistema original)
- `GET/POST /extraescolares`, `GET/PUT/DELETE /extraescolares/:idextraescolar`
- `GET/POST /grupos`, `GET/PUT/DELETE /grupos/:idgrupo` (filtros:
  `idextraescolar`, `rfcpromotor`, `anio`)
- `GET/POST/DELETE /grupos/:idgrupo/alumnos` (roster con estadísticas,
  inscripción y baja en lote; el `DELETE` recibe `{ "nocontrol": [...] }`)
- `GET /busqueda/alumnos/:nocontrol/extraescolares` (historial de un alumno)
- `GET /health` (`{ status, database, timestamp }`, `503` si la base no responde)

## Scripts

| Backend | Descripción |
| --- | --- |
| `npm run dev` | API con recarga en caliente |
| `npm run build` / `npm start` | Compila a `dist/` y lo ejecuta |
| `npm run typecheck` / `npm run lint` | Tipos y lint (incluye `prisma/`) |
| `npm test` / `npm run test:coverage` | Pruebas (requiere la base `*_test`) |
| `npm run prisma:deploy` | Aplica las migraciones pendientes |
| `npm run prisma:migrate` | Crea una migración nueva al cambiar el esquema (desarrollo) |
| `npm run prisma:seed` | Datos de ejemplo ficticios |
| `npm run prisma:import-legacy` | Importa el volcado del sistema anterior |
| `npm run prisma:studio` | Explorador visual de la base |

| Frontend | Descripción |
| --- | --- |
| `npm run dev` | Servidor de desarrollo (proxy de `/api`) |
| `npm run build` / `npm run preview` | Build de producción y vista previa |
| `npm test` / `npm run lint` | Pruebas y lint |

## Seguridad y despliegue

Ya resuelto:

- Puertos publicados solo en `127.0.0.1`; contraseña de la base fuera del
  repositorio; Adminer solo en el perfil `dev`.
- El volcado con datos reales nunca entra a la imagen de Docker
  (`backend/.dockerignore`).
- API con Helmet, CORS restringido y validación estricta; SPA con CSP y
  cabeceras de seguridad; proceso de la API sin privilegios de root.
- Respaldos automáticos y restauración documentada.

Pendiente antes de exponer la aplicación a una red:

1. **Autenticación y autorización** (por ejemplo, sesión con cookie
   `HttpOnly`/`Secure` o JWT de corta duración, contraseñas con bcrypt/argon2,
   límite de intentos y roles para borrar y exportar) y una bitácora de
   cambios de calificaciones y borrados.
2. **HTTPS** en nginx (certificado institucional o Let's Encrypt); después,
   agregar `Strict-Transport-Security` a `frontend/nginx/cabeceras-seguridad.conf`.
3. **Límite de peticiones** por cliente (en nginx o con `express-rate-limit`).
4. Copia de los respaldos fuera del equipo, cifrada.

## Historial

Las rondas de trabajo anteriores y sus verificaciones están en
[docs/historial-desarrollo.md](docs/historial-desarrollo.md).

# Historial de desarrollo

Bitácora de las rondas de trabajo anteriores, conservada como referencia. La
documentación de uso vigente está en el [README](../README.md).

> **Correcciones posteriores (auditoría técnica, octubre de 2026).** Algunas
> afirmaciones de este historial resultaron inexactas al verificarlas y ya se
> corrigieron en el código:
>
> - *"Condición de carrera en generación de IDs resuelta"*: el reintento solo
>   evitaba IDs completos repetidos; los consecutivos sí se duplicaban bajo
>   concurrencia y, tras borrar un grupo, `count() + 1` chocaba siempre con un
>   ID existente. Ahora el consecutivo es el máximo + 1 y se calcula bajo un
>   candado de PostgreSQL.
> - *"`prisma:import-legacy` es seguro e idempotente"*: borraba todo lo
>   capturado sin transacción ni confirmación y asignaba carrera y campus por
>   defecto en silencio. Ahora es transaccional, pide `--confirmar-borrado` y
>   reporta cada valor corregido.
> - *"Índices `pg_trgm` para que las búsquedas no dependan de un sequential
>   scan"*: el esquema de Prisma no los declaraba y `prisma migrate dev`
>   generaba una migración que los eliminaba (ya corregido). Además, la
>   búsqueda de alumnos combina `nocontrol` en el mismo `OR`, así que hoy esos
>   índices no se usan; con ~1,800 alumnos no hay impacto.
> - El seed de datos de ejemplo no funcionaba desde que se agregó el
>   catálogo de carreras (ya corregido).
> - Las pruebas de integración podían vaciar cualquier base indicada en
>   `DATABASE_URL` (ahora exigen una base cuyo nombre termine en `_test`).
>
> El detalle de los cambios está en el historial de git de la rama de la
> auditoría.

## Primera ronda: verificación de punta a punta

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

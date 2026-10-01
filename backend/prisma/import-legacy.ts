/**
 * Importa el volcado SQL legado (MySQL/phpMyAdmin) de extraliebresdb hacia
 * PostgreSQL a traves de Prisma. Reemplaza cualquier dato existente en las
 * tablas de la aplicacion por el contenido real de
 * prisma/legacy/extraliebresdb.sql.
 *
 * Uso:
 *   npm run prisma:import-legacy
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DUMP_PATH = path.join(__dirname, "legacy", "extraliebresdb.sql");

type Fila = Record<string, string | null>;

/**
 * Encuentra TODOS los bloques "INSERT INTO `tabla` (`col1`, `col2`, ...) VALUES (...), (...);"
 * de una tabla especifica (phpMyAdmin parte los dumps grandes en varios INSERT
 * por tabla) y los concatena en filas crudas (como texto).
 */
function extraerInserts(sql: string, tabla: string): Fila[] {
  const patronCabecera = new RegExp(
    "INSERT INTO `" + tabla + "`\\s*\\(([^)]+)\\)\\s*VALUES\\s*",
    "gi"
  );

  const filas: Fila[] = [];
  let match: RegExpExecArray | null;

  while ((match = patronCabecera.exec(sql)) !== null) {
    const columnas = match[1].split(",").map((c) => c.trim().replace(/`/g, ""));
    const inicioValores = match.index + match[0].length;
    const finValores = sql.indexOf(";", inicioValores);
    const bloqueValores = sql.slice(inicioValores, finValores);

    const tuplas = parsearTuplas(bloqueValores);
    for (const valores of tuplas) {
      const fila: Fila = {};
      columnas.forEach((columna, i) => {
        fila[columna] = valores[i] ?? null;
      });
      filas.push(fila);
    }

    patronCabecera.lastIndex = finValores;
  }

  return filas;
}

/** Parser tolerante de "(v1, v2, ...), (v1, v2, ...)" al estilo SQL, con strings entre comillas simples. */
function parsearTuplas(bloque: string): (string | null)[][] {
  const tuplas: (string | null)[][] = [];
  let i = 0;
  const n = bloque.length;

  while (i < n) {
    while (i < n && bloque[i] !== "(") i++;
    if (i >= n) break;
    i++; // saltar '('

    const campos: (string | null)[] = [];
    let campoActual = "";
    let dentroDeString = false;

    while (i < n) {
      const c = bloque[i];

      if (dentroDeString) {
        if (c === "'" && bloque[i + 1] === "'") {
          campoActual += "'"; // comilla escapada como ''
          i += 2;
          continue;
        }
        if (c === "'") {
          dentroDeString = false;
          i++;
          continue;
        }
        campoActual += c;
        i++;
        continue;
      }

      if (c === "'") {
        dentroDeString = true;
        i++;
        continue;
      }

      if (c === ",") {
        campos.push(normalizarCampo(campoActual));
        campoActual = "";
        i++;
        continue;
      }

      if (c === ")") {
        campos.push(normalizarCampo(campoActual));
        tuplas.push(campos);
        i++;
        break;
      }

      campoActual += c;
      i++;
    }
  }

  return tuplas;
}

function normalizarCampo(crudo: string): string | null {
  const valor = crudo.trim();
  if (valor.toUpperCase() === "NULL") return null;
  return valor;
}

function vacioANulo(valor: string | null): string | null {
  if (valor === null) return null;
  const v = valor.trim();
  return v === "" ? null : v;
}

function mapearCampus(valor: string | null): "CAMPUS_1" | "CAMPUS_2" | null {
  if (valor === "CAMPUS 1") return "CAMPUS_1";
  if (valor === "CAMPUS 2") return "CAMPUS_2";
  return null;
}

function mapearSexo(valor: string | null): "MASCULINO" | "FEMENINO" | null {
  if (valor === "MASCULINO" || valor === "FEMENINO") return valor;
  return null;
}

/** "Ing. Sistemas Computacionales" -> "IS" (mismo criterio que utils/idGenerators.ts) */
function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join("");
}

function mapearDia(
  valor: string | null
):
  | "LUNES"
  | "MARTES"
  | "MIERCOLES"
  | "JUEVES"
  | "VIERNES"
  | "SABADO"
  | null {
  const v = vacioANulo(valor);
  if (!v) return null;
  const CARACTERES_DIACRITICOS = new RegExp("[\\u0300-\\u036f]", "g");
  const normalizado = v.toUpperCase().normalize("NFD").replace(CARACTERES_DIACRITICOS, "");
  const validos = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];
  return validos.includes(normalizado) ? (normalizado as ReturnType<typeof mapearDia>) : null;
}

async function limpiarTablas(): Promise<void> {
  // Orden seguro respetando llaves foraneas: hijos antes que padres.
  await prisma.alumnoGrupo.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.alumno.deleteMany();
  await prisma.carrera.deleteMany();
  await prisma.extraescolar.deleteMany();
  await prisma.promotor.deleteMany();
  await prisma.semestre.deleteMany();
}

async function main(): Promise<void> {
  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(`No se encontro el archivo de volcado en ${DUMP_PATH}`);
  }
  const sql = fs.readFileSync(DUMP_PATH, "utf-8");

  console.log("Limpiando datos existentes...");
  await limpiarTablas();

  console.log("Importando promotores...");
  const promotores = extraerInserts(sql, "promotor");
  await prisma.promotor.createMany({
    data: promotores.map((f) => ({
      rfc: f.rfc!.trim(),
      nombre: (f.nombre ?? "").trim(),
      appaterno: (f.appaterno ?? "").trim(),
      apmaterno: (f.apmaterno ?? "").trim(),
    })),
    skipDuplicates: true,
  });
  console.log(`  -> ${promotores.length} promotores`);

  console.log("Importando actividades extraescolares...");
  const extraescolares = extraerInserts(sql, "extraescolar");
  await prisma.extraescolar.createMany({
    data: extraescolares.map((f) => ({
      idextraescolar: f.idextraescolar!.trim(),
      nombreextra: (f.nombreextra ?? "").trim(),
    })),
    skipDuplicates: true,
  });
  console.log(`  -> ${extraescolares.length} actividades`);

  console.log("Importando semestres...");
  const semestres = extraerInserts(sql, "semestre");
  await prisma.semestre.createMany({
    data: semestres.map((f) => ({
      idsemestre: f.idsemestre!.trim(),
      mesinicio: (f.mesinicio ?? "").trim(),
      mestermino: (f.mestermino ?? "").trim(),
      anio: (f.anio ?? "").trim(),
    })),
    skipDuplicates: true,
  });
  console.log(`  -> ${semestres.length} semestres`);

  console.log("Importando alumnos...");
  const alumnos = extraerInserts(sql, "alumno");

  console.log("Derivando catalogo de carreras a partir de los alumnos...");
  const nombresCarrera = Array.from(
    new Set(alumnos.map((f) => (f.carrera ?? "").trim()).filter((n) => n !== ""))
  ).sort();
  const idPorNombreCarrera = new Map<string, string>();
  const carrerasAInsertar = nombresCarrera.map((nombre, indice) => {
    const idcarrera = `${indice + 1}-${iniciales(nombre)}`;
    idPorNombreCarrera.set(nombre, idcarrera);
    return { idcarrera, nombre };
  });
  await prisma.carrera.createMany({ data: carrerasAInsertar, skipDuplicates: true });
  console.log(`  -> ${carrerasAInsertar.length} carreras`);

  const CARRERA_POR_DEFECTO = carrerasAInsertar[0]?.idcarrera;
  await prisma.alumno.createMany({
    data: alumnos.map((f) => ({
      nocontrol: f.nocontrol!.trim(),
      nombre: (f.nombre ?? "").trim(),
      appaterno: (f.appaterno ?? "").trim(),
      apmaterno: vacioANulo(f.apmaterno),
      sexo: mapearSexo(vacioANulo(f.sexo)),
      idcarrera: idPorNombreCarrera.get((f.carrera ?? "").trim()) ?? CARRERA_POR_DEFECTO!,
      campus: mapearCampus(f.campus) ?? "CAMPUS_1",
    })),
    skipDuplicates: true,
  });
  console.log(`  -> ${alumnos.length} alumnos`);

  console.log("Importando grupos...");
  const grupos = extraerInserts(sql, "grupo");
  let gruposOmitidos = 0;
  const idsExtraescolar = new Set(extraescolares.map((f) => f.idextraescolar!.trim()));
  const idsPromotor = new Set(promotores.map((f) => f.rfc!.trim()));
  const gruposValidos = grupos.filter((f) => {
    const idextraescolar = f.idextraescolar?.trim();
    const rfcpromotor = f.rfcpromotor?.trim();
    const valido = Boolean(
      idextraescolar && rfcpromotor && idsExtraescolar.has(idextraescolar) && idsPromotor.has(rfcpromotor)
    );
    if (!valido) gruposOmitidos += 1;
    return valido;
  });
  await prisma.grupo.createMany({
    data: gruposValidos.map((f) => ({
      idgrupo: f.idgrupo!.trim(),
      primerdia: mapearDia(f.primerdia),
      segundodia: mapearDia(f.segundodia),
      horainicio: vacioANulo(f.horainicio),
      horatermino: vacioANulo(f.horatermino),
      aula: vacioANulo(f.aula),
      idsemestre: vacioANulo(f.idsemestre),
      idextraescolar: f.idextraescolar!.trim(),
      rfcpromotor: f.rfcpromotor!.trim(),
    })),
    skipDuplicates: true,
  });
  console.log(`  -> ${gruposValidos.length} grupos (${gruposOmitidos} omitidos por referencias invalidas)`);

  console.log("Importando inscripciones (alumnosgrupo)...");
  const inscripciones = extraerInserts(sql, "alumnosgrupo");
  if (inscripciones.length > 0) {
    await prisma.alumnoGrupo.createMany({
      data: inscripciones
        .filter((f) => f.nocontrol && f.idgrupo && f.calificacion !== null)
        .map((f) => {
          const calificacion = Number.parseInt(f.calificacion ?? "0", 10);
          return {
            nocontrol: f.nocontrol!.trim(),
            idgrupo: f.idgrupo!.trim(),
            calificacion,
            desempeno: (f.desempeno ?? "").trim(),
          };
        }),
      skipDuplicates: true,
    });
  }
  console.log(`  -> ${inscripciones.length} inscripciones`);

  console.log("Importacion completada.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Importa el volcado SQL legado (MySQL/phpMyAdmin) de extraliebresdb hacia
 * PostgreSQL a traves de Prisma.
 *
 * ATENCION: REEMPLAZA el contenido de las 7 tablas (incluidas inscripciones y
 * calificaciones capturadas en la aplicacion). Si la base ya tiene datos, se
 * niega a continuar sin la bandera --confirmar-borrado.
 *
 * Uso:
 *   npm run prisma:import-legacy
 *   npm run prisma:import-legacy -- --confirmar-borrado
 *   npm run prisma:import-legacy -- --archivo=/ruta/a/otro.sql
 *
 * El volcado por defecto es prisma/legacy/extraliebresdb.sql (no versionado).
 */
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { ConteoTablas, contarRegistros, importarDatos, prepararDatos } from "./importacion/importar";

const argumentos = process.argv.slice(2);
const confirmarBorrado = argumentos.includes("--confirmar-borrado");
const archivoArg = argumentos.find((a) => a.startsWith("--archivo="))?.slice("--archivo=".length);
const DUMP_PATH = archivoArg
  ? path.resolve(archivoArg)
  : path.join(__dirname, "legacy", "extraliebresdb.sql");

function tabla(conteo: ConteoTablas): string {
  return Object.entries(conteo)
    .map(([nombre, cantidad]) => `  ${nombre.padEnd(15)} ${cantidad}`)
    .join("\n");
}

async function main(prisma: PrismaClient): Promise<void> {
  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(`No se encontro el archivo de volcado en ${DUMP_PATH}`);
  }

  console.log(`Leyendo ${DUMP_PATH} ...`);
  // Todo el parseo y la validacion ocurren antes de tocar la base.
  const datos = prepararDatos(fs.readFileSync(DUMP_PATH, "utf-8"));
  const esperado: ConteoTablas = {
    promotores: datos.promotores.length,
    extraescolares: datos.extraescolares.length,
    semestres: datos.semestres.length,
    carreras: datos.carreras.length,
    alumnos: datos.alumnos.length,
    grupos: datos.grupos.length,
    inscripciones: datos.inscripciones.length,
  };
  console.log(`Registros leidos del volcado:\n${tabla(esperado)}`);

  const actuales = await contarRegistros(prisma);
  const hayDatos = Object.values(actuales).some((n) => n > 0);
  if (hayDatos && !confirmarBorrado) {
    console.error(
      `\nLa base ya tiene datos y la importacion los BORRARIA todos:\n${tabla(actuales)}\n\n` +
        "Si de verdad quieres reemplazarlos, respalda primero la base y vuelve a ejecutar con\n" +
        "  npm run prisma:import-legacy -- --confirmar-borrado"
    );
    process.exitCode = 1;
    return;
  }

  console.log("\nImportando en una sola transaccion...");
  const insertados = await importarDatos(prisma, datos);
  console.log(`Registros insertados:\n${tabla(insertados)}`);

  const descartados = Object.entries(insertados)
    .map(([nombre, cantidad]) => [nombre, esperado[nombre as keyof ConteoTablas] - cantidad] as const)
    .filter(([, diferencia]) => diferencia > 0);
  for (const [nombre, diferencia] of descartados) {
    datos.avisos.push(`${diferencia} registro(s) de ${nombre} descartados por estar duplicados.`);
  }

  if (datos.avisos.length > 0) {
    console.log("\nAvisos (revisa estos registros):");
    for (const aviso of datos.avisos) console.log(`  - ${aviso}`);
  }
  console.log("\nImportacion completada.");
}

const prisma = new PrismaClient();
main(prisma)
  .catch((error) => {
    console.error("\nLa importacion fallo; la base quedo sin cambios.\n", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

/**
 * Datos de ejemplo SINTETICOS para desarrollo y demostraciones (ningun dato
 * real). Es idempotente: se puede correr varias veces.
 *
 * Uso: npm run prisma:seed   (tambien lo ejecuta "prisma migrate reset")
 *
 * Para no mezclar datos ficticios con datos reales, se niega a correr si la
 * base ya tiene alumnos que no son del seed (sus numeros de control empiezan
 * con "99").
 */
import { Campus, DiaSemana, PrismaClient, Sexo } from "@prisma/client";
import { calificacionADesempeno } from "../src/utils/desempeno";

const prisma = new PrismaClient();

const PREFIJO_SEED = "99";

const CARRERAS = [
  { idcarrera: "1-IGE", nombre: "Ingenieria en Gestion Empresarial (ejemplo)" },
  { idcarrera: "2-II", nombre: "Ingenieria Industrial (ejemplo)" },
  { idcarrera: "3-ISC", nombre: "Ingenieria en Sistemas Computacionales (ejemplo)" },
  { idcarrera: "4-LA", nombre: "Licenciatura en Administracion (ejemplo)" },
];

const PROMOTORES = [
  { rfc: "EJEA800101AA1", nombre: "Laura", appaterno: "Ejemplo", apmaterno: "Uno" },
  { rfc: "EJEB810202BB2", nombre: "Mario", appaterno: "Ejemplo", apmaterno: "Dos" },
  { rfc: "EJEC820303CC3", nombre: "Sofia", appaterno: "Ejemplo", apmaterno: "Tres" },
];

const EXTRAESCOLARES = [
  { idextraescolar: "1-FS", nombreextra: "Futbol Soccer (ejemplo)" },
  { idextraescolar: "2-A", nombreextra: "Ajedrez (ejemplo)" },
  { idextraescolar: "3-DF", nombreextra: "Danza Folklorica (ejemplo)" },
  { idextraescolar: "4-BV", nombreextra: "Banda de Viento (ejemplo)" },
];

const SEMESTRES = [
  { idsemestre: "AD-25", mesinicio: "AGOSTO", mestermino: "DICIEMBRE", anio: "2025" },
  { idsemestre: "EJ-26", mesinicio: "ENERO", mestermino: "JUNIO", anio: "2026" },
];

const GRUPOS: {
  idgrupo: string;
  idextraescolar: string;
  rfcpromotor: string;
  idsemestre: string;
  primerdia: DiaSemana;
  segundodia: DiaSemana | null;
  horainicio: string;
  horatermino: string;
  aula: string;
}[] = [
  { idgrupo: "1-1FS-EJEA800101-AD25", idextraescolar: "1-FS", rfcpromotor: "EJEA800101AA1", idsemestre: "AD-25", primerdia: "LUNES", segundodia: "MIERCOLES", horainicio: "16:00", horatermino: "17:00", aula: "Cancha 1" },
  { idgrupo: "2-2A-EJEB810202-AD25", idextraescolar: "2-A", rfcpromotor: "EJEB810202BB2", idsemestre: "AD-25", primerdia: "MARTES", segundodia: "JUEVES", horainicio: "13:00", horatermino: "14:00", aula: "Aula 12" },
  { idgrupo: "3-3DF-EJEC820303-AD25", idextraescolar: "3-DF", rfcpromotor: "EJEC820303CC3", idsemestre: "AD-25", primerdia: "VIERNES", segundodia: null, horainicio: "10:00", horatermino: "12:00", aula: "Salon de danza" },
  { idgrupo: "4-1FS-EJEA800101-EJ26", idextraescolar: "1-FS", rfcpromotor: "EJEA800101AA1", idsemestre: "EJ-26", primerdia: "LUNES", segundodia: "MIERCOLES", horainicio: "17:00", horatermino: "18:00", aula: "Cancha 2" },
  { idgrupo: "5-4BV-EJEB810202-EJ26", idextraescolar: "4-BV", rfcpromotor: "EJEB810202BB2", idsemestre: "EJ-26", primerdia: "SABADO", segundodia: null, horainicio: "09:00", horatermino: "11:00", aula: "Auditorio" },
];

const NOMBRES = ["Ana", "Luis", "Maria", "Jorge", "Paola", "Diego", "Karla", "Raul", "Elena", "Hector"];
const APELLIDOS = ["Ejemplo", "Prueba", "Muestra", "Ficticio", "Demo"];

function alumnosSinteticos() {
  return Array.from({ length: 40 }, (_, i) => ({
    nocontrol: `${PREFIJO_SEED}${String(i + 1).padStart(6, "0")}`,
    nombre: NOMBRES[i % NOMBRES.length],
    appaterno: APELLIDOS[i % APELLIDOS.length],
    apmaterno: i % 7 === 0 ? null : APELLIDOS[(i + 2) % APELLIDOS.length],
    sexo: (i % 9 === 0 ? null : i % 2 === 0 ? "FEMENINO" : "MASCULINO") as Sexo | null,
    idcarrera: CARRERAS[i % CARRERAS.length].idcarrera,
    campus: (i % 3 === 0 ? "CAMPUS_2" : "CAMPUS_1") as Campus,
  }));
}

async function main() {
  const ajenos = await prisma.alumno.count({ where: { NOT: { nocontrol: { startsWith: PREFIJO_SEED } } } });
  if (ajenos > 0) {
    throw new Error(
      `La base ya tiene ${ajenos} alumno(s) que no son datos de ejemplo. ` +
        "El seed solo debe correr en una base de desarrollo vacia."
    );
  }

  await prisma.carrera.createMany({ data: CARRERAS, skipDuplicates: true });
  await prisma.promotor.createMany({ data: PROMOTORES, skipDuplicates: true });
  await prisma.extraescolar.createMany({ data: EXTRAESCOLARES, skipDuplicates: true });
  await prisma.semestre.createMany({ data: SEMESTRES, skipDuplicates: true });
  await prisma.grupo.createMany({ data: GRUPOS, skipDuplicates: true });

  const alumnos = alumnosSinteticos();
  await prisma.alumno.createMany({ data: alumnos, skipDuplicates: true });

  // 3 grupos con 8 alumnos cada uno, calificaciones variadas.
  const inscripciones = GRUPOS.slice(0, 3).flatMap((grupo, g) =>
    alumnos.slice(g * 8, g * 8 + 8).map((alumno, i) => {
      const calificacion = (i + g) % 5;
      return {
        nocontrol: alumno.nocontrol,
        idgrupo: grupo.idgrupo,
        calificacion,
        desempeno: calificacionADesempeno(calificacion),
      };
    })
  );
  await prisma.alumnoGrupo.createMany({ data: inscripciones, skipDuplicates: true });

  console.log(
    `Seed completado: ${CARRERAS.length} carreras, ${PROMOTORES.length} promotores, ` +
      `${EXTRAESCOLARES.length} actividades, ${SEMESTRES.length} semestres, ${GRUPOS.length} grupos, ` +
      `${alumnos.length} alumnos y ${inscripciones.length} inscripciones (todos ficticios).`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

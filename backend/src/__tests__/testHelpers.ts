import { prisma } from "../config/prisma";

/** Borra el contenido de las 7 tablas en orden seguro (hijos antes que padres). */
export async function limpiarBaseDePrueba(): Promise<void> {
  await prisma.alumnoGrupo.deleteMany();
  await prisma.grupo.deleteMany();
  await prisma.alumno.deleteMany();
  await prisma.carrera.deleteMany();
  await prisma.extraescolar.deleteMany();
  await prisma.promotor.deleteMany();
  await prisma.semestre.deleteMany();
}

export async function crearCarreraDePrueba(idcarrera = "1-TEST", nombre = "Carrera de prueba") {
  return prisma.carrera.create({ data: { idcarrera, nombre } });
}

export async function crearPromotorDePrueba(rfc = "TEST111111000") {
  return prisma.promotor.create({
    data: { rfc, nombre: "Promotor", appaterno: "De", apmaterno: "Prueba" },
  });
}

export async function crearExtraescolarDePrueba(idextraescolar = "1-TEST") {
  return prisma.extraescolar.create({
    data: { idextraescolar, nombreextra: `Actividad ${idextraescolar}` },
  });
}

export async function crearSemestreDePrueba(idsemestre = "EJ-25") {
  return prisma.semestre.create({
    data: { idsemestre, mesinicio: "ENERO", mestermino: "JUNIO", anio: "2025" },
  });
}

export async function crearAlumnoDePrueba(nocontrol: string, idcarrera: string) {
  return prisma.alumno.create({
    data: {
      nocontrol,
      nombre: "Alumno",
      appaterno: "De",
      apmaterno: "Prueba",
      sexo: "MASCULINO",
      idcarrera,
      campus: "CAMPUS_1",
    },
  });
}

export async function crearGrupoDePrueba(params: {
  idgrupo: string;
  idextraescolar: string;
  rfcpromotor: string;
  idsemestre?: string | null;
}) {
  return prisma.grupo.create({
    data: {
      idgrupo: params.idgrupo,
      idextraescolar: params.idextraescolar,
      rfcpromotor: params.rfcpromotor,
      idsemestre: params.idsemestre ?? null,
    },
  });
}

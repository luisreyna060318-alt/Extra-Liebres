import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const promotor = await prisma.promotor.upsert({
    where: { rfc: "GARL850101AB1" },
    update: {},
    create: {
      rfc: "GARL850101AB1",
      nombre: "Laura",
      appaterno: "Garcia",
      apmaterno: "Reyes",
    },
  });

  const extraescolar = await prisma.extraescolar.upsert({
    where: { idextraescolar: "1-FS" },
    update: {},
    create: { idextraescolar: "1-FS", nombreextra: "Futbol Soccer" },
  });

  const semestre = await prisma.semestre.upsert({
    where: { idsemestre: "AD-25" },
    update: {},
    create: { idsemestre: "AD-25", mesinicio: "AGOSTO", mestermino: "DICIEMBRE", anio: "2025" },
  });

  const grupo = await prisma.grupo.upsert({
    where: { idgrupo: "1-1FS-GARL850101AB-AD25" },
    update: {},
    create: {
      idgrupo: "1-1FS-GARL850101AB-AD25",
      primerdia: "LUNES",
      segundodia: "MIERCOLES",
      horainicio: "16:00",
      horatermino: "17:00",
      aula: "Cancha 1",
      idsemestre: semestre.idsemestre,
      idextraescolar: extraescolar.idextraescolar,
      rfcpromotor: promotor.rfc,
    },
  });

  const alumno = await prisma.alumno.upsert({
    where: { nocontrol: "21170001" },
    update: {},
    create: {
      nocontrol: "21170001",
      nombre: "Juan",
      appaterno: "Perez",
      apmaterno: "Lopez",
      sexo: "MASCULINO",
      carrera: "Ingenieria en Sistemas Computacionales",
      campus: "CAMPUS_1",
    },
  });

  await prisma.alumnoGrupo.upsert({
    where: { nocontrol_idgrupo: { nocontrol: alumno.nocontrol, idgrupo: grupo.idgrupo } },
    update: {},
    create: {
      nocontrol: alumno.nocontrol,
      idgrupo: grupo.idgrupo,
      calificacion: 4,
      desempeno: "EXCELENTE",
    },
  });

  console.log("Seed completado.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

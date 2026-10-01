import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";

/** Historial de actividades extraescolares cursadas por un alumno especifico. */
export async function getHistorialExtraescolarDeAlumno(nocontrol: string) {
  const alumno = await prisma.alumno.findUnique({
    where: { nocontrol },
    include: { carrera: true },
  });
  if (!alumno) {
    throw ApiError.notFound(`No existe un alumno con numero de control ${nocontrol}.`);
  }

  const inscripciones = await prisma.alumnoGrupo.findMany({
    where: { nocontrol },
    include: {
      grupo: {
        include: { extraescolar: true, promotor: true, semestre: true },
      },
    },
    orderBy: { idgrupo: "asc" },
  });

  return {
    alumno,
    historial: inscripciones.map((i) => ({
      idgrupo: i.grupo.idgrupo,
      extraescolar: i.grupo.extraescolar.nombreextra,
      promotor: `${i.grupo.promotor.nombre} ${i.grupo.promotor.appaterno} ${i.grupo.promotor.apmaterno}`,
      semestre: i.grupo.semestre
        ? `${i.grupo.semestre.mesinicio}-${i.grupo.semestre.mestermino} ${i.grupo.semestre.anio}`
        : null,
      calificacion: i.calificacion,
      desempeno: i.desempeno,
    })),
  };
}

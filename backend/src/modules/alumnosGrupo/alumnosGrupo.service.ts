import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { calificacionADesempeno } from "../../utils/desempeno";
import { EnrollBatchInput, UnenrollBatchInput } from "./alumnosGrupo.schema";

async function asegurarGrupoExiste(idgrupo: string): Promise<void> {
  const grupo = await prisma.grupo.findUnique({ where: { idgrupo }, select: { idgrupo: true } });
  if (!grupo) {
    throw ApiError.notFound(`No existe un grupo con id ${idgrupo}.`);
  }
}

export async function getRosterConEstadisticas(idgrupo: string) {
  await asegurarGrupoExiste(idgrupo);

  const inscripciones = await prisma.alumnoGrupo.findMany({
    where: { idgrupo },
    include: { alumno: true },
    orderBy: { nocontrol: "asc" },
  });

  const total = inscripciones.length;
  const totalMasculino = inscripciones.filter((i) => i.alumno.sexo === "MASCULINO").length;
  const totalFemenino = inscripciones.filter((i) => i.alumno.sexo === "FEMENINO").length;
  const totalSinEspecificar = total - totalMasculino - totalFemenino;
  const porcentaje = (cantidad: number) =>
    total > 0 ? Number(((cantidad / total) * 100).toFixed(2)) : 0;

  return {
    idgrupo,
    total,
    estadisticasPorSexo: {
      masculino: { cantidad: totalMasculino, porcentaje: porcentaje(totalMasculino) },
      femenino: { cantidad: totalFemenino, porcentaje: porcentaje(totalFemenino) },
      sinEspecificar: { cantidad: totalSinEspecificar, porcentaje: porcentaje(totalSinEspecificar) },
    },
    alumnos: inscripciones.map((i) => ({
      nocontrol: i.alumno.nocontrol,
      nombre: i.alumno.nombre,
      appaterno: i.alumno.appaterno,
      apmaterno: i.alumno.apmaterno,
      sexo: i.alumno.sexo,
      calificacion: i.calificacion,
      desempeno: i.desempeno,
    })),
  };
}

type ResultadoOperacion = {
  nocontrol: string;
  estado: "agregado" | "ya_inscrito" | "no_existe" | "eliminado" | "no_inscrito";
};

export async function inscribirAlumnos(idgrupo: string, input: EnrollBatchInput) {
  await asegurarGrupoExiste(idgrupo);

  const resultados: ResultadoOperacion[] = [];

  for (const { nocontrol, calificacion } of input.alumnos) {
    const alumno = await prisma.alumno.findUnique({ where: { nocontrol } });
    if (!alumno) {
      resultados.push({ nocontrol, estado: "no_existe" });
      continue;
    }

    const yaInscrito = await prisma.alumnoGrupo.findUnique({
      where: { nocontrol_idgrupo: { nocontrol, idgrupo } },
    });
    if (yaInscrito) {
      resultados.push({ nocontrol, estado: "ya_inscrito" });
      continue;
    }

    await prisma.alumnoGrupo.create({
      data: { nocontrol, idgrupo, calificacion, desempeno: calificacionADesempeno(calificacion) },
    });
    resultados.push({ nocontrol, estado: "agregado" });
  }

  return resultados;
}

export async function retirarAlumnos(idgrupo: string, input: UnenrollBatchInput) {
  await asegurarGrupoExiste(idgrupo);

  const resultados: ResultadoOperacion[] = [];

  for (const nocontrol of input.nocontrol) {
    const inscripcion = await prisma.alumnoGrupo.findUnique({
      where: { nocontrol_idgrupo: { nocontrol, idgrupo } },
    });
    if (!inscripcion) {
      resultados.push({ nocontrol, estado: "no_inscrito" });
      continue;
    }

    await prisma.alumnoGrupo.delete({ where: { nocontrol_idgrupo: { nocontrol, idgrupo } } });
    resultados.push({ nocontrol, estado: "eliminado" });
  }

  return resultados;
}

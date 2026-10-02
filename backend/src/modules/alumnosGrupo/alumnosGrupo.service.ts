import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { calificacionADesempeno } from "../../utils/desempeno";
import { EnrollBatchInput, UnenrollBatchInput } from "./alumnosGrupo.schema";

async function asegurarGrupoExiste(
  idgrupo: string,
  db: Prisma.TransactionClient | typeof prisma = prisma
): Promise<void> {
  const grupo = await db.grupo.findUnique({ where: { idgrupo }, select: { idgrupo: true } });
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

/**
 * Inscribe un lote de alumnos en una sola transaccion: dos consultas para
 * saber quien existe y quien ya esta inscrito, y una sola insercion.
 */
export async function inscribirAlumnos(idgrupo: string, input: EnrollBatchInput) {
  return prisma.$transaction(async (tx) => {
    await asegurarGrupoExiste(idgrupo, tx);

    const nocontroles = Array.from(new Set(input.alumnos.map((a) => a.nocontrol)));
    const [existentes, inscritos] = await Promise.all([
      tx.alumno.findMany({ where: { nocontrol: { in: nocontroles } }, select: { nocontrol: true } }),
      tx.alumnoGrupo.findMany({
        where: { idgrupo, nocontrol: { in: nocontroles } },
        select: { nocontrol: true },
      }),
    ]);
    const existe = new Set(existentes.map((a) => a.nocontrol));
    const yaInscrito = new Set(inscritos.map((i) => i.nocontrol));

    const resultados: ResultadoOperacion[] = [];
    const nuevos: { nocontrol: string; idgrupo: string; calificacion: number; desempeno: string }[] = [];

    for (const { nocontrol, calificacion } of input.alumnos) {
      if (!existe.has(nocontrol)) {
        resultados.push({ nocontrol, estado: "no_existe" });
      } else if (yaInscrito.has(nocontrol)) {
        resultados.push({ nocontrol, estado: "ya_inscrito" });
      } else {
        yaInscrito.add(nocontrol); // un mismo alumno repetido en el lote cuenta una sola vez
        nuevos.push({ nocontrol, idgrupo, calificacion, desempeno: calificacionADesempeno(calificacion) });
        resultados.push({ nocontrol, estado: "agregado" });
      }
    }

    if (nuevos.length > 0) {
      await tx.alumnoGrupo.createMany({ data: nuevos, skipDuplicates: true });
    }
    return resultados;
  });
}

export async function retirarAlumnos(idgrupo: string, input: UnenrollBatchInput) {
  return prisma.$transaction(async (tx) => {
    await asegurarGrupoExiste(idgrupo, tx);

    const nocontroles = Array.from(new Set(input.nocontrol));
    const inscritos = await tx.alumnoGrupo.findMany({
      where: { idgrupo, nocontrol: { in: nocontroles } },
      select: { nocontrol: true },
    });
    const estaInscrito = new Set(inscritos.map((i) => i.nocontrol));

    await tx.alumnoGrupo.deleteMany({ where: { idgrupo, nocontrol: { in: [...estaInscrito] } } });

    return input.nocontrol.map<ResultadoOperacion>((nocontrol) => ({
      nocontrol,
      estado: estaInscrito.has(nocontrol) ? "eliminado" : "no_inscrito",
    }));
  });
}

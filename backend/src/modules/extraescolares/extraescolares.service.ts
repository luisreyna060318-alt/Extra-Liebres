import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { bloquearFila, conCandado } from "../../utils/bloqueo";
import { cadaPalabraEnAlgunCampo } from "../../utils/busqueda";
import { exigirConfirmacionSiHayImpacto } from "../../utils/confirmarBorrado";
import { generarIdExtraescolar } from "../../utils/idGenerators";
import { calcularSkip, paginar } from "../../utils/pagination";
import { reintentarSiIdDuplicado } from "../../utils/retry";
import { CreateExtraescolarInput, UpdateExtraescolarInput } from "./extraescolares.schema";

export async function searchExtraescolares(
  search: string | undefined,
  page: number,
  pageSize: number
) {
  const where = cadaPalabraEnAlgunCampo<Prisma.ExtraescolarWhereInput>(search, (palabra) => [
    { idextraescolar: { contains: palabra, mode: "insensitive" } },
    { nombreextra: { contains: palabra, mode: "insensitive" } },
  ]);

  const [data, total] = await Promise.all([
    prisma.extraescolar.findMany({
      where,
      orderBy: { idextraescolar: "asc" },
      skip: calcularSkip(page, pageSize),
      take: pageSize,
    }),
    prisma.extraescolar.count({ where }),
  ]);

  return paginar(data, total, page, pageSize);
}

export async function getExtraescolarById(idextraescolar: string) {
  const extraescolar = await prisma.extraescolar.findUnique({ where: { idextraescolar } });
  if (!extraescolar) {
    throw ApiError.notFound(`No existe una actividad extraescolar con id ${idextraescolar}.`);
  }
  return extraescolar;
}

export async function createExtraescolar(data: CreateExtraescolarInput) {
  const existente = await prisma.extraescolar.findUnique({
    where: { nombreextra: data.nombreextra },
  });
  if (existente) {
    throw ApiError.conflict(`Ya existe la actividad extraescolar "${data.nombreextra}".`);
  }

  return reintentarSiIdDuplicado(
    () =>
      conCandado("extraescolar.idextraescolar", async (tx) => {
        const idextraescolar = await generarIdExtraescolar(data.nombreextra, tx);
        return tx.extraescolar.create({ data: { idextraescolar, nombreextra: data.nombreextra } });
      }),
    "idextraescolar"
  );
}

export async function updateExtraescolar(idextraescolar: string, data: UpdateExtraescolarInput) {
  await getExtraescolarById(idextraescolar);
  const homonima = await prisma.extraescolar.findFirst({
    where: { nombreextra: data.nombreextra, NOT: { idextraescolar } },
  });
  if (homonima) {
    throw ApiError.conflict(`Ya existe la actividad extraescolar "${data.nombreextra}".`);
  }
  return prisma.extraescolar.update({ where: { idextraescolar }, data });
}

export async function deleteExtraescolar(idextraescolar: string, confirmar: boolean) {
  await prisma.$transaction(async (tx) => {
    if (!(await bloquearFila(tx, "extraescolar", "idextraescolar", idextraescolar))) {
      throw ApiError.notFound(`No existe una actividad extraescolar con id ${idextraescolar}.`);
    }

    const grupos = await tx.grupo.findMany({
      where: { idextraescolar },
      select: { idgrupo: true },
    });
    const inscripciones = await tx.alumnoGrupo.count({
      where: { idgrupo: { in: grupos.map((g) => g.idgrupo) } },
    });

    exigirConfirmacionSiHayImpacto({
      confirmar,
      mensaje:
        `Esta actividad tiene ${grupos.length} grupo(s) asociado(s), con ${inscripciones} ` +
        "inscripcion(es)/calificacion(es) de alumnos en total. Si continuas, se borraran los grupos " +
        "y ese historial junto con la actividad.",
      detalles: { gruposAfectados: grupos.length, inscripcionesAfectadas: inscripciones },
    });

    await tx.extraescolar.delete({ where: { idextraescolar } });
  });
}

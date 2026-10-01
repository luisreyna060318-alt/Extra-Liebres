import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
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
  const where = search
    ? {
        OR: [
          { idextraescolar: { contains: search, mode: "insensitive" as const } },
          { nombreextra: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

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

  return reintentarSiIdDuplicado(async () => {
    const idextraescolar = await generarIdExtraescolar(data.nombreextra);
    return prisma.extraescolar.create({ data: { idextraescolar, nombreextra: data.nombreextra } });
  });
}

export async function updateExtraescolar(idextraescolar: string, data: UpdateExtraescolarInput) {
  await getExtraescolarById(idextraescolar);
  return prisma.extraescolar.update({ where: { idextraescolar }, data });
}

export async function deleteExtraescolar(idextraescolar: string, confirmar: boolean) {
  await getExtraescolarById(idextraescolar);

  const grupos = await prisma.grupo.findMany({
    where: { idextraescolar },
    select: { idgrupo: true },
  });
  const inscripciones = await prisma.alumnoGrupo.count({
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

  await prisma.extraescolar.delete({ where: { idextraescolar } });
}

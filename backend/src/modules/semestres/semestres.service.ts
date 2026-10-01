import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { exigirConfirmacionSiHayImpacto } from "../../utils/confirmarBorrado";
import { generarIdSemestre } from "../../utils/idGenerators";
import { calcularSkip, paginar } from "../../utils/pagination";
import { CreateSemestreInput } from "./semestres.schema";

export async function searchSemestres(search: string | undefined, page: number, pageSize: number) {
  const where = search
    ? {
        OR: [
          { anio: { contains: search } },
          { idsemestre: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [data, total] = await Promise.all([
    prisma.semestre.findMany({
      where,
      orderBy: [{ anio: "desc" as const }, { idsemestre: "asc" as const }],
      skip: calcularSkip(page, pageSize),
      take: pageSize,
    }),
    prisma.semestre.count({ where }),
  ]);

  return paginar(data, total, page, pageSize);
}

export async function getSemestreById(idsemestre: string) {
  const semestre = await prisma.semestre.findUnique({ where: { idsemestre } });
  if (!semestre) {
    throw ApiError.notFound(`No existe un semestre con id ${idsemestre}.`);
  }
  return semestre;
}

export async function createSemestre(data: CreateSemestreInput) {
  const idsemestre = generarIdSemestre(data.mesinicio, data.mestermino, data.anio);

  const existente = await prisma.semestre.findUnique({ where: { idsemestre } });
  if (existente) {
    throw ApiError.conflict(`Ya existe el semestre ${idsemestre} para el anio ${data.anio}.`);
  }

  return prisma.semestre.create({ data: { ...data, idsemestre } });
}

export async function deleteSemestre(idsemestre: string, confirmar: boolean) {
  await getSemestreById(idsemestre);

  const gruposAfectados = await prisma.grupo.count({ where: { idsemestre } });

  exigirConfirmacionSiHayImpacto({
    confirmar,
    mensaje:
      `Este semestre esta asignado a ${gruposAfectados} grupo(s). Si continuas, esos grupos ` +
      "quedaran sin semestre asignado (no se borraran, solo se desvincula el periodo).",
    detalles: { gruposAfectados },
  });

  await prisma.semestre.delete({ where: { idsemestre } });
}

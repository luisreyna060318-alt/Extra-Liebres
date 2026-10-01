import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { exigirConfirmacionSiHayImpacto } from "../../utils/confirmarBorrado";
import { calcularSkip, paginar } from "../../utils/pagination";
import { CreatePromotorInput, UpdatePromotorInput } from "./promotores.schema";

export async function searchPromotores(search: string | undefined, page: number, pageSize: number) {
  const where = search
    ? {
        OR: [
          { rfc: { contains: search, mode: "insensitive" as const } },
          { nombre: { contains: search, mode: "insensitive" as const } },
          { appaterno: { contains: search, mode: "insensitive" as const } },
          { apmaterno: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [data, total] = await Promise.all([
    prisma.promotor.findMany({
      where,
      orderBy: { rfc: "asc" },
      skip: calcularSkip(page, pageSize),
      take: pageSize,
    }),
    prisma.promotor.count({ where }),
  ]);

  return paginar(data, total, page, pageSize);
}

export async function getPromotorByRfc(rfc: string) {
  const promotor = await prisma.promotor.findUnique({ where: { rfc } });
  if (!promotor) {
    throw ApiError.notFound(`No existe un promotor con RFC ${rfc}.`);
  }
  return promotor;
}

export async function createPromotor(data: CreatePromotorInput) {
  const existente = await prisma.promotor.findUnique({ where: { rfc: data.rfc } });
  if (existente) {
    throw ApiError.conflict(`Ya existe un promotor con RFC ${data.rfc}.`);
  }
  return prisma.promotor.create({ data });
}

export async function updatePromotor(rfc: string, data: UpdatePromotorInput) {
  await getPromotorByRfc(rfc);
  return prisma.promotor.update({ where: { rfc }, data });
}

export async function deletePromotor(rfc: string, confirmar: boolean) {
  await getPromotorByRfc(rfc);

  const grupos = await prisma.grupo.findMany({ where: { rfcpromotor: rfc }, select: { idgrupo: true } });
  const inscripciones = await prisma.alumnoGrupo.count({
    where: { idgrupo: { in: grupos.map((g) => g.idgrupo) } },
  });

  exigirConfirmacionSiHayImpacto({
    confirmar,
    mensaje:
      `Este promotor tiene ${grupos.length} grupo(s) asociado(s), con ${inscripciones} ` +
      "inscripcion(es)/calificacion(es) de alumnos en total. Si continuas, se borraran los grupos " +
      "y ese historial junto con el promotor.",
    detalles: { gruposAfectados: grupos.length, inscripcionesAfectadas: inscripciones },
  });

  await prisma.promotor.delete({ where: { rfc } });
}

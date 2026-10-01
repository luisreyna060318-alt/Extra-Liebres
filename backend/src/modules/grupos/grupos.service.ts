import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { exigirConfirmacionSiHayImpacto } from "../../utils/confirmarBorrado";
import { generarIdGrupo } from "../../utils/idGenerators";
import { calcularSkip, paginar } from "../../utils/pagination";
import { reintentarSiIdDuplicado } from "../../utils/retry";
import { CreateGrupoInput, UpdateGrupoInput } from "./grupos.schema";

const INCLUDE_RELACIONES = {
  extraescolar: true,
  promotor: true,
  semestre: true,
} satisfies Prisma.GrupoInclude;

export async function searchGrupos(filtros: {
  search?: string;
  extraescolar?: string;
  promotor?: string;
  anio?: string;
  page: number;
  pageSize: number;
}) {
  const where: Prisma.GrupoWhereInput = { AND: [] };
  const and = where.AND as Prisma.GrupoWhereInput[];

  if (filtros.search) {
    and.push({
      OR: [
        { idgrupo: { contains: filtros.search, mode: "insensitive" } },
        { extraescolar: { nombreextra: { contains: filtros.search, mode: "insensitive" } } },
        { promotor: { nombre: { contains: filtros.search, mode: "insensitive" } } },
        { promotor: { appaterno: { contains: filtros.search, mode: "insensitive" } } },
      ],
    });
  }
  if (filtros.extraescolar) {
    and.push({ extraescolar: { nombreextra: { contains: filtros.extraescolar, mode: "insensitive" } } });
  }
  if (filtros.promotor) {
    and.push({
      OR: [
        { promotor: { nombre: { contains: filtros.promotor, mode: "insensitive" } } },
        { promotor: { appaterno: { contains: filtros.promotor, mode: "insensitive" } } },
        { promotor: { apmaterno: { contains: filtros.promotor, mode: "insensitive" } } },
      ],
    });
  }
  if (filtros.anio) {
    and.push({ semestre: { anio: { contains: filtros.anio } } });
  }

  const where_ = and.length > 0 ? where : undefined;

  const [data, total] = await Promise.all([
    prisma.grupo.findMany({
      where: where_,
      include: INCLUDE_RELACIONES,
      orderBy: { idgrupo: "asc" },
      skip: calcularSkip(filtros.page, filtros.pageSize),
      take: filtros.pageSize,
    }),
    prisma.grupo.count({ where: where_ }),
  ]);

  return paginar(data, total, filtros.page, filtros.pageSize);
}

export async function getGrupoById(idgrupo: string) {
  const grupo = await prisma.grupo.findUnique({
    where: { idgrupo },
    include: INCLUDE_RELACIONES,
  });
  if (!grupo) {
    throw ApiError.notFound(`No existe un grupo con id ${idgrupo}.`);
  }
  return grupo;
}

export async function createGrupo(data: CreateGrupoInput) {
  const [extraescolar, promotor, semestre] = await Promise.all([
    prisma.extraescolar.findUnique({ where: { idextraescolar: data.idextraescolar } }),
    prisma.promotor.findUnique({ where: { rfc: data.rfcpromotor } }),
    prisma.semestre.findUnique({ where: { idsemestre: data.idsemestre } }),
  ]);
  if (!extraescolar) throw ApiError.badRequest("La actividad extraescolar seleccionada no existe.");
  if (!promotor) throw ApiError.badRequest("El promotor seleccionado no existe.");
  if (!semestre) throw ApiError.badRequest("El semestre seleccionado no existe.");

  // Zod ya valido que primerdia/segundodia solo pueden ser los literales del
  // enum DiaSemana de Prisma; el cast aqui solo traduce el tipo, no el valor.
  return reintentarSiIdDuplicado(async () => {
    const idgrupo = await generarIdGrupo({
      idextraescolar: data.idextraescolar,
      rfcpromotor: data.rfcpromotor,
      idsemestre: data.idsemestre,
    });

    return prisma.grupo.create({
      data: { ...data, idgrupo } as unknown as Prisma.GrupoUncheckedCreateInput,
      include: INCLUDE_RELACIONES,
    });
  });
}

export async function updateGrupo(idgrupo: string, data: UpdateGrupoInput) {
  await getGrupoById(idgrupo);
  return prisma.grupo.update({
    where: { idgrupo },
    data: data as unknown as Prisma.GrupoUncheckedUpdateInput,
    include: INCLUDE_RELACIONES,
  });
}

export async function deleteGrupo(idgrupo: string, confirmar: boolean) {
  await getGrupoById(idgrupo);

  const inscripciones = await prisma.alumnoGrupo.count({ where: { idgrupo } });
  exigirConfirmacionSiHayImpacto({
    confirmar,
    mensaje:
      `Este grupo tiene ${inscripciones} alumno(s) inscrito(s) con calificacion registrada. ` +
      "Si continuas, se borrara ese historial junto con el grupo.",
    detalles: { inscripcionesAfectadas: inscripciones },
  });

  await prisma.grupo.delete({ where: { idgrupo } });
}

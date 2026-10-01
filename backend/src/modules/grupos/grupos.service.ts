import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { bloquearFila, conCandado } from "../../utils/bloqueo";
import { cadaPalabraEnAlgunCampo } from "../../utils/busqueda";
import { exigirConfirmacionSiHayImpacto } from "../../utils/confirmarBorrado";
import { generarIdGrupo } from "../../utils/idGenerators";
import { calcularSkip, paginar } from "../../utils/pagination";
import { reintentarSiIdDuplicado } from "../../utils/retry";
import {
  CreateGrupoInput,
  FiltrosGrupos,
  horarioCompletoSchema,
  UpdateGrupoInput,
} from "./grupos.schema";

const INCLUDE_RELACIONES = {
  extraescolar: true,
  promotor: true,
  semestre: true,
} satisfies Prisma.GrupoInclude;

export async function searchGrupos(filtros: FiltrosGrupos) {
  const and: Prisma.GrupoWhereInput[] = [];

  const busqueda = cadaPalabraEnAlgunCampo<Prisma.GrupoWhereInput>(filtros.search, (palabra) => [
    { idgrupo: { contains: palabra, mode: "insensitive" } },
    { extraescolar: { nombreextra: { contains: palabra, mode: "insensitive" } } },
    { promotor: { nombre: { contains: palabra, mode: "insensitive" } } },
    { promotor: { appaterno: { contains: palabra, mode: "insensitive" } } },
    { promotor: { apmaterno: { contains: palabra, mode: "insensitive" } } },
  ]);
  if (busqueda) and.push(busqueda);
  if (filtros.idextraescolar) and.push({ idextraescolar: filtros.idextraescolar });
  if (filtros.rfcpromotor) and.push({ rfcpromotor: filtros.rfcpromotor });
  if (filtros.extraescolar) {
    and.push({ extraescolar: { nombreextra: { contains: filtros.extraescolar, mode: "insensitive" } } });
  }
  const porPromotor = cadaPalabraEnAlgunCampo<Prisma.GrupoWhereInput>(filtros.promotor, (palabra) => [
    { promotor: { nombre: { contains: palabra, mode: "insensitive" } } },
    { promotor: { appaterno: { contains: palabra, mode: "insensitive" } } },
    { promotor: { apmaterno: { contains: palabra, mode: "insensitive" } } },
  ]);
  if (porPromotor) and.push(porPromotor);
  if (filtros.anio) {
    and.push({ semestre: { anio: { contains: filtros.anio } } });
  }

  const where: Prisma.GrupoWhereInput | undefined = and.length > 0 ? { AND: and } : undefined;

  const [data, total] = await Promise.all([
    prisma.grupo.findMany({
      where,
      include: INCLUDE_RELACIONES,
      orderBy: { idgrupo: "asc" },
      skip: calcularSkip(filtros.page, filtros.pageSize),
      take: filtros.pageSize,
    }),
    prisma.grupo.count({ where }),
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

  return reintentarSiIdDuplicado(
    () =>
      conCandado("grupo.idgrupo", async (tx) => {
        const idgrupo = await generarIdGrupo(
          {
            idextraescolar: data.idextraescolar,
            rfcpromotor: data.rfcpromotor,
            idsemestre: data.idsemestre,
          },
          tx
        );
        return tx.grupo.create({
          data: { ...data, idgrupo },
          include: INCLUDE_RELACIONES,
        });
      }),
    "idgrupo"
  );
}

export async function updateGrupo(idgrupo: string, data: UpdateGrupoInput) {
  const actual = await getGrupoById(idgrupo);

  // undefined = no se envio (se conserva lo guardado); null = vaciar.
  const conservar = <T>(nuevo: T | undefined, guardado: T): T => (nuevo === undefined ? guardado : nuevo);
  const horario = {
    primerdia: conservar(data.primerdia, actual.primerdia),
    segundodia: conservar(data.segundodia, actual.segundodia),
    horainicio: conservar(data.horainicio, actual.horainicio),
    horatermino: conservar(data.horatermino, actual.horatermino),
    aula: conservar(data.aula, actual.aula),
  };

  const validacion = horarioCompletoSchema.safeParse(horario);
  if (!validacion.success) {
    throw ApiError.badRequest("Datos de entrada invalidos", validacion.error.flatten());
  }

  return prisma.grupo.update({
    where: { idgrupo },
    data: horario,
    include: INCLUDE_RELACIONES,
  });
}

export async function deleteGrupo(idgrupo: string, confirmar: boolean) {
  await prisma.$transaction(async (tx) => {
    if (!(await bloquearFila(tx, "grupo", "idgrupo", idgrupo))) {
      throw ApiError.notFound(`No existe un grupo con id ${idgrupo}.`);
    }

    const inscripciones = await tx.alumnoGrupo.count({ where: { idgrupo } });
    exigirConfirmacionSiHayImpacto({
      confirmar,
      mensaje:
        `Este grupo tiene ${inscripciones} alumno(s) inscrito(s) con calificacion registrada. ` +
        "Si continuas, se borrara ese historial junto con el grupo.",
      detalles: { inscripcionesAfectadas: inscripciones },
    });

    await tx.grupo.delete({ where: { idgrupo } });
  });
}

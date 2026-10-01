import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { exigirConfirmacionSiHayImpacto } from "../../utils/confirmarBorrado";
import { calcularSkip, paginar } from "../../utils/pagination";
import { CreateAlumnoInput, FiltrosAlumnos, UpdateAlumnoInput } from "./alumnos.schema";

const INCLUDE_CARRERA = { carrera: true } satisfies Prisma.AlumnoInclude;

const EXPORT_MAX = 10_000;

function construirWhereAlumnos(filtros: FiltrosAlumnos): Prisma.AlumnoWhereInput | undefined {
  const and: Prisma.AlumnoWhereInput[] = [];

  if (filtros.search) {
    and.push({
      OR: [
        { nocontrol: { contains: filtros.search } },
        { nombre: { contains: filtros.search, mode: "insensitive" } },
        { appaterno: { contains: filtros.search, mode: "insensitive" } },
        { apmaterno: { contains: filtros.search, mode: "insensitive" } },
      ],
    });
  }
  if (filtros.idcarrera) and.push({ idcarrera: filtros.idcarrera });
  if (filtros.campus) and.push({ campus: filtros.campus });
  if (filtros.sexo) and.push({ sexo: filtros.sexo });

  return and.length > 0 ? { AND: and } : undefined;
}

export async function searchAlumnos(filtros: FiltrosAlumnos, page: number, pageSize: number) {
  const where = construirWhereAlumnos(filtros);

  const [data, total] = await Promise.all([
    prisma.alumno.findMany({
      where,
      include: INCLUDE_CARRERA,
      orderBy: { nocontrol: "asc" },
      skip: calcularSkip(page, pageSize),
      take: pageSize,
    }),
    prisma.alumno.count({ where }),
  ]);

  return paginar(data, total, page, pageSize);
}

/** Mismos filtros que el listado, pero sin paginar (hasta EXPORT_MAX filas) para exportar a CSV. */
export async function listAlumnosParaExportar(filtros: FiltrosAlumnos) {
  return prisma.alumno.findMany({
    where: construirWhereAlumnos(filtros),
    include: INCLUDE_CARRERA,
    orderBy: { nocontrol: "asc" },
    take: EXPORT_MAX,
  });
}

export async function getAlumnoByNocontrol(nocontrol: string) {
  const alumno = await prisma.alumno.findUnique({
    where: { nocontrol },
    include: INCLUDE_CARRERA,
  });
  if (!alumno) {
    throw ApiError.notFound(`No existe un alumno con numero de control ${nocontrol}.`);
  }
  return alumno;
}

async function asegurarCarreraExiste(idcarrera: string): Promise<void> {
  const carrera = await prisma.carrera.findUnique({ where: { idcarrera } });
  if (!carrera) {
    throw ApiError.badRequest("La carrera seleccionada no existe.");
  }
}

export async function createAlumno(data: CreateAlumnoInput) {
  const existente = await prisma.alumno.findUnique({ where: { nocontrol: data.nocontrol } });
  if (existente) {
    throw ApiError.conflict(`Ya existe un alumno con numero de control ${data.nocontrol}.`);
  }
  await asegurarCarreraExiste(data.idcarrera);

  return prisma.alumno.create({
    data: data as unknown as Prisma.AlumnoUncheckedCreateInput,
    include: INCLUDE_CARRERA,
  });
}

export async function updateAlumno(nocontrol: string, data: UpdateAlumnoInput) {
  await getAlumnoByNocontrol(nocontrol);
  if (data.idcarrera) {
    await asegurarCarreraExiste(data.idcarrera);
  }
  return prisma.alumno.update({
    where: { nocontrol },
    data: data as unknown as Prisma.AlumnoUncheckedUpdateInput,
    include: INCLUDE_CARRERA,
  });
}

export async function deleteAlumno(nocontrol: string, confirmar: boolean) {
  await getAlumnoByNocontrol(nocontrol);

  const inscripciones = await prisma.alumnoGrupo.count({ where: { nocontrol } });
  exigirConfirmacionSiHayImpacto({
    confirmar,
    mensaje: `Este alumno tiene ${inscripciones} inscripcion(es) con calificacion registrada en su historial. Si continuas, se borrara ese historial junto con el alumno.`,
    detalles: { inscripcionesAfectadas: inscripciones },
  });

  await prisma.alumno.delete({ where: { nocontrol } });
}

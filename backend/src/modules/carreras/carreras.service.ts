import { prisma } from "../../config/prisma";
import { ApiError } from "../../utils/ApiError";
import { generarIdCarrera } from "../../utils/idGenerators";
import { calcularSkip, paginar } from "../../utils/pagination";
import { reintentarSiIdDuplicado } from "../../utils/retry";
import { CreateCarreraInput, UpdateCarreraInput } from "./carreras.schema";

export async function searchCarreras(search: string | undefined, page: number, pageSize: number) {
  const where = search ? { nombre: { contains: search, mode: "insensitive" as const } } : undefined;

  const [data, total] = await Promise.all([
    prisma.carrera.findMany({
      where,
      orderBy: { nombre: "asc" },
      skip: calcularSkip(page, pageSize),
      take: pageSize,
    }),
    prisma.carrera.count({ where }),
  ]);

  return paginar(data, total, page, pageSize);
}

export async function getCarreraById(idcarrera: string) {
  const carrera = await prisma.carrera.findUnique({ where: { idcarrera } });
  if (!carrera) {
    throw ApiError.notFound(`No existe una carrera con id ${idcarrera}.`);
  }
  return carrera;
}

export async function createCarrera(data: CreateCarreraInput) {
  const existente = await prisma.carrera.findUnique({ where: { nombre: data.nombre } });
  if (existente) {
    throw ApiError.conflict(`Ya existe la carrera "${data.nombre}".`);
  }

  return reintentarSiIdDuplicado(async () => {
    const idcarrera = await generarIdCarrera(data.nombre);
    return prisma.carrera.create({ data: { idcarrera, nombre: data.nombre } });
  });
}

export async function updateCarrera(idcarrera: string, data: UpdateCarreraInput) {
  await getCarreraById(idcarrera);
  return prisma.carrera.update({ where: { idcarrera }, data });
}

/**
 * A diferencia de grupo/alumno/promotor/extraescolar, borrar una carrera
 * NUNCA cascada hacia los alumnos que la tienen asignada (borrar un catalogo
 * de programas academicos no puede implicar borrar personas). Si esta en
 * uso, se bloquea sin opcion de "confirmar y continuar".
 */
export async function deleteCarrera(idcarrera: string) {
  await getCarreraById(idcarrera);

  const alumnosAsignados = await prisma.alumno.count({ where: { idcarrera } });
  if (alumnosAsignados > 0) {
    throw ApiError.conflict(
      `No puedes borrar esta carrera: tiene ${alumnosAsignados} alumno(s) asignado(s). ` +
        "Reasigna a esos alumnos a otra carrera antes de borrarla.",
      { alumnosAsignados }
    );
  }

  await prisma.carrera.delete({ where: { idcarrera } });
}

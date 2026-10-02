import { Prisma } from "@prisma/client";

/** true si `error` es una violacion de llave unica (P2002) sobre `campo`. */
export function esDuplicadoEn(error: unknown, campo: string): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  if (Array.isArray(target)) return target.includes(campo);
  if (typeof target === "string") return target.includes(campo) || target.endsWith("_pkey");
  return false;
}

/**
 * Red de seguridad para las altas que generan un ID de negocio: si la
 * insercion choca contra la llave primaria `campoId` (por ejemplo, porque
 * otro proceso fuera de la API inserto el mismo ID), se recalcula y se
 * reintenta. Un choque contra OTRA restriccion unica (p. ej. el nombre) se
 * propaga de inmediato: reintentar no lo resolveria.
 */
export async function reintentarSiIdDuplicado<T>(
  operacion: () => Promise<T>,
  campoId: string,
  intentos = 5
): Promise<T> {
  let ultimoError: unknown;

  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await operacion();
    } catch (error) {
      if (!esDuplicadoEn(error, campoId)) {
        throw error;
      }
      ultimoError = error;
    }
  }

  throw ultimoError;
}

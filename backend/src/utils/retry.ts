import { Prisma } from "@prisma/client";

/**
 * Reintenta una operacion que genera un ID de negocio (idextraescolar,
 * idcarrera, idgrupo) leyendo el maximo actual y sumando 1. Esa lectura no
 * esta bloqueada, asi que dos altas concurrentes pueden calcular el mismo
 * candidato: la primera inserta con exito, la segunda choca contra la
 * restriccion UNIQUE (P2002) del ID. En vez de devolver ese error al
 * usuario, se vuelve a calcular el ID (ya con el nuevo maximo) y se
 * reintenta, de forma transparente.
 */
export async function reintentarSiIdDuplicado<T>(
  operacion: () => Promise<T>,
  intentos = 5
): Promise<T> {
  let ultimoError: unknown;

  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await operacion();
    } catch (error) {
      const esConflictoDeId =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
      if (!esConflictoDeId) {
        throw error;
      }
      ultimoError = error;
    }
  }

  throw ultimoError;
}

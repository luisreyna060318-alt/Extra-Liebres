import { z } from "zod";
import { ApiError } from "./ApiError";

/**
 * Query param compartido por los endpoints DELETE que pueden tener efectos
 * secundarios (borrado en cascada, desvinculacion). El cliente debe repetir
 * la solicitud con "?confirmar=true" una vez que el usuario acepto la
 * advertencia devuelta en el primer intento.
 */
export const confirmarQuerySchema = z.object({
  confirmar: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

/**
 * Si hay registros dependientes y el cliente no confirmo explicitamente,
 * corta la operacion con 409 y el detalle del impacto para que el frontend
 * pueda mostrar una advertencia especifica antes de reintentar.
 */
export function exigirConfirmacionSiHayImpacto(params: {
  confirmar: boolean;
  mensaje: string;
  detalles: Record<string, number>;
}): void {
  if (params.confirmar) return;

  const hayImpacto = Object.values(params.detalles).some((cantidad) => cantidad > 0);
  if (!hayImpacto) return;

  throw ApiError.conflict(params.mensaje, {
    requiereConfirmacion: true,
    ...params.detalles,
  });
}

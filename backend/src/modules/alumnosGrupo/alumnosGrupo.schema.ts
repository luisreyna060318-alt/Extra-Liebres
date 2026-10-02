import { z } from "zod";
import { nocontrolSchema } from "../../utils/validaciones";

/** Maximo de alumnos por operacion de inscripcion/baja (cupo holgado de un grupo). */
export const MAX_ALUMNOS_POR_LOTE = 200;

export const idGrupoParamSchema = z.object({
  idgrupo: z.string().trim().min(1).max(120),
});

export const enrollBatchSchema = z.object({
  alumnos: z
    .array(
      z.object({
        nocontrol: nocontrolSchema,
        calificacion: z.coerce.number().int().min(0).max(4),
      })
    )
    .min(1, "Debes incluir al menos un alumno.")
    .max(MAX_ALUMNOS_POR_LOTE, `Puedes inscribir hasta ${MAX_ALUMNOS_POR_LOTE} alumnos por operacion.`),
});

export const unenrollBatchSchema = z.object({
  nocontrol: z
    .array(nocontrolSchema)
    .min(1, "Debes incluir al menos un alumno.")
    .max(MAX_ALUMNOS_POR_LOTE, `Puedes retirar hasta ${MAX_ALUMNOS_POR_LOTE} alumnos por operacion.`),
});

export type EnrollBatchInput = z.infer<typeof enrollBatchSchema>;
export type UnenrollBatchInput = z.infer<typeof unenrollBatchSchema>;

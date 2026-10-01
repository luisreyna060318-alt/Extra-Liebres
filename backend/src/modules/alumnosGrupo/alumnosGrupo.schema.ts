import { z } from "zod";

export const idGrupoParamSchema = z.object({
  idgrupo: z.string().trim().min(1).max(120),
});

export const enrollBatchSchema = z.object({
  alumnos: z
    .array(
      z.object({
        nocontrol: z.string().trim().regex(/^\d{1,10}$/, "Numero de control invalido."),
        calificacion: z.coerce.number().int().min(0).max(4),
      })
    )
    .min(1, "Debes incluir al menos un alumno."),
});

export const unenrollBatchSchema = z.object({
  nocontrol: z
    .array(z.string().trim().regex(/^\d{1,10}$/, "Numero de control invalido."))
    .min(1, "Debes incluir al menos un alumno."),
});

export type EnrollBatchInput = z.infer<typeof enrollBatchSchema>;
export type UnenrollBatchInput = z.infer<typeof unenrollBatchSchema>;

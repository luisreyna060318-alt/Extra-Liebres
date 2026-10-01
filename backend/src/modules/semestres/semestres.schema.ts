import { z } from "zod";
import { confirmarQuerySchema } from "../../utils/confirmarBorrado";
import { paginationQuerySchema } from "../../utils/pagination";

export const idSemestreParamSchema = z.object({
  idsemestre: z.string().trim().min(1).max(6),
});

export const listSemestresQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(4).optional(),
});

export const deleteSemestreQuerySchema = confirmarQuerySchema;

// El sistema academico solo opera dos periodos por anio: ENERO-JUNIO y AGOSTO-DICIEMBRE.
export const createSemestreSchema = z
  .object({
    mesinicio: z.enum(["ENERO", "AGOSTO"], {
      errorMap: () => ({ message: "El mes de inicio debe ser ENERO o AGOSTO." }),
    }),
    mestermino: z.enum(["JUNIO", "DICIEMBRE"], {
      errorMap: () => ({ message: "El mes de termino debe ser JUNIO o DICIEMBRE." }),
    }),
    anio: z.string().trim().regex(/^\d{4}$/, "El anio debe tener exactamente 4 digitos."),
  })
  .refine(
    (data) =>
      (data.mesinicio === "ENERO" && data.mestermino === "JUNIO") ||
      (data.mesinicio === "AGOSTO" && data.mestermino === "DICIEMBRE"),
    { message: "ENERO debe emparejarse con JUNIO, y AGOSTO con DICIEMBRE." }
  );

export type CreateSemestreInput = z.infer<typeof createSemestreSchema>;

import { z } from "zod";
import { confirmarQuerySchema } from "../../utils/confirmarBorrado";
import { paginationQuerySchema } from "../../utils/pagination";

export const idExtraescolarParamSchema = z.object({
  idextraescolar: z.string().trim().min(1).max(20),
});

export const listExtraescolaresQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
});

export const deleteExtraescolarQuerySchema = confirmarQuerySchema;

export const createExtraescolarSchema = z.object({
  nombreextra: z.string().trim().min(1, "El nombre de la actividad es obligatorio.").max(120),
});

export const updateExtraescolarSchema = z.object({
  nombreextra: z.string().trim().min(1, "El nombre de la actividad es obligatorio.").max(120),
});

export type CreateExtraescolarInput = z.infer<typeof createExtraescolarSchema>;
export type UpdateExtraescolarInput = z.infer<typeof updateExtraescolarSchema>;

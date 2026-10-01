import { z } from "zod";
import { paginationQuerySchema } from "../../utils/pagination";

export const idCarreraParamSchema = z.object({
  idcarrera: z.string().trim().min(1).max(20),
});

export const listCarrerasQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
});

export const createCarreraSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre de la carrera es obligatorio.").max(120),
});

export const updateCarreraSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre de la carrera es obligatorio.").max(120),
});

export type CreateCarreraInput = z.infer<typeof createCarreraSchema>;
export type UpdateCarreraInput = z.infer<typeof updateCarreraSchema>;

import { z } from "zod";
import { confirmarQuerySchema } from "../../utils/confirmarBorrado";
import { paginationQuerySchema } from "../../utils/pagination";

const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;

export const rfcParamSchema = z.object({
  rfc: z.string().trim().min(1).max(13),
});

export const listPromotoresQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(120).optional(),
});

export const deletePromotorQuerySchema = confirmarQuerySchema;

const camposComunes = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(50),
  appaterno: z.string().trim().min(1, "El apellido paterno es obligatorio.").max(50),
  apmaterno: z.string().trim().min(1, "El apellido materno es obligatorio.").max(50),
};

export const createPromotorSchema = z.object({
  rfc: z
    .string()
    .trim()
    .toUpperCase()
    .max(13)
    .regex(rfcRegex, "El RFC no tiene un formato valido."),
  ...camposComunes,
});

export const updatePromotorSchema = z.object(camposComunes).partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar." }
);

export type CreatePromotorInput = z.infer<typeof createPromotorSchema>;
export type UpdatePromotorInput = z.infer<typeof updatePromotorSchema>;

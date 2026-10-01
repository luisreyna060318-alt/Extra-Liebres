import { z } from "zod";

/** Numero de control: solo digitos, hasta 11 (el ancho de la columna alumno.nocontrol). */
export const nocontrolSchema = z
  .string()
  .trim()
  .regex(/^\d{1,11}$/, "El numero de control debe ser numerico (maximo 11 digitos).");

/**
 * Campo opcional que se puede vaciar en una actualizacion:
 * - ausente (undefined) -> undefined: Prisma no lo toca;
 * - "" o null           -> null: se borra el valor guardado.
 */
export function vaciable<T extends z.ZodTypeAny>(schema: T, mensaje?: string) {
  return z
    .union([schema, z.literal(""), z.null()], mensaje ? { errorMap: () => ({ message: mensaje }) } : undefined)
    .optional()
    .transform((valor): z.output<T> | null | undefined => (valor === "" ? null : valor));
}

import { z } from "zod";
import { confirmarQuerySchema } from "../../utils/confirmarBorrado";
import { paginationQuerySchema } from "../../utils/pagination";

export const nocontrolParamSchema = z.object({
  nocontrol: z
    .string()
    .trim()
    .regex(/^\d{1,11}$/, "El numero de control debe ser numerico (maximo 11 digitos)."),
});

const filtrosAlumnos = {
  search: z.string().trim().max(120).optional(),
  idcarrera: z.string().trim().max(20).optional(),
  campus: z.enum(["CAMPUS_1", "CAMPUS_2"]).optional(),
  sexo: z.enum(["MASCULINO", "FEMENINO"]).optional(),
};

export const listAlumnosQuerySchema = paginationQuerySchema.extend(filtrosAlumnos);

export const exportAlumnosQuerySchema = z.object(filtrosAlumnos);

export const deleteAlumnoQuerySchema = confirmarQuerySchema;

export type FiltrosAlumnos = z.infer<typeof exportAlumnosQuerySchema>;

const camposComunes = {
  nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(50),
  appaterno: z.string().trim().min(1, "El apellido paterno es obligatorio.").max(50),
  apmaterno: z
    .string()
    .trim()
    .max(50)
    .optional()
    .transform((valor) => (valor === "" ? undefined : valor)),
  sexo: z
    .union([z.enum(["MASCULINO", "FEMENINO"]), z.literal("")], {
      errorMap: () => ({ message: "El sexo debe ser MASCULINO, FEMENINO o quedar en blanco." }),
    })
    .optional()
    .transform((valor) => (valor === "" ? undefined : valor)),
  idcarrera: z.string().trim().min(1, "La carrera es obligatoria.").max(20),
  campus: z.enum(["CAMPUS_1", "CAMPUS_2"], {
    errorMap: () => ({ message: "El campus debe ser CAMPUS_1 o CAMPUS_2." }),
  }),
};

export const createAlumnoSchema = z.object({
  nocontrol: z
    .string()
    .trim()
    .regex(/^\d{1,11}$/, "El numero de control debe ser numerico (maximo 11 digitos)."),
  ...camposComunes,
});

export const updateAlumnoSchema = z.object(camposComunes).partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar." }
);

export type CreateAlumnoInput = z.infer<typeof createAlumnoSchema>;
export type UpdateAlumnoInput = z.infer<typeof updateAlumnoSchema>;

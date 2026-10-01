import { z } from "zod";
import { confirmarQuerySchema } from "../../utils/confirmarBorrado";
import { paginationQuerySchema } from "../../utils/pagination";
import { nocontrolSchema, vaciable } from "../../utils/validaciones";

export const nocontrolParamSchema = z.object({
  nocontrol: nocontrolSchema,
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
  // "" o null vacian el campo (sin apellido materno / sexo sin especificar).
  apmaterno: vaciable(z.string().trim().max(50)),
  sexo: vaciable(
    z.enum(["MASCULINO", "FEMENINO"]),
    "El sexo debe ser MASCULINO, FEMENINO o quedar en blanco."
  ),
  idcarrera: z.string().trim().min(1, "La carrera es obligatoria.").max(20),
  campus: z.enum(["CAMPUS_1", "CAMPUS_2"], {
    errorMap: () => ({ message: "El campus debe ser CAMPUS_1 o CAMPUS_2." }),
  }),
};

export const createAlumnoSchema = z.object({
  nocontrol: nocontrolSchema,
  ...camposComunes,
});

export const updateAlumnoSchema = z.object(camposComunes).partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: "Debes enviar al menos un campo para actualizar." }
);

export type CreateAlumnoInput = z.infer<typeof createAlumnoSchema>;
export type UpdateAlumnoInput = z.infer<typeof updateAlumnoSchema>;

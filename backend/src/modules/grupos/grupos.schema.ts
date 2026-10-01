import { z } from "zod";
import { confirmarQuerySchema } from "../../utils/confirmarBorrado";
import { paginationQuerySchema } from "../../utils/pagination";
import { vaciable } from "../../utils/validaciones";

export const DIAS_SEMANA = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
] as const;

type DiaSemana = (typeof DIAS_SEMANA)[number];

export const idGrupoParamSchema = z.object({
  idgrupo: z.string().trim().min(1).max(120),
});

export const listGruposQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(150).optional(),
  // Filtros exactos por llave (los que usa la interfaz).
  idextraescolar: z.string().trim().max(20).optional(),
  rfcpromotor: z.string().trim().toUpperCase().max(13).optional(),
  // Filtros por texto (compatibilidad): coinciden por subcadena del nombre.
  extraescolar: z.string().trim().max(120).optional(),
  promotor: z.string().trim().max(100).optional(),
  anio: z.string().trim().max(4).optional(),
});

export type FiltrosGrupos = z.infer<typeof listGruposQuerySchema>;

export const deleteGrupoQuerySchema = confirmarQuerySchema;

const horaRegex = /^([01]\d|2[0-3]):00$/;
const dia = z.enum(DIAS_SEMANA);
const hora = z.string().regex(horaRegex, "Formato de hora invalido (HH:00).");

// Cada campo de horario es opcional y se puede vaciar con null o "".
const camposHorario = z.object({
  primerdia: vaciable(dia),
  segundodia: vaciable(dia),
  horainicio: vaciable(hora),
  horatermino: vaciable(hora),
  aula: vaciable(z.string().trim().max(50)),
});

export interface Horario {
  primerdia?: DiaSemana | null;
  segundodia?: DiaSemana | null;
  horainicio?: string | null;
  horatermino?: string | null;
  aula?: string | null;
}

function validarHorario(data: Horario, ctx: z.RefinementCtx): void {
  if (data.segundodia && !data.primerdia) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "No puedes elegir un segundo dia sin haber elegido el primero.",
      path: ["segundodia"],
    });
  }

  if (data.primerdia && data.segundodia) {
    const ordenPrimero = DIAS_SEMANA.indexOf(data.primerdia);
    const ordenSegundo = DIAS_SEMANA.indexOf(data.segundodia);
    if (ordenSegundo <= ordenPrimero) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "El segundo dia debe ser posterior al primer dia de la semana.",
        path: ["segundodia"],
      });
    }
  }

  const tieneInicio = Boolean(data.horainicio);
  const tieneTermino = Boolean(data.horatermino);
  if (tieneInicio !== tieneTermino) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La hora de inicio y termino deben capturarse juntas o ninguna.",
      path: ["horatermino"],
    });
  }

  if (data.horainicio && data.horatermino && data.horatermino <= data.horainicio) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "La hora de termino debe ser posterior a la hora de inicio.",
      path: ["horatermino"],
    });
  }
}

export const createGrupoSchema = camposHorario
  .extend({
    idextraescolar: z.string().trim().min(1, "Selecciona la actividad extraescolar."),
    rfcpromotor: z.string().trim().toUpperCase().min(1, "Selecciona el promotor."),
    idsemestre: z.string().trim().min(1, "Selecciona el semestre."),
  })
  .superRefine(validarHorario);

// Solo se permite editar el horario/aula; las relaciones (extraescolar,
// promotor, semestre) son inmutables tras la creacion, igual que en el sistema original.
// Aqui solo se valida cada campo: las reglas entre campos se aplican en el
// servicio sobre el horario RESULTANTE (lo guardado + lo enviado), porque un
// PUT puede traer solo una parte del horario.
export const updateGrupoSchema = camposHorario;

/** Valida un horario completo (ya fusionado con lo guardado). */
export const horarioCompletoSchema = z
  .object({
    primerdia: dia.nullable(),
    segundodia: dia.nullable(),
    horainicio: hora.nullable(),
    horatermino: hora.nullable(),
    aula: z.string().max(50).nullable(),
  })
  .superRefine(validarHorario);

export type CreateGrupoInput = z.infer<typeof createGrupoSchema>;
export type UpdateGrupoInput = z.infer<typeof updateGrupoSchema>;

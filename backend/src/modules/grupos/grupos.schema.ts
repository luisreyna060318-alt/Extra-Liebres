import { z } from "zod";
import { confirmarQuerySchema } from "../../utils/confirmarBorrado";
import { paginationQuerySchema } from "../../utils/pagination";

export const DIAS_SEMANA = [
  "LUNES",
  "MARTES",
  "MIERCOLES",
  "JUEVES",
  "VIERNES",
  "SABADO",
] as const;

export const idGrupoParamSchema = z.object({
  idgrupo: z.string().trim().min(1).max(120),
});

export const listGruposQuerySchema = paginationQuerySchema.extend({
  search: z.string().trim().max(150).optional(),
  extraescolar: z.string().trim().max(120).optional(),
  promotor: z.string().trim().max(100).optional(),
  anio: z.string().trim().max(4).optional(),
});

export const deleteGrupoQuerySchema = confirmarQuerySchema;

const horaRegex = /^([01]\d|2[0-3]):00$/;

const camposHorario = z.object({
  primerdia: z.enum(DIAS_SEMANA).optional(),
  segundodia: z.enum(DIAS_SEMANA).optional(),
  horainicio: z.string().regex(horaRegex, "Formato de hora invalido (HH:00).").optional(),
  horatermino: z.string().regex(horaRegex, "Formato de hora invalido (HH:00).").optional(),
  aula: z.string().trim().max(50).optional(),
});

function validarHorario(
  data: z.infer<typeof camposHorario>,
  ctx: z.RefinementCtx
): void {
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
    rfcpromotor: z.string().trim().min(1, "Selecciona el promotor."),
    idsemestre: z.string().trim().min(1, "Selecciona el semestre."),
  })
  .superRefine(validarHorario);

// Solo se permite editar el horario/aula; las relaciones (extraescolar,
// promotor, semestre) son inmutables tras la creacion, igual que en el sistema original.
export const updateGrupoSchema = camposHorario.superRefine(validarHorario);

export type CreateGrupoInput = z.infer<typeof createGrupoSchema>;
export type UpdateGrupoInput = z.infer<typeof updateGrupoSchema>;

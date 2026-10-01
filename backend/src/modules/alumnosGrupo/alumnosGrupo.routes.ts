import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as alumnosGrupoController from "./alumnosGrupo.controller";
import {
  enrollBatchSchema,
  idGrupoParamSchema,
  unenrollBatchSchema,
} from "./alumnosGrupo.schema";

// mergeParams: true permite leer ":idgrupo" definido por el router padre (grupos.routes.ts).
export const alumnosGrupoRouter = Router({ mergeParams: true });

alumnosGrupoRouter.get(
  "/",
  validate({ params: idGrupoParamSchema }),
  alumnosGrupoController.getRoster
);

alumnosGrupoRouter.post(
  "/",
  validate({ params: idGrupoParamSchema, body: enrollBatchSchema }),
  alumnosGrupoController.enrollAlumnos
);

alumnosGrupoRouter.delete(
  "/",
  validate({ params: idGrupoParamSchema, body: unenrollBatchSchema }),
  alumnosGrupoController.unenrollAlumnos
);

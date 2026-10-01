import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { alumnosGrupoRouter } from "../alumnosGrupo/alumnosGrupo.routes";
import * as gruposController from "./grupos.controller";
import {
  createGrupoSchema,
  deleteGrupoQuerySchema,
  idGrupoParamSchema,
  listGruposQuerySchema,
  updateGrupoSchema,
} from "./grupos.schema";

export const gruposRouter = Router();

gruposRouter.get(
  "/",
  validate({ query: listGruposQuerySchema }),
  gruposController.listGrupos
);

gruposRouter.get(
  "/:idgrupo",
  validate({ params: idGrupoParamSchema }),
  gruposController.getGrupo
);

gruposRouter.post(
  "/",
  validate({ body: createGrupoSchema }),
  gruposController.createGrupo
);

gruposRouter.put(
  "/:idgrupo",
  validate({ params: idGrupoParamSchema, body: updateGrupoSchema }),
  gruposController.updateGrupo
);

gruposRouter.delete(
  "/:idgrupo",
  validate({ params: idGrupoParamSchema, query: deleteGrupoQuerySchema }),
  gruposController.deleteGrupo
);

// Roster/inscripciones de un grupo: GET|POST|DELETE /api/grupos/:idgrupo/alumnos
gruposRouter.use("/:idgrupo/alumnos", alumnosGrupoRouter);

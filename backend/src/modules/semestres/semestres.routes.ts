import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as semestresController from "./semestres.controller";
import {
  createSemestreSchema,
  deleteSemestreQuerySchema,
  idSemestreParamSchema,
  listSemestresQuerySchema,
} from "./semestres.schema";

export const semestresRouter = Router();

// Nota de paridad funcional: el sistema original no permite editar un
// semestre existente (solo agregar/borrar), por lo que no se expone PUT aqui.

semestresRouter.get(
  "/",
  validate({ query: listSemestresQuerySchema }),
  semestresController.listSemestres
);

semestresRouter.get(
  "/:idsemestre",
  validate({ params: idSemestreParamSchema }),
  semestresController.getSemestre
);

semestresRouter.post(
  "/",
  validate({ body: createSemestreSchema }),
  semestresController.createSemestre
);

semestresRouter.delete(
  "/:idsemestre",
  validate({ params: idSemestreParamSchema, query: deleteSemestreQuerySchema }),
  semestresController.deleteSemestre
);

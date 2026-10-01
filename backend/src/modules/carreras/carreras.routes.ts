import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as carrerasController from "./carreras.controller";
import {
  createCarreraSchema,
  idCarreraParamSchema,
  listCarrerasQuerySchema,
  updateCarreraSchema,
} from "./carreras.schema";

export const carrerasRouter = Router();

carrerasRouter.get(
  "/",
  validate({ query: listCarrerasQuerySchema }),
  carrerasController.listCarreras
);

carrerasRouter.get(
  "/:idcarrera",
  validate({ params: idCarreraParamSchema }),
  carrerasController.getCarrera
);

carrerasRouter.post(
  "/",
  validate({ body: createCarreraSchema }),
  carrerasController.createCarrera
);

carrerasRouter.put(
  "/:idcarrera",
  validate({ params: idCarreraParamSchema, body: updateCarreraSchema }),
  carrerasController.updateCarrera
);

carrerasRouter.delete(
  "/:idcarrera",
  validate({ params: idCarreraParamSchema }),
  carrerasController.deleteCarrera
);

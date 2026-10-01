import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as extraescolaresController from "./extraescolares.controller";
import {
  createExtraescolarSchema,
  deleteExtraescolarQuerySchema,
  idExtraescolarParamSchema,
  listExtraescolaresQuerySchema,
  updateExtraescolarSchema,
} from "./extraescolares.schema";

export const extraescolaresRouter = Router();

extraescolaresRouter.get(
  "/",
  validate({ query: listExtraescolaresQuerySchema }),
  extraescolaresController.listExtraescolares
);

extraescolaresRouter.get(
  "/:idextraescolar",
  validate({ params: idExtraescolarParamSchema }),
  extraescolaresController.getExtraescolar
);

extraescolaresRouter.post(
  "/",
  validate({ body: createExtraescolarSchema }),
  extraescolaresController.createExtraescolar
);

extraescolaresRouter.put(
  "/:idextraescolar",
  validate({ params: idExtraescolarParamSchema, body: updateExtraescolarSchema }),
  extraescolaresController.updateExtraescolar
);

extraescolaresRouter.delete(
  "/:idextraescolar",
  validate({ params: idExtraescolarParamSchema, query: deleteExtraescolarQuerySchema }),
  extraescolaresController.deleteExtraescolar
);

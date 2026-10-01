import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as busquedaController from "./busqueda.controller";
import { nocontrolParamSchema } from "./busqueda.schema";

export const busquedaRouter = Router();

// El reporte de roster+estadisticas de un grupo vive en /api/grupos/:idgrupo/alumnos.
busquedaRouter.get(
  "/alumnos/:nocontrol/extraescolares",
  validate({ params: nocontrolParamSchema }),
  busquedaController.getHistorialAlumno
);

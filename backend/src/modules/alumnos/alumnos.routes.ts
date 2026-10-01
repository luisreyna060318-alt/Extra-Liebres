import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as alumnosController from "./alumnos.controller";
import {
  createAlumnoSchema,
  deleteAlumnoQuerySchema,
  exportAlumnosQuerySchema,
  listAlumnosQuerySchema,
  nocontrolParamSchema,
  updateAlumnoSchema,
} from "./alumnos.schema";

export const alumnosRouter = Router();

alumnosRouter.get(
  "/",
  validate({ query: listAlumnosQuerySchema }),
  alumnosController.listAlumnos
);

// Debe ir antes de "/:nocontrol" para que Express no intente interpretar
// "export" como un numero de control.
alumnosRouter.get(
  "/export",
  validate({ query: exportAlumnosQuerySchema }),
  alumnosController.exportAlumnos
);

alumnosRouter.get(
  "/:nocontrol",
  validate({ params: nocontrolParamSchema }),
  alumnosController.getAlumno
);

alumnosRouter.post(
  "/",
  validate({ body: createAlumnoSchema }),
  alumnosController.createAlumno
);

alumnosRouter.put(
  "/:nocontrol",
  validate({ params: nocontrolParamSchema, body: updateAlumnoSchema }),
  alumnosController.updateAlumno
);

alumnosRouter.delete(
  "/:nocontrol",
  validate({ params: nocontrolParamSchema, query: deleteAlumnoQuerySchema }),
  alumnosController.deleteAlumno
);

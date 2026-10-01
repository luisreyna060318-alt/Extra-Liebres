import { Router } from "express";
import { validate } from "../../middlewares/validate";
import * as promotoresController from "./promotores.controller";
import {
  createPromotorSchema,
  deletePromotorQuerySchema,
  listPromotoresQuerySchema,
  rfcParamSchema,
  updatePromotorSchema,
} from "./promotores.schema";

export const promotoresRouter = Router();

promotoresRouter.get(
  "/",
  validate({ query: listPromotoresQuerySchema }),
  promotoresController.listPromotores
);

promotoresRouter.get(
  "/:rfc",
  validate({ params: rfcParamSchema }),
  promotoresController.getPromotor
);

promotoresRouter.post(
  "/",
  validate({ body: createPromotorSchema }),
  promotoresController.createPromotor
);

promotoresRouter.put(
  "/:rfc",
  validate({ params: rfcParamSchema, body: updatePromotorSchema }),
  promotoresController.updatePromotor
);

promotoresRouter.delete(
  "/:rfc",
  validate({ params: rfcParamSchema, query: deletePromotorQuerySchema }),
  promotoresController.deletePromotor
);

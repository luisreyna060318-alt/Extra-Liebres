import { NextFunction, Request, Response } from "express";
import { ZodError, ZodTypeAny } from "zod";
import { ApiError } from "../utils/ApiError";

// ZodTypeAny (no AnyZodObject) porque los esquemas con .refine()/.superRefine()
// (p.ej. createGrupoSchema, updateAlumnoSchema) son ZodEffects, no ZodObject.
type Schemas = Partial<{
  body: ZodTypeAny;
  params: ZodTypeAny;
  query: ZodTypeAny;
}>;

// Valida body/params/query contra esquemas Zod y reemplaza req.<parte> con
// los datos ya parseados (tipados y con defaults aplicados).
export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as unknown as typeof req.params;
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query) as unknown as typeof req.query;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(ApiError.badRequest("Datos de entrada invalidos", error.flatten()));
        return;
      }
      next(error);
    }
  };
}

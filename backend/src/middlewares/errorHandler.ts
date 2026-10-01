import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
}

// Middleware central de errores: traduce ApiError, errores de validacion de
// Prisma y cualquier excepcion inesperada a una respuesta JSON consistente.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        error: "Ya existe un registro con ese identificador o valor unico.",
        details: err.meta,
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({ error: "El registro solicitado no existe." });
      return;
    }
    if (err.code === "P2003") {
      res.status(409).json({
        error: "La operacion viola una relacion con otra tabla (llave foranea).",
        details: err.meta,
      });
      return;
    }
  }

  console.error(err);
  res.status(500).json({ error: "Error interno del servidor." });
}

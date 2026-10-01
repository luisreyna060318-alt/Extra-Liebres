import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import { ApiError } from "../utils/ApiError";

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.path}`,
  });
}

/** Errores 4xx que lanza el parser de cuerpos de Express (body-parser / http-errors). */
function esErrorDelCliente(err: unknown): err is { status: number; type?: string } {
  if (typeof err !== "object" || err === null) return false;
  const { status, expose } = err as { status?: unknown; expose?: unknown };
  return typeof status === "number" && status >= 400 && status < 500 && expose === true;
}

const MENSAJES_DEL_PARSER: Record<string, string> = {
  "entity.parse.failed": "El cuerpo de la solicitud no es JSON valido.",
  "entity.too.large": "El cuerpo de la solicitud es demasiado grande.",
  "encoding.unsupported": "La codificacion del cuerpo de la solicitud no es compatible.",
};

// Middleware central de errores: traduce ApiError, errores del parser JSON,
// errores conocidos de Prisma y cualquier excepcion inesperada a una
// respuesta JSON consistente. Nunca devuelve detalles internos (modelos,
// columnas de restricciones, trazas) al cliente.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({ error: err.message, details: err.details });
    return;
  }

  if (esErrorDelCliente(err)) {
    res
      .status(err.status)
      .json({ error: MENSAJES_DEL_PARSER[err.type ?? ""] ?? "La solicitud no es valida." });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002": {
        const target = err.meta?.target;
        const campos = Array.isArray(target) ? ` (${target.join(", ")})` : "";
        res.status(409).json({ error: `Ya existe un registro con ese mismo valor${campos}.` });
        return;
      }
      case "P2025":
        res.status(404).json({ error: "El registro solicitado no existe." });
        return;
      case "P2003":
        res.status(409).json({
          error: "La operacion viola una relacion con otra tabla (llave foranea).",
        });
        return;
      case "P2000":
        res.status(400).json({ error: "Uno de los valores es demasiado largo para su campo." });
        return;
    }
  }

  console.error(
    `[${new Date().toISOString()}] Error no controlado en ${req.method} ${req.originalUrl}:`,
    err
  );
  res.status(500).json({ error: "Error interno del servidor." });
}

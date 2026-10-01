import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Cliente Prisma unico (patron singleton) reutilizado en toda la app,
// evitando agotar el pool de conexiones de PostgreSQL en desarrollo con hot-reload.
declare global {
  // eslint-disable-next-line no-var
  var __prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__prisma__ ??
  new PrismaClient({
    // Fuera de desarrollo no se registran los errores de consulta: los
    // esperados (p. ej. llave duplicada) se responden como 409 y los
    // inesperados ya los registra el errorHandler con la ruta que los causo.
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["warn"],
  });

if (env.nodeEnv !== "production") {
  global.__prisma__ = prisma;
}

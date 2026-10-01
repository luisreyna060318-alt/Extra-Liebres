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
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
  });

if (env.nodeEnv !== "production") {
  global.__prisma__ = prisma;
}

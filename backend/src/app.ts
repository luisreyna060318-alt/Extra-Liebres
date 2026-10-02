import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { prisma } from "./config/prisma";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import { alumnosRouter } from "./modules/alumnos/alumnos.routes";
import { busquedaRouter } from "./modules/busqueda/busqueda.routes";
import { carrerasRouter } from "./modules/carreras/carreras.routes";
import { extraescolaresRouter } from "./modules/extraescolares/extraescolares.routes";
import { gruposRouter } from "./modules/grupos/grupos.routes";
import { promotoresRouter } from "./modules/promotores/promotores.routes";
import { semestresRouter } from "./modules/semestres/semestres.routes";

export function createApp(): Application {
  const app = express();

  // Detras de nginx, req.ip (y los logs) deben tomar la IP real del cliente
  // de X-Forwarded-For en lugar de la del proxy.
  if (env.trustProxy > 0) {
    app.set("trust proxy", env.trustProxy);
  }

  // El registro de accesos va antes del parser JSON: asi tambien quedan
  // registradas las peticiones que el parser rechaza (JSON invalido, 413).
  // Los health checks exitosos (cada pocos segundos en Docker) se omiten.
  // En las pruebas se omite para no llenar la salida de vitest.
  if (env.nodeEnv !== "test") {
    app.use(
      morgan(env.nodeEnv === "development" ? "dev" : "combined", {
        skip: (req, res) => req.originalUrl === "/api/health" && res.statusCode < 400,
      })
    );
  }
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin }));
  app.use(express.json());

  app.get("/api/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      res.json({ status: "ok", database: "up", timestamp: new Date().toISOString() });
    } catch {
      res
        .status(503)
        .json({ status: "error", database: "down", timestamp: new Date().toISOString() });
    }
  });

  app.use("/api/alumnos", alumnosRouter);
  app.use("/api/carreras", carrerasRouter);
  app.use("/api/promotores", promotoresRouter);
  app.use("/api/semestres", semestresRouter);
  app.use("/api/extraescolares", extraescolaresRouter);
  app.use("/api/grupos", gruposRouter);
  app.use("/api/busqueda", busquedaRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

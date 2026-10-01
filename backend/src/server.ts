import { createApp } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

const app = createApp();

const server = app.listen(env.port, () => {
  console.log(`API escuchando en http://localhost:${env.port} (${env.nodeEnv})`);
});

async function shutdown(signal: string): Promise<void> {
  console.log(`\nRecibida ${signal}, cerrando servidor...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));

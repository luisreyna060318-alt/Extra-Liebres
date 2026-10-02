import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Las pruebas de integracion comparten una sola base de datos y la
    // limpian antes de cada caso: los archivos no pueden correr en paralelo.
    fileParallelism: false,
    testTimeout: 15000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts", "prisma/**/*.ts"],
      exclude: ["**/__tests__/**", "src/server.ts"],
      reporter: ["text-summary", "text"],
    },
    hookTimeout: 20000,
  },
});

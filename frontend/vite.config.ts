import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// La SPA llama a la API en el mismo origen ("/api"). En desarrollo y en
// "vite preview" ese prefijo se reenvia al backend local; en Docker lo hace nginx.
const apiProxy = {
  "/api": {
    target: process.env.API_PROXY_TARGET ?? "http://localhost:4000",
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: apiProxy,
  },
  preview: {
    port: 5173,
    proxy: apiProxy,
  },
});

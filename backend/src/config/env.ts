import "dotenv/config";

interface Env {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  databaseUrl: string;
  /** Valor para app.set("trust proxy"): numero de proxies delante de la API (0 = ninguno). */
  trustProxy: number;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno requerida: ${name}`);
  }
  return value;
}

function entero(name: string, porDefecto: number): number {
  const crudo = process.env[name];
  if (crudo === undefined || crudo === "") return porDefecto;
  const valor = Number(crudo);
  if (!Number.isInteger(valor) || valor < 0) {
    throw new Error(`La variable de entorno ${name} debe ser un entero >= 0 (valor actual: "${crudo}").`);
  }
  return valor;
}

export const env: Env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: entero("PORT", 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  databaseUrl: required("DATABASE_URL"),
  trustProxy: entero("TRUST_PROXY", 0),
};

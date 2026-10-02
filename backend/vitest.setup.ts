import { config } from "dotenv";

// dotenv NO sobreescribe variables ya presentes en process.env, asi que si
// las pruebas corren en un contenedor con DATABASE_URL inyectado via
// "docker run -e DATABASE_URL=...", ese valor gana. Si no, se usa el de
// .env.test (pensado para correr "npm test" en el host contra el Postgres
// de docker-compose, publicado en localhost:5432).
config({ path: ".env.test" });

// Las pruebas de integracion BORRAN todas las tablas antes de cada caso. Si
// DATABASE_URL apuntara a la base real (variable exportada en la terminal,
// .env cargado por el IDE, etc.) la vaciarian sin aviso. Por eso se exige
// que el nombre de la base termine en "_test" antes de cargar cualquier
// prueba.
function nombreDeBase(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.replace(/^\//, ""));
  } catch {
    return "";
  }
}

const baseDePrueba = nombreDeBase(process.env.DATABASE_URL ?? "");
if (!baseDePrueba.endsWith("_test")) {
  throw new Error(
    `Pruebas canceladas: DATABASE_URL apunta a la base "${baseDePrueba || "(desconocida)"}". ` +
      'Las pruebas solo pueden correr contra una base cuyo nombre termine en "_test", ' +
      "porque borran todas las tablas."
  );
}

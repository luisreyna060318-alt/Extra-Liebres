import { config } from "dotenv";

// dotenv NO sobreescribe variables ya presentes en process.env, asi que si
// las pruebas corren en un contenedor con DATABASE_URL inyectado via
// "docker run -e DATABASE_URL=...", ese valor gana. Si no, se usa el de
// .env.test (pensado para correr "npm test" en el host contra el Postgres
// de docker-compose, publicado en localhost:5432).
config({ path: ".env.test" });

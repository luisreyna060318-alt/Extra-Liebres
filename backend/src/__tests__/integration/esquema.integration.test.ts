/**
 * Verifica objetos de la base que viven en la migracion SQL y que Prisma no
 * puede expresar (CHECK) o que una migracion generada podria eliminar si el
 * esquema dejara de declararlos (indices trigram).
 */
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "../../config/prisma";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Objetos de base de datos fuera del alcance de Prisma", () => {
  it("existe el CHECK que limita la calificacion a 0-4", async () => {
    const filas = await prisma.$queryRaw<{ definicion: string }[]>`
      SELECT pg_get_constraintdef(oid) AS definicion
      FROM pg_constraint
      WHERE conname = 'calificacion_en_rango'
    `;
    expect(filas).toHaveLength(1);
    expect(filas[0].definicion).toMatch(/calificacion >= 0.*calificacion <= 4/);
  });

  it("existen los 6 indices trigram de busqueda", async () => {
    const filas = await prisma.$queryRaw<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE indexname LIKE '%\\_trgm\\_idx' ESCAPE '\\'
      ORDER BY indexname
    `;
    expect(filas.map((f) => f.indexname)).toEqual([
      "alumno_apmaterno_trgm_idx",
      "alumno_appaterno_trgm_idx",
      "alumno_nombre_trgm_idx",
      "promotor_apmaterno_trgm_idx",
      "promotor_appaterno_trgm_idx",
      "promotor_nombre_trgm_idx",
    ]);
  });
});

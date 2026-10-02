/**
 * Importacion completa de un volcado sintetico al estilo phpMyAdmin contra la
 * base de prueba (nunca contiene datos reales).
 */
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "../../../src/config/prisma";
import { limpiarBaseDePrueba } from "../../../src/__tests__/testHelpers";
import { CARRERA_SIN_ASIGNAR, importarDatos, prepararDatos } from "../importar";

const VOLCADO = `
-- phpMyAdmin SQL Dump (sintetico)
INSERT INTO \`promotor\` (\`rfc\`, \`nombre\`, \`appaterno\`, \`apmaterno\`) VALUES
('PRUE800101AB1', 'Laura', 'Garcia', 'Reyes');
INSERT INTO \`extraescolar\` (\`idextraescolar\`, \`nombreextra\`) VALUES
('1-FS', 'Futbol Soccer');
INSERT INTO \`semestre\` (\`idsemestre\`, \`mesinicio\`, \`mestermino\`, \`anio\`) VALUES
('AD-25', 'AGOSTO', 'DICIEMBRE', '2025');
INSERT INTO \`alumno\` (\`nocontrol\`, \`nombre\`, \`appaterno\`, \`apmaterno\`, \`sexo\`, \`carrera\`, \`campus\`) VALUES
('90000001', 'Ana', 'O\\'Neil', '', 'FEMENINO', 'Ing. Industrial', 'CAMPUS 1'),
('90000002', 'Beto', 'Ruiz', 'Paz', '', 'Ing. Industrial', 'CAMPUS 2');
INSERT INTO \`alumno\` (\`nocontrol\`, \`nombre\`, \`appaterno\`, \`apmaterno\`, \`sexo\`, \`carrera\`, \`campus\`) VALUES
('90000003', 'Caro', 'Diaz', 'Luna', 'OTRO', '', 'CAMPUS 9');
INSERT INTO \`grupo\` (\`idgrupo\`, \`primerdia\`, \`segundodia\`, \`horainicio\`, \`horatermino\`, \`aula\`, \`idsemestre\`, \`idextraescolar\`, \`rfcpromotor\`) VALUES
('1-1FS-PRUE800101-AD25', 'MIÉRCOLES', '', '16:00', '17:00', 'Cancha; norte', 'AD-25', '1-FS', 'PRUE800101AB1'),
('2-1FS-PRUE800101-XX', 'LUNES', '', '', '', '', 'XX-99', '1-FS', 'PRUE800101AB1'),
('3-9ZZ-NOEXISTE', 'LUNES', '', '', '', '', 'AD-25', '9-ZZ', 'PRUE800101AB1');
INSERT INTO \`alumnosgrupo\` (\`nocontrol\`, \`idgrupo\`, \`calificacion\`, \`desempeno\`) VALUES
('90000001', '1-1FS-PRUE800101-AD25', 4, 'EXCELENTE'),
('90000002', '1-1FS-PRUE800101-AD25', 2, 'NOTABLE'),
('90000003', '1-1FS-PRUE800101-AD25', 7, 'X');
`;

beforeEach(async () => {
  await limpiarBaseDePrueba();
});

afterAll(async () => {
  await limpiarBaseDePrueba();
  await prisma.$disconnect();
});

describe("prepararDatos", () => {
  it("reporta cada valor asignado por defecto u omitido en lugar de ocultarlo", () => {
    const datos = prepararDatos(VOLCADO);
    const avisos = datos.avisos.join("\n");

    expect(avisos).toMatch(/1 alumno\(s\) sin carrera.*90000003/);
    expect(avisos).toMatch(/campus no reconocido.*90000003/);
    expect(avisos).toMatch(/sexo no reconocido.*90000003/);
    expect(avisos).toMatch(/1 grupo\(s\) omitidos.*3-9ZZ-NOEXISTE/);
    expect(avisos).toMatch(/sin semestre.*2-1FS-PRUE800101-XX/);
    expect(avisos).toMatch(/1 inscripcion\(es\) omitidas/);
    expect(avisos).toMatch(/desempeno.*recalculo/);

    expect(datos.carreras.map((c) => c.nombre)).toEqual(["Ing. Industrial", CARRERA_SIN_ASIGNAR]);
    expect(datos.alumnos.find((a) => a.nocontrol === "90000001")?.appaterno).toBe("O'Neil");
    expect(datos.inscripciones.find((i) => i.nocontrol === "90000002")?.desempeno).toBe("BUENO");
  });
});

describe("importarDatos", () => {
  it("carga todo en una transaccion y devuelve lo realmente insertado", async () => {
    const insertados = await importarDatos(prisma, prepararDatos(VOLCADO));

    expect(insertados).toEqual({
      promotores: 1,
      extraescolares: 1,
      semestres: 1,
      carreras: 2,
      alumnos: 3,
      grupos: 2,
      inscripciones: 2,
    });
    const grupo = await prisma.grupo.findUnique({ where: { idgrupo: "1-1FS-PRUE800101-AD25" } });
    expect(grupo).toMatchObject({ primerdia: "MIERCOLES", segundodia: null, aula: "Cancha; norte" });
  });

  it("si falla a la mitad no deja la base vacia ni a medias", async () => {
    await prisma.carrera.create({ data: { idcarrera: "1-PREVIA", nombre: "Carrera previa" } });
    const datos = prepararDatos(VOLCADO);
    // Una inscripcion hacia un grupo inexistente rompe la llave foranea al final.
    datos.inscripciones.push({ nocontrol: "90000001", idgrupo: "NO-EXISTE", calificacion: 1, desempeno: "SUFICIENTE" });

    await expect(importarDatos(prisma, datos)).rejects.toThrow();

    expect(await prisma.carrera.findMany({ select: { idcarrera: true } })).toEqual([{ idcarrera: "1-PREVIA" }]);
    expect(await prisma.alumno.count()).toBe(0);
  });
});

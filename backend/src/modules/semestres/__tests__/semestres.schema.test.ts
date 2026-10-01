import { describe, expect, it } from "vitest";
import { createSemestreSchema } from "../semestres.schema";

describe("createSemestreSchema", () => {
  it("acepta ENERO emparejado con JUNIO", () => {
    const resultado = createSemestreSchema.safeParse({
      mesinicio: "ENERO",
      mestermino: "JUNIO",
      anio: "2025",
    });
    expect(resultado.success).toBe(true);
  });

  it("acepta AGOSTO emparejado con DICIEMBRE", () => {
    const resultado = createSemestreSchema.safeParse({
      mesinicio: "AGOSTO",
      mestermino: "DICIEMBRE",
      anio: "2025",
    });
    expect(resultado.success).toBe(true);
  });

  it("rechaza combinaciones de meses invalidas", () => {
    const resultado = createSemestreSchema.safeParse({
      mesinicio: "ENERO",
      mestermino: "DICIEMBRE",
      anio: "2025",
    });
    expect(resultado.success).toBe(false);
  });

  it("rechaza un anio que no tenga exactamente 4 digitos", () => {
    const corto = createSemestreSchema.safeParse({
      mesinicio: "ENERO",
      mestermino: "JUNIO",
      anio: "25",
    });
    const conLetras = createSemestreSchema.safeParse({
      mesinicio: "ENERO",
      mestermino: "JUNIO",
      anio: "202A",
    });
    expect(corto.success).toBe(false);
    expect(conLetras.success).toBe(false);
  });

  it("rechaza meses fuera del sistema academico (solo enero/agosto - junio/diciembre)", () => {
    const resultado = createSemestreSchema.safeParse({
      mesinicio: "MARZO",
      mestermino: "JUNIO",
      anio: "2025",
    });
    expect(resultado.success).toBe(false);
  });
});

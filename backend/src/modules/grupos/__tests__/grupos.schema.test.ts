import { describe, expect, it } from "vitest";
import { createGrupoSchema } from "../grupos.schema";

const BASE = {
  idextraescolar: "1-FS",
  rfcpromotor: "ZUHR111111000",
  idsemestre: "EJ-24",
};

describe("createGrupoSchema", () => {
  it("acepta un grupo sin horario (todo opcional)", () => {
    expect(createGrupoSchema.safeParse(BASE).success).toBe(true);
  });

  it("acepta un horario completo y valido", () => {
    const resultado = createGrupoSchema.safeParse({
      ...BASE,
      primerdia: "LUNES",
      segundodia: "MIERCOLES",
      horainicio: "16:00",
      horatermino: "17:00",
    });
    expect(resultado.success).toBe(true);
  });

  it("rechaza segundodia sin primerdia", () => {
    const resultado = createGrupoSchema.safeParse({ ...BASE, segundodia: "MARTES" });
    expect(resultado.success).toBe(false);
  });

  it("rechaza segundodia igual o anterior a primerdia en la semana", () => {
    const igual = createGrupoSchema.safeParse({
      ...BASE,
      primerdia: "MARTES",
      segundodia: "MARTES",
    });
    const anterior = createGrupoSchema.safeParse({
      ...BASE,
      primerdia: "JUEVES",
      segundodia: "LUNES",
    });
    expect(igual.success).toBe(false);
    expect(anterior.success).toBe(false);
  });

  it("rechaza hora de inicio sin hora de termino (y viceversa)", () => {
    const soloInicio = createGrupoSchema.safeParse({ ...BASE, horainicio: "16:00" });
    const soloTermino = createGrupoSchema.safeParse({ ...BASE, horatermino: "17:00" });
    expect(soloInicio.success).toBe(false);
    expect(soloTermino.success).toBe(false);
  });

  it("rechaza hora de termino igual o anterior a la de inicio", () => {
    const resultado = createGrupoSchema.safeParse({
      ...BASE,
      horainicio: "17:00",
      horatermino: "16:00",
    });
    expect(resultado.success).toBe(false);
  });

  it("exige actividad, promotor y semestre para crear un grupo", () => {
    const sinExtraescolar = createGrupoSchema.safeParse({ ...BASE, idextraescolar: "" });
    expect(sinExtraescolar.success).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { createAlumnoSchema, updateAlumnoSchema } from "../alumnos.schema";

const BASE = {
  nocontrol: "21170001",
  nombre: "Juan",
  appaterno: "Perez",
  idcarrera: "1-II",
  campus: "CAMPUS_1" as const,
};

describe("createAlumnoSchema", () => {
  it("acepta un alumno valido sin sexo ni apellido materno", () => {
    const resultado = createAlumnoSchema.safeParse(BASE);
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.sexo).toBeUndefined();
      expect(resultado.data.apmaterno).toBeUndefined();
    }
  });

  it("convierte sexo='' (cadena vacia) a null (sin especificar) en vez de rechazarlo", () => {
    const resultado = createAlumnoSchema.safeParse({ ...BASE, sexo: "" });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data.sexo).toBeNull();
    }
  });

  it("acepta MASCULINO/FEMENINO explicitamente", () => {
    expect(createAlumnoSchema.safeParse({ ...BASE, sexo: "MASCULINO" }).success).toBe(true);
    expect(createAlumnoSchema.safeParse({ ...BASE, sexo: "FEMENINO" }).success).toBe(true);
  });

  it("rechaza un valor de sexo que no sea MASCULINO/FEMENINO/vacio", () => {
    expect(createAlumnoSchema.safeParse({ ...BASE, sexo: "OTRO" }).success).toBe(false);
  });

  it("rechaza un numero de control con letras", () => {
    expect(createAlumnoSchema.safeParse({ ...BASE, nocontrol: "21A70001" }).success).toBe(false);
  });

  it("exige idcarrera y campus", () => {
    expect(createAlumnoSchema.safeParse({ ...BASE, idcarrera: "" }).success).toBe(false);
    expect(createAlumnoSchema.safeParse({ ...BASE, campus: "CAMPUS_3" }).success).toBe(false);
  });
});

describe("updateAlumnoSchema", () => {
  it("rechaza un objeto vacio (debe enviarse al menos un campo)", () => {
    expect(updateAlumnoSchema.safeParse({}).success).toBe(false);
  });

  it("acepta actualizar un unico campo", () => {
    expect(updateAlumnoSchema.safeParse({ nombre: "Nuevo Nombre" }).success).toBe(true);
  });

  it("distingue 'no tocar' (ausente) de 'vaciar' (null o '')", () => {
    const resultado = updateAlumnoSchema.safeParse({ apmaterno: "", sexo: null });
    expect(resultado.success).toBe(true);
    if (resultado.success) {
      expect(resultado.data).toEqual({ apmaterno: null, sexo: null });
      expect("nombre" in resultado.data).toBe(false);
    }
  });

  it("acepta numeros de control de hasta 11 digitos", () => {
    expect(createAlumnoSchema.safeParse({ ...BASE, nocontrol: "12345678901" }).success).toBe(true);
    expect(createAlumnoSchema.safeParse({ ...BASE, nocontrol: "123456789012" }).success).toBe(false);
  });
});

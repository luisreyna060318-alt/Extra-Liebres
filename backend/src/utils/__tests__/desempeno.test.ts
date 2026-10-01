import { describe, expect, it } from "vitest";
import { ApiError } from "../ApiError";
import { calificacionADesempeno } from "../desempeno";

describe("calificacionADesempeno", () => {
  it.each([
    [0, "INSUFICIENTE"],
    [1, "SUFICIENTE"],
    [2, "BUENO"],
    [3, "NOTABLE"],
    [4, "EXCELENTE"],
  ])("mapea %i -> %s", (calificacion, esperado) => {
    expect(calificacionADesempeno(calificacion)).toBe(esperado);
  });

  it("rechaza calificaciones fuera de rango", () => {
    expect(() => calificacionADesempeno(5)).toThrow(ApiError);
    expect(() => calificacionADesempeno(-1)).toThrow(ApiError);
  });

  it("el error de rango invalido tiene status 400", () => {
    try {
      calificacionADesempeno(9);
      expect.fail("debio lanzar un error");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).statusCode).toBe(400);
    }
  });
});

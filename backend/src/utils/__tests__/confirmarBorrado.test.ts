import { describe, expect, it } from "vitest";
import { ApiError } from "../ApiError";
import { exigirConfirmacionSiHayImpacto } from "../confirmarBorrado";

describe("exigirConfirmacionSiHayImpacto", () => {
  it("no lanza nada si no hay dependientes, aunque no se confirme", () => {
    expect(() =>
      exigirConfirmacionSiHayImpacto({
        confirmar: false,
        mensaje: "no deberia importar",
        detalles: { inscripcionesAfectadas: 0 },
      })
    ).not.toThrow();
  });

  it("no lanza nada si ya se confirmo, aunque haya dependientes", () => {
    expect(() =>
      exigirConfirmacionSiHayImpacto({
        confirmar: true,
        mensaje: "se perderan datos",
        detalles: { inscripcionesAfectadas: 5 },
      })
    ).not.toThrow();
  });

  it("lanza un ApiError 409 con el detalle si hay dependientes y no se confirmo", () => {
    try {
      exigirConfirmacionSiHayImpacto({
        confirmar: false,
        mensaje: "Este alumno tiene 1 inscripcion(es)...",
        detalles: { inscripcionesAfectadas: 1 },
      });
      expect.fail("debio lanzar un error");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.statusCode).toBe(409);
      expect(apiError.message).toContain("1 inscripcion");
      expect(apiError.details).toMatchObject({
        requiereConfirmacion: true,
        inscripcionesAfectadas: 1,
      });
    }
  });

  it("considera 'hay impacto' si CUALQUIER contador de detalles es mayor a cero", () => {
    expect(() =>
      exigirConfirmacionSiHayImpacto({
        confirmar: false,
        mensaje: "grupos afectados",
        detalles: { gruposAfectados: 0, inscripcionesAfectadas: 3 },
      })
    ).toThrow(ApiError);
  });
});

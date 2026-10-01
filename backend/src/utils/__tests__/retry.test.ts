import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { reintentarSiIdDuplicado } from "../retry";

function errorIdDuplicado(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed on the fields: (`id`)", {
    code: "P2002",
    clientVersion: "5.22.0",
  });
}

describe("reintentarSiIdDuplicado", () => {
  it("regresa el resultado directo si la primera llamada tiene exito", async () => {
    const operacion = vi.fn().mockResolvedValue("ok");
    const resultado = await reintentarSiIdDuplicado(operacion);
    expect(resultado).toBe("ok");
    expect(operacion).toHaveBeenCalledTimes(1);
  });

  it("reintenta cuando la operacion choca con un ID duplicado (P2002) y luego tiene exito", async () => {
    const operacion = vi
      .fn()
      .mockRejectedValueOnce(errorIdDuplicado())
      .mockRejectedValueOnce(errorIdDuplicado())
      .mockResolvedValueOnce("ok-al-tercer-intento");

    const resultado = await reintentarSiIdDuplicado(operacion);

    expect(resultado).toBe("ok-al-tercer-intento");
    expect(operacion).toHaveBeenCalledTimes(3);
  });

  it("propaga errores que NO son de ID duplicado sin reintentar", async () => {
    const otroError = new Error("fallo de conexion");
    const operacion = vi.fn().mockRejectedValue(otroError);

    await expect(reintentarSiIdDuplicado(operacion)).rejects.toBe(otroError);
    expect(operacion).toHaveBeenCalledTimes(1);
  });

  it("si se agotan los intentos, relanza el ultimo error de duplicado", async () => {
    const operacion = vi.fn().mockRejectedValue(errorIdDuplicado());

    await expect(reintentarSiIdDuplicado(operacion, 3)).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError
    );
    expect(operacion).toHaveBeenCalledTimes(3);
  });
});

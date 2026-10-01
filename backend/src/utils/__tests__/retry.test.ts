import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { esDuplicadoEn, reintentarSiIdDuplicado } from "../retry";

function errorDuplicado(campos: string[]): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
    code: "P2002",
    clientVersion: "5.22.0",
    meta: { target: campos },
  });
}

describe("esDuplicadoEn", () => {
  it("reconoce un P2002 sobre el campo indicado", () => {
    expect(esDuplicadoEn(errorDuplicado(["idgrupo"]), "idgrupo")).toBe(true);
  });

  it("ignora un P2002 sobre otro campo y cualquier otro error", () => {
    expect(esDuplicadoEn(errorDuplicado(["nombre"]), "idcarrera")).toBe(false);
    expect(esDuplicadoEn(new Error("x"), "idcarrera")).toBe(false);
  });
});

describe("reintentarSiIdDuplicado", () => {
  it("regresa el resultado directo si la primera llamada tiene exito", async () => {
    const operacion = vi.fn().mockResolvedValue("ok");
    expect(await reintentarSiIdDuplicado(operacion, "idgrupo")).toBe("ok");
    expect(operacion).toHaveBeenCalledTimes(1);
  });

  it("reintenta cuando choca con el ID y luego tiene exito", async () => {
    const operacion = vi
      .fn()
      .mockRejectedValueOnce(errorDuplicado(["idextraescolar"]))
      .mockRejectedValueOnce(errorDuplicado(["idextraescolar"]))
      .mockResolvedValueOnce("ok-al-tercer-intento");

    expect(await reintentarSiIdDuplicado(operacion, "idextraescolar")).toBe("ok-al-tercer-intento");
    expect(operacion).toHaveBeenCalledTimes(3);
  });

  it("NO reintenta si el duplicado es de otra restriccion (p. ej. el nombre)", async () => {
    const error = errorDuplicado(["nombreextra"]);
    const operacion = vi.fn().mockRejectedValue(error);

    await expect(reintentarSiIdDuplicado(operacion, "idextraescolar")).rejects.toBe(error);
    expect(operacion).toHaveBeenCalledTimes(1);
  });

  it("propaga errores que no son de llave duplicada sin reintentar", async () => {
    const otroError = new Error("fallo de conexion");
    const operacion = vi.fn().mockRejectedValue(otroError);

    await expect(reintentarSiIdDuplicado(operacion, "idgrupo")).rejects.toBe(otroError);
    expect(operacion).toHaveBeenCalledTimes(1);
  });

  it("si se agotan los intentos, relanza el ultimo error", async () => {
    const operacion = vi.fn().mockRejectedValue(errorDuplicado(["idgrupo"]));

    await expect(reintentarSiIdDuplicado(operacion, "idgrupo", 3)).rejects.toBeInstanceOf(
      Prisma.PrismaClientKnownRequestError
    );
    expect(operacion).toHaveBeenCalledTimes(3);
  });
});

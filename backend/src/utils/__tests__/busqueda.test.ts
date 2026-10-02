import { describe, expect, it } from "vitest";
import { cadaPalabraEnAlgunCampo, palabrasDeBusqueda } from "../busqueda";

describe("palabrasDeBusqueda", () => {
  it("separa por espacios, ignora vacios y limita a 5 palabras", () => {
    expect(palabrasDeBusqueda("  Juan   Perez ")).toEqual(["Juan", "Perez"]);
    expect(palabrasDeBusqueda(undefined)).toEqual([]);
    expect(palabrasDeBusqueda("a b c d e f g")).toHaveLength(5);
  });
});

describe("cadaPalabraEnAlgunCampo", () => {
  it("exige que cada palabra aparezca en alguno de los campos", () => {
    const where = cadaPalabraEnAlgunCampo("Juan Perez", (p) => [{ nombre: p }, { appaterno: p }]);
    expect(where).toEqual({
      AND: [
        { OR: [{ nombre: "Juan" }, { appaterno: "Juan" }] },
        { OR: [{ nombre: "Perez" }, { appaterno: "Perez" }] },
      ],
    });
  });

  it("devuelve undefined si no hay texto que buscar", () => {
    expect(cadaPalabraEnAlgunCampo("   ", (p) => [{ nombre: p }])).toBeUndefined();
  });
});

import { describe, expect, it } from "vitest";
import { iniciales, MAX_INICIALES } from "../iniciales";

describe("iniciales", () => {
  it("toma la primera letra de cada palabra en mayusculas", () => {
    expect(iniciales("Futbol Soccer")).toBe("FS");
    expect(iniciales("club de ajedrez")).toBe("CDA");
  });

  it("ignora signos que romperian una URL y usa la primera letra o digito de la palabra", () => {
    expect(iniciales("Danza / Baile (varonil) #1")).toBe("DBV1");
  });

  it("trunca a MAX_INICIALES para que el ID quepa en VARCHAR(20)", () => {
    const nombre = "a b c d e f g h i j k l m n o p q r s t u";
    expect(iniciales(nombre)).toHaveLength(MAX_INICIALES);
    expect(`9999-${iniciales(nombre)}`.length).toBeLessThanOrEqual(20);
  });

  it("nunca devuelve una cadena vacia", () => {
    expect(iniciales("-- / --")).toBe("X");
  });
});

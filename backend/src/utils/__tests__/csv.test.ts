import { describe, expect, it } from "vitest";
import { escaparCampoCsv, generarCsv } from "../csv";

describe("escaparCampoCsv", () => {
  it("encierra entre comillas los valores con comas, comillas o saltos de linea", () => {
    expect(escaparCampoCsv('Perez, "Juan"')).toBe('"Perez, ""Juan"""');
    expect(escaparCampoCsv("linea1\nlinea2")).toBe('"linea1\nlinea2"');
  });

  it("neutraliza valores que una hoja de calculo ejecutaria como formula", () => {
    expect(escaparCampoCsv("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(escaparCampoCsv("+52")).toBe("'+52");
    expect(escaparCampoCsv("-1")).toBe("'-1");
    expect(escaparCampoCsv("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(escaparCampoCsv('=CMD("x",1)')).toBe('"\'=CMD(""x"",1)"');
  });

  it("deja intactos los valores normales y convierte null en vacio", () => {
    expect(escaparCampoCsv("Ana Maria")).toBe("Ana Maria");
    expect(escaparCampoCsv(21110001)).toBe("21110001");
    expect(escaparCampoCsv(null)).toBe("");
  });
});

describe("generarCsv", () => {
  it("incluye la marca BOM y separa filas con CRLF", () => {
    const csv = generarCsv(["a", "b"], [{ a: 1, b: "x" }]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.slice(1)).toBe("a,b\r\n1,x");
  });
});

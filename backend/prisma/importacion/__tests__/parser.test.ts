import { describe, expect, it } from "vitest";
import { extraerInserts } from "../parser";

describe("extraerInserts", () => {
  it("concatena las filas de varios INSERT de la misma tabla", () => {
    const sql = `
      INSERT INTO \`alumno\` (\`nocontrol\`, \`nombre\`) VALUES
      ('1', 'Ana'),
      ('2', 'Beto');
      INSERT INTO \`otra\` (\`x\`) VALUES ('no');
      INSERT INTO \`alumno\` (\`nocontrol\`, \`nombre\`) VALUES ('3', 'Caro');
    `;
    expect(extraerInserts(sql, "alumno")).toEqual([
      { nocontrol: "1", nombre: "Ana" },
      { nocontrol: "2", nombre: "Beto" },
      { nocontrol: "3", nombre: "Caro" },
    ]);
  });

  it("entiende comillas escapadas al estilo MySQL (\\') y SQL ('')", () => {
    const sql = "INSERT INTO `p` (`a`, `b`) VALUES ('O\\'Brien', 'D''Angelo');";
    expect(extraerInserts(sql, "p")).toEqual([{ a: "O'Brien", b: "D'Angelo" }]);
  });

  it('no corta la sentencia por ";", ")" o "," dentro de una cadena', () => {
    const sql = "INSERT INTO `g` (`aula`, `n`) VALUES ('Sala 1; edificio (B), planta', 2);";
    expect(extraerInserts(sql, "g")).toEqual([{ aula: "Sala 1; edificio (B), planta", n: "2" }]);
  });

  it("distingue NULL sin comillas de la cadena 'NULL'", () => {
    const sql = "INSERT INTO `t` (`a`, `b`, `c`) VALUES (NULL, 'NULL', '');";
    expect(extraerInserts(sql, "t")).toEqual([{ a: null, b: "NULL", c: "" }]);
  });

  it("traduce las secuencias de escape de MySQL", () => {
    const sql = "INSERT INTO `t` (`a`) VALUES ('linea1\\nlinea2\\\\fin');";
    expect(extraerInserts(sql, "t")).toEqual([{ a: "linea1\nlinea2\\fin" }]);
  });

  it("falla con un mensaje claro si una fila no coincide con las columnas", () => {
    const sql = "INSERT INTO `t` (`a`, `b`) VALUES ('1');";
    expect(() => extraerInserts(sql, "t")).toThrow(/1 valores para 2 columnas/);
  });

  it("falla si el volcado esta truncado a la mitad de una fila", () => {
    const sql = "INSERT INTO `t` (`a`) VALUES ('sin cerrar";
    expect(() => extraerInserts(sql, "t")).toThrow(/truncado/);
  });

  it("rechaza INSERT sin lista de columnas", () => {
    const sql = "INSERT INTO `t` VALUES ('1');";
    expect(() => extraerInserts(sql, "t")).toThrow(/sin lista de columnas/);
  });
});

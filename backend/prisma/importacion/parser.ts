/**
 * Parser de los INSERT de un volcado MySQL/phpMyAdmin, sin depender de MySQL.
 *
 * Soporta lo que generan phpMyAdmin y mysqldump:
 * - varios "INSERT INTO `tabla` (`col`, ...) VALUES (...), (...);" por tabla;
 * - cadenas entre comillas simples con escapes de MySQL (\' \\ \n \r \t \0 \Z)
 *   y comillas duplicadas ('');
 * - ";", ")" o "," dentro de las cadenas;
 * - NULL sin comillas (una cadena 'NULL' entre comillas se conserva como texto).
 */

export type Fila = Record<string, string | null>;

const ESCAPES_MYSQL: Record<string, string> = {
  "0": "\0",
  b: "\b",
  n: "\n",
  r: "\r",
  t: "\t",
  Z: "\x1a",
};

function escaparRegex(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Devuelve todas las filas de todos los INSERT de `tabla`, en orden. */
export function extraerInserts(sql: string, tabla: string): Fila[] {
  const cabecera = new RegExp(
    "INSERT\\s+INTO\\s+`" + escaparRegex(tabla) + "`\\s*(\\(([^)]*)\\))?\\s*VALUES\\s*",
    "gi"
  );

  const filas: Fila[] = [];
  let match: RegExpExecArray | null;

  while ((match = cabecera.exec(sql)) !== null) {
    if (match[2] === undefined) {
      throw new Error(
        `El volcado tiene un INSERT de la tabla "${tabla}" sin lista de columnas. ` +
          'Vuelve a exportarlo desde phpMyAdmin con la opcion "inserciones completas".'
      );
    }
    const columnas = match[2].split(",").map((c) => c.trim().replace(/`/g, ""));
    const { tuplas, fin } = parsearValores(sql, match.index + match[0].length);

    for (const valores of tuplas) {
      if (valores.length !== columnas.length) {
        throw new Error(
          `Fila de "${tabla}" con ${valores.length} valores para ${columnas.length} columnas: ` +
            `(${valores.map((v) => (v === null ? "NULL" : `'${v}'`)).join(", ")})`
        );
      }
      const fila: Fila = {};
      columnas.forEach((columna, i) => {
        fila[columna] = valores[i];
      });
      filas.push(fila);
    }

    cabecera.lastIndex = fin;
  }

  return filas;
}

/**
 * Lee "(v1, v2), (v1, v2);" a partir de `inicio` y devuelve las tuplas y la
 * posicion siguiente al ";" que cierra la sentencia (fuera de las cadenas).
 */
export function parsearValores(
  sql: string,
  inicio: number
): { tuplas: (string | null)[][]; fin: number } {
  const tuplas: (string | null)[][] = [];
  const n = sql.length;
  let i = inicio;

  let campos: (string | null)[] | null = null; // null = entre tuplas
  let sinComillas = "";
  let entreComillas = "";
  let fueCitado = false;
  let dentroDeCadena = false;

  const cerrarCampo = (): string | null => {
    if (fueCitado) return entreComillas;
    const valor = sinComillas.trim();
    return valor.toUpperCase() === "NULL" ? null : valor;
  };
  const reiniciarCampo = () => {
    sinComillas = "";
    entreComillas = "";
    fueCitado = false;
  };

  while (i < n) {
    const c = sql[i];

    if (dentroDeCadena) {
      if (c === "\\" && i + 1 < n) {
        const siguiente = sql[i + 1];
        entreComillas += ESCAPES_MYSQL[siguiente] ?? siguiente;
        i += 2;
        continue;
      }
      if (c === "'") {
        if (sql[i + 1] === "'") {
          entreComillas += "'";
          i += 2;
          continue;
        }
        dentroDeCadena = false;
        i++;
        continue;
      }
      entreComillas += c;
      i++;
      continue;
    }

    if (campos === null) {
      if (c === "(") {
        campos = [];
        reiniciarCampo();
      } else if (c === ";") {
        return { tuplas, fin: i + 1 };
      }
      i++;
      continue;
    }

    if (c === "'") {
      dentroDeCadena = true;
      fueCitado = true;
    } else if (c === ",") {
      campos.push(cerrarCampo());
      reiniciarCampo();
    } else if (c === ")") {
      campos.push(cerrarCampo());
      tuplas.push(campos);
      campos = null;
    } else {
      sinComillas += c;
    }
    i++;
  }

  if (campos !== null || dentroDeCadena) {
    throw new Error("El volcado termina a la mitad de una fila (¿archivo truncado?).");
  }
  return { tuplas, fin: n };
}

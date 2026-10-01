// Marca de orden de bytes UTF-8: sin ella, Excel abre el CSV asumiendo la
// codificacion local de Windows y descompone los acentos.
const BOM_UTF8 = "﻿";

// Excel (y otras hojas de calculo) interpretan como formula un valor que
// empieza con estos caracteres. Anteponer un apostrofo lo muestra como texto
// y evita que un nombre como =HYPERLINK(...) se ejecute al abrir el archivo.
const INICIO_DE_FORMULA = /^[=+\-@\t\r]/;

/** Escapa un valor para CSV (RFC 4180) y neutraliza formulas. */
export function escaparCampoCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  let texto = String(valor);
  if (INICIO_DE_FORMULA.test(texto)) {
    texto = `'${texto}`;
  }
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

/**
 * Convierte un arreglo de objetos a texto CSV, usando `columnas` para fijar
 * el orden/encabezado y `filas` como fuente de datos ya aplanados.
 */
export function generarCsv(columnas: string[], filas: Record<string, unknown>[]): string {
  const encabezado = columnas.map(escaparCampoCsv).join(",");
  const lineas = filas.map((fila) => columnas.map((c) => escaparCampoCsv(fila[c])).join(","));
  return BOM_UTF8 + [encabezado, ...lineas].join("\r\n");
}

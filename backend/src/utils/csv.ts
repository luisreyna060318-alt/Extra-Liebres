/** Escapa un valor para CSV (RFC 4180): comillas dobles si contiene coma, comilla o salto de linea. */
function escaparCampoCsv(valor: unknown): string {
  if (valor === null || valor === undefined) return "";
  const texto = String(valor);
  if (/[",\n\r]/.test(texto)) {
    return `"${texto.replace(/"/g, '""')}"`;
  }
  return texto;
}

// Marca de orden de bytes UTF-8 (﻿): sin ella, Excel abre el CSV
// asumiendo la codificacion local de Windows y descompone los acentos.
const BOM_UTF8 = "﻿";

/**
 * Convierte un arreglo de objetos a texto CSV, usando `columnas` para fijar
 * el orden/encabezado y `filas` como fuente de datos ya aplanados.
 */
export function generarCsv(columnas: string[], filas: Record<string, unknown>[]): string {
  const encabezado = columnas.map(escaparCampoCsv).join(",");
  const lineas = filas.map((fila) => columnas.map((c) => escaparCampoCsv(fila[c])).join(","));
  return BOM_UTF8 + [encabezado, ...lineas].join("\r\n");
}

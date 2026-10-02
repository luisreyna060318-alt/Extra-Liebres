/**
 * Maximo de iniciales en un ID de negocio: "{consecutivo}-{iniciales}" debe
 * caber en VARCHAR(20) (idextraescolar, idcarrera) aun con consecutivos de
 * varios digitos.
 */
export const MAX_INICIALES = 10;

/**
 * "Futbol Soccer" -> "FS", "Club de Ajedrez" -> "CDA".
 *
 * De cada palabra se toma su primera letra o digito: asi una palabra como
 * "/" o "(varonil)" no mete en el ID caracteres que rompan una URL ("#", "?",
 * "/"). El resultado se trunca a MAX_INICIALES.
 */
export function iniciales(nombre: string): string {
  const resultado = nombre
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.match(/[\p{L}\p{N}]/u)?.[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, MAX_INICIALES);
  return resultado || "X";
}

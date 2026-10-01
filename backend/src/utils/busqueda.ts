/**
 * Divide el texto de busqueda en palabras para que "Juan Perez" encuentre a
 * quien tenga "Juan" en un campo y "Perez" en otro: cada palabra debe
 * aparecer en alguno de los campos (AND de OR). Se limita a 5 palabras.
 */
export function palabrasDeBusqueda(search: string | undefined): string[] {
  return (search ?? "").trim().split(/\s+/).filter(Boolean).slice(0, 5);
}

/** Construye { AND: [ { OR: campos(palabra1) }, { OR: campos(palabra2) }, ... ] }. */
export function cadaPalabraEnAlgunCampo<T>(
  search: string | undefined,
  campos: (palabra: string) => T[]
): { AND: { OR: T[] }[] } | undefined {
  const palabras = palabrasDeBusqueda(search);
  if (palabras.length === 0) return undefined;
  return { AND: palabras.map((palabra) => ({ OR: campos(palabra) })) };
}

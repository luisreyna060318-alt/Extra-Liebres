import { prisma } from "../config/prisma";

/**
 * Generadores de identificadores de negocio, portados 1:1 desde la logica
 * PHP original. Estos IDs siguen siendo generados por el backend (nunca por
 * el cliente) para preservar el formato historico de datos.
 */

/** "Futbol Soccer" -> "FS", "Club de Ajedrez" -> "CDA" */
function iniciales(nombre: string): string {
  return nombre
    .trim()
    .split(/\s+/)
    .map((palabra) => palabra.charAt(0).toUpperCase())
    .join("");
}

/** "{consecutivo}-{iniciales(nombre)}" a partir de los IDs con ese mismo formato ya existentes. */
function siguienteIdConIniciales(idsExistentes: string[], nombre: string): string {
  const maximo = idsExistentes.reduce((max, id) => {
    const prefijo = Number.parseInt(id.split("-")[0] ?? "", 10);
    return Number.isFinite(prefijo) ? Math.max(max, prefijo) : max;
  }, 0);

  return `${maximo + 1}-${iniciales(nombre)}`;
}

/** idextraescolar = "{consecutivo}-{iniciales(nombreextra)}", p.ej. "12-FS" */
export async function generarIdExtraescolar(nombreextra: string): Promise<string> {
  const existentes = await prisma.extraescolar.findMany({
    select: { idextraescolar: true },
  });
  return siguienteIdConIniciales(
    existentes.map((e) => e.idextraescolar),
    nombreextra
  );
}

/** idcarrera = "{consecutivo}-{iniciales(nombre)}", p.ej. "1-II" para "Ingenieria Industrial" */
export async function generarIdCarrera(nombre: string): Promise<string> {
  const existentes = await prisma.carrera.findMany({ select: { idcarrera: true } });
  return siguienteIdConIniciales(
    existentes.map((c) => c.idcarrera),
    nombre
  );
}

const PAR_MESES: Record<string, string> = {
  ENERO: "JUNIO",
  JUNIO: "ENERO",
  AGOSTO: "DICIEMBRE",
  DICIEMBRE: "AGOSTO",
};

export function mesTerminoEsperado(mesinicio: string): string | undefined {
  return PAR_MESES[mesinicio.toUpperCase()];
}

/** idsemestre = "{inicial mesinicio}{inicial mestermino}-{ultimos 2 digitos del anio}", p.ej. "EJ-25" */
export function generarIdSemestre(
  mesinicio: string,
  mestermino: string,
  anio: string
): string {
  const letras = `${mesinicio.charAt(0).toUpperCase()}${mestermino.charAt(0).toUpperCase()}`;
  const sufijoAnio = anio.slice(-2);
  return `${letras}-${sufijoAnio}`;
}

/**
 * idgrupo = "{consecutivo}-{idextraescolar sin guiones}-{primeros 10 del rfc}-{idsemestre sin guiones}"
 * El semestre es opcional en el modelo de datos; si no se asigna, se usa el marcador "SINSEM".
 */
export async function generarIdGrupo(params: {
  idextraescolar: string;
  rfcpromotor: string;
  idsemestre?: string | null;
}): Promise<string> {
  const total = await prisma.grupo.count();
  const consecutivo = total + 1;

  const extraescolarSinGuion = params.idextraescolar.replace(/-/g, "");
  const rfcCorto = params.rfcpromotor.slice(0, 10);
  const semestreSinGuion = params.idsemestre
    ? params.idsemestre.replace(/-/g, "")
    : "SINSEM";

  return `${consecutivo}-${extraescolarSinGuion}-${rfcCorto}-${semestreSinGuion}`;
}

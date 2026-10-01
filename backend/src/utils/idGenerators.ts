import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { iniciales } from "./iniciales";

/**
 * Generadores de identificadores de negocio, portados desde la logica PHP
 * original. Estos IDs siguen siendo generados por el backend (nunca por el
 * cliente) para preservar el formato historico de datos.
 *
 * Los que usan un consecutivo leen la tabla para calcular el siguiente: deben
 * llamarse dentro de conCandado() (utils/bloqueo.ts) para que dos altas
 * simultaneas no obtengan el mismo numero.
 */

type Db = Prisma.TransactionClient | typeof prisma;

/** Mayor prefijo numerico ("12" en "12-FS") de una lista de IDs, + 1. */
export function siguienteConsecutivo(idsExistentes: string[]): number {
  const maximo = idsExistentes.reduce((max, id) => {
    const prefijo = Number.parseInt(id.split("-")[0] ?? "", 10);
    return Number.isFinite(prefijo) ? Math.max(max, prefijo) : max;
  }, 0);
  return maximo + 1;
}

/** idextraescolar = "{consecutivo}-{iniciales(nombreextra)}", p.ej. "12-FS" */
export async function generarIdExtraescolar(nombreextra: string, db: Db = prisma): Promise<string> {
  const existentes = await db.extraescolar.findMany({ select: { idextraescolar: true } });
  const consecutivo = siguienteConsecutivo(existentes.map((e) => e.idextraescolar));
  return `${consecutivo}-${iniciales(nombreextra)}`;
}

/** idcarrera = "{consecutivo}-{iniciales(nombre)}", p.ej. "1-II" para "Ingenieria Industrial" */
export async function generarIdCarrera(nombre: string, db: Db = prisma): Promise<string> {
  const existentes = await db.carrera.findMany({ select: { idcarrera: true } });
  const consecutivo = siguienteConsecutivo(existentes.map((c) => c.idcarrera));
  return `${consecutivo}-${iniciales(nombre)}`;
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
 * El consecutivo es el mayor existente + 1 (no el total de grupos: tras borrar
 * uno, "total + 1" repetia un consecutivo que ya existia).
 * El semestre es opcional en el modelo de datos; si no se asigna, se usa el marcador "SINSEM".
 */
export async function generarIdGrupo(
  params: {
    idextraescolar: string;
    rfcpromotor: string;
    idsemestre?: string | null;
  },
  db: Db = prisma
): Promise<string> {
  const existentes = await db.grupo.findMany({ select: { idgrupo: true } });
  const consecutivo = siguienteConsecutivo(existentes.map((g) => g.idgrupo));

  const extraescolarSinGuion = params.idextraescolar.replace(/-/g, "");
  const rfcCorto = params.rfcpromotor.slice(0, 10);
  const semestreSinGuion = params.idsemestre
    ? params.idsemestre.replace(/-/g, "")
    : "SINSEM";

  return `${consecutivo}-${extraescolarSinGuion}-${rfcCorto}-${semestreSinGuion}`;
}

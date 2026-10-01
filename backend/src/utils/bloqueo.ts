import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

/**
 * Ejecuta `operacion` en una transaccion que primero toma un candado de
 * PostgreSQL (pg_advisory_xact_lock) asociado a `clave`. Dos altas que
 * calculan el siguiente consecutivo de la misma tabla se ejecutan una tras
 * otra, asi que nunca obtienen el mismo numero. El candado se libera solo al
 * terminar la transaccion.
 */
export async function conCandado<T>(
  clave: string,
  operacion: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${clave}))`;
    return operacion(tx);
  });
}

/**
 * Bloquea la fila padre (SELECT ... FOR UPDATE) dentro de una transaccion de
 * borrado: mientras dure, nadie puede insertar hijos que la referencien, asi
 * que el impacto contado antes de borrar es el que realmente se borra.
 * `tabla` y `columna` son constantes del codigo, nunca entrada del usuario.
 */
export async function bloquearFila(
  tx: Prisma.TransactionClient,
  tabla: "alumno" | "grupo" | "promotor" | "extraescolar" | "semestre",
  columna: string,
  valor: string
): Promise<boolean> {
  const filas = await tx.$queryRaw<unknown[]>`
    SELECT 1 FROM ${Prisma.raw(`"${tabla}"`)}
    WHERE ${Prisma.raw(`"${columna}"`)} = ${valor}
    FOR UPDATE`;
  return filas.length > 0;
}

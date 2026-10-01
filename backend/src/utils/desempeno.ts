import { ApiError } from "./ApiError";

// Escala de desempeno 0-4 usada por el sistema original: la calificacion
// numerica siempre determina la etiqueta, nunca se acepta la etiqueta suelta.
const ESCALA_DESEMPENO: Record<number, string> = {
  0: "INSUFICIENTE",
  1: "SUFICIENTE",
  2: "BUENO",
  3: "NOTABLE",
  4: "EXCELENTE",
};

export function calificacionADesempeno(calificacion: number): string {
  const desempeno = ESCALA_DESEMPENO[calificacion];
  if (!desempeno) {
    throw ApiError.badRequest(
      `Calificacion invalida: ${calificacion}. Debe ser un entero entre 0 y 4.`
    );
  }
  return desempeno;
}

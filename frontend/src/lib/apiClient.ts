import axios from "axios";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:4000/api",
  headers: { "Content-Type": "application/json" },
});

/** Extrae un mensaje de error legible de una respuesta de la API o de un error de red. */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) return data.error;
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Ocurrio un error inesperado.";
}

/**
 * Detecta el 409 estructurado que la API devuelve cuando un borrado tiene
 * efectos secundarios (cascada, desvinculacion) y aun no fue confirmado.
 * Ver backend/src/utils/confirmarBorrado.ts.
 */
export function getImpactoConfirmacion(error: unknown): { mensaje: string } | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 409) return null;
  const data = error.response.data as
    | { error?: string; details?: { requiereConfirmacion?: boolean } }
    | undefined;
  if (!data?.details?.requiereConfirmacion) return null;
  return { mensaje: data.error ?? "Esta accion tiene efectos secundarios. ¿Deseas continuar?" };
}

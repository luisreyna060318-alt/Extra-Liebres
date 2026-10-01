import axios from "axios";

export const apiClient = axios.create({
  // Mismo origen por defecto: Vite (desarrollo) o nginx (Docker) reenvian /api al backend.
  baseURL: import.meta.env.VITE_API_URL || "/api",
  headers: { "Content-Type": "application/json" },
});

/** Codifica un identificador para usarlo como segmento de una ruta de la API. */
export function seg(valor: string): string {
  return encodeURIComponent(valor);
}

interface CuerpoDeError {
  error?: string;
  details?: {
    formErrors?: string[];
    fieldErrors?: Record<string, string[] | undefined>;
  };
}

/**
 * Extrae un mensaje de error legible de una respuesta de la API o de un error
 * de red. Si la API devolvio errores de validacion por campo, se muestran
 * esos mensajes (son los que dicen que corregir).
 */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "No se pudo conectar con el servidor. Revisa tu conexion e intentalo de nuevo.";
    }
    const data = error.response.data as CuerpoDeError | undefined;
    const porCampo = [
      ...(data?.details?.formErrors ?? []),
      ...Object.values(data?.details?.fieldErrors ?? {}).flatMap((mensajes) => mensajes ?? []),
    ];
    if (porCampo.length > 0) return Array.from(new Set(porCampo)).join(" ");
    if (data?.error) return data.error;
    return `El servidor respondio con un error (${error.response.status}).`;
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

import { useCallback, useState } from "react";
import { Toast, ToastContext, ToastTipo } from "./useToast";

// Los avisos de exito se ocultan solos; los de error permanecen hasta que el
// usuario los cierra, para que alcance a leerlos (y a releerlos con lector
// de pantalla). Se muestran como maximo los ultimos MAX_TOASTS.
const DURACION_EXITO_MS = 5000;
const MAX_TOASTS = 4;
let siguienteId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (tipo: ToastTipo, mensaje: string) => {
      const id = siguienteId++;
      setToasts((actuales) => [...actuales, { id, tipo, mensaje }].slice(-MAX_TOASTS));
      if (tipo === "success") {
        setTimeout(() => dismissToast(id), DURACION_EXITO_MS);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

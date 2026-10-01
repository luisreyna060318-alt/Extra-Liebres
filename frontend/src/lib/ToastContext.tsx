import { createContext, useCallback, useContext, useState } from "react";

export type ToastTipo = "success" | "danger";

interface Toast {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (tipo: ToastTipo, mensaje: string) => void;
  dismissToast: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DURACION_MS = 5000;
let siguienteId = 1;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((actuales) => actuales.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (tipo: ToastTipo, mensaje: string) => {
      const id = siguienteId++;
      setToasts((actuales) => [...actuales, { id, tipo, mensaje }]);
      setTimeout(() => dismissToast(id), DURACION_MS);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de un <ToastProvider>.");
  }
  return ctx;
}

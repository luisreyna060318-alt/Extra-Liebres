import { createContext, useContext } from "react";

export type ToastTipo = "success" | "danger";

export interface Toast {
  id: number;
  tipo: ToastTipo;
  mensaje: string;
}

export interface ToastContextValue {
  toasts: Toast[];
  showToast: (tipo: ToastTipo, mensaje: string) => void;
  dismissToast: (id: number) => void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast debe usarse dentro de un <ToastProvider>.");
  }
  return ctx;
}

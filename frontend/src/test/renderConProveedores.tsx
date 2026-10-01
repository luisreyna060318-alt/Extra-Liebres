import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { ReactElement } from "react";
import { ToastStack } from "../components/ui/ToastStack";
import { ToastProvider } from "../lib/ToastContext";

/** Renderiza con React Query (sin reintentos) y el sistema de avisos. */
export function renderConProveedores(ui: ReactElement) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={cliente}>
      <ToastProvider>
        {ui}
        <ToastStack />
      </ToastProvider>
    </QueryClientProvider>
  );
}

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
  },
});

/** Claves raiz de las consultas; una mutacion invalida todas las que muestran lo que cambio. */
export const CLAVES = {
  alumnos: "alumnos",
  carreras: "carreras",
  promotores: "promotores",
  semestres: "semestres",
  extraescolares: "extraescolares",
  grupos: "grupos",
  roster: "roster-grupo",
  historial: "historial-alumno",
} as const;

export function invalidar(cliente: QueryClient, ...claves: string[]): Promise<void[]> {
  return Promise.all(claves.map((clave) => cliente.invalidateQueries({ queryKey: [clave] })));
}

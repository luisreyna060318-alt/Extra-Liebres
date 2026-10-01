import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLAVES, invalidar } from "../../lib/queryClient";
import * as alumnosApi from "./api";
import { CreateAlumnoInput, FiltrosAlumnos, UpdateAlumnoInput } from "./types";

export function useAlumnos(filtros: FiltrosAlumnos, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [CLAVES.alumnos, filtros, page, pageSize],
    queryFn: () => alumnosApi.fetchAlumnos(filtros, page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useCreateAlumno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlumnoInput) => alumnosApi.createAlumno(input),
    onSuccess: () => invalidar(queryClient, CLAVES.alumnos),
  });
}

export function useUpdateAlumno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nocontrol, input }: { nocontrol: string; input: UpdateAlumnoInput }) =>
      alumnosApi.updateAlumno(nocontrol, input),
    // El nombre y el sexo tambien aparecen en rosters (y sus estadisticas) e historiales.
    onSuccess: () => invalidar(queryClient, CLAVES.alumnos, CLAVES.roster, CLAVES.historial),
  });
}

export function useDeleteAlumno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nocontrol, confirmar }: { nocontrol: string; confirmar: boolean }) =>
      alumnosApi.deleteAlumno(nocontrol, confirmar),
    onSuccess: () => invalidar(queryClient, CLAVES.alumnos, CLAVES.roster, CLAVES.historial),
  });
}

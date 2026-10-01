import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as alumnosApi from "./api";
import { CreateAlumnoInput, FiltrosAlumnos, UpdateAlumnoInput } from "./types";

const ALUMNOS_KEY = "alumnos";

export function useAlumnos(filtros: FiltrosAlumnos, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [ALUMNOS_KEY, filtros, page, pageSize],
    queryFn: () => alumnosApi.fetchAlumnos(filtros, page, pageSize),
  });
}

export function useAlumno(nocontrol: string | undefined) {
  return useQuery({
    queryKey: [ALUMNOS_KEY, "detalle", nocontrol],
    queryFn: () => alumnosApi.fetchAlumno(nocontrol as string),
    enabled: Boolean(nocontrol),
  });
}

export function useCreateAlumno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAlumnoInput) => alumnosApi.createAlumno(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ALUMNOS_KEY] }),
  });
}

export function useUpdateAlumno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nocontrol, input }: { nocontrol: string; input: UpdateAlumnoInput }) =>
      alumnosApi.updateAlumno(nocontrol, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ALUMNOS_KEY] }),
  });
}

export function useDeleteAlumno() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ nocontrol, confirmar }: { nocontrol: string; confirmar: boolean }) =>
      alumnosApi.deleteAlumno(nocontrol, confirmar),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ALUMNOS_KEY] }),
  });
}

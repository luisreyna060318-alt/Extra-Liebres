import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLAVES, invalidar } from "../../lib/queryClient";
import * as carrerasApi from "./api";
import { CreateCarreraInput, UpdateCarreraInput } from "./types";

export function useCarreras(search: string, page: number, pageSize = 20) {
  return useQuery({
    queryKey: [CLAVES.carreras, search, page, pageSize],
    queryFn: () => carrerasApi.fetchCarreras(search, page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useCreateCarrera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCarreraInput) => carrerasApi.createCarrera(input),
    onSuccess: () => invalidar(queryClient, CLAVES.carreras),
  });
}

export function useUpdateCarrera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idcarrera, input }: { idcarrera: string; input: UpdateCarreraInput }) =>
      carrerasApi.updateCarrera(idcarrera, input),
    // El nombre de la carrera se muestra en el listado de alumnos.
    onSuccess: () => invalidar(queryClient, CLAVES.carreras, CLAVES.alumnos, CLAVES.historial),
  });
}

export function useDeleteCarrera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idcarrera }: { idcarrera: string; confirmar: boolean }) =>
      carrerasApi.deleteCarrera(idcarrera),
    onSuccess: () => invalidar(queryClient, CLAVES.carreras),
  });
}

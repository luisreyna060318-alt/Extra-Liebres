import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as carrerasApi from "./api";
import { CreateCarreraInput, UpdateCarreraInput } from "./types";

const CARRERAS_KEY = "carreras";

export function useCarreras(search: string, page: number, pageSize = 20) {
  return useQuery({
    queryKey: [CARRERAS_KEY, search, page, pageSize],
    queryFn: () => carrerasApi.fetchCarreras(search, page, pageSize),
  });
}

export function useCreateCarrera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCarreraInput) => carrerasApi.createCarrera(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CARRERAS_KEY] }),
  });
}

export function useUpdateCarrera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idcarrera, input }: { idcarrera: string; input: UpdateCarreraInput }) =>
      carrerasApi.updateCarrera(idcarrera, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CARRERAS_KEY] }),
  });
}

export function useDeleteCarrera() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (idcarrera: string) => carrerasApi.deleteCarrera(idcarrera),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CARRERAS_KEY] }),
  });
}

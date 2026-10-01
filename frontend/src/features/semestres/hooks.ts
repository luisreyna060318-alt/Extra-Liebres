import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLAVES, invalidar } from "../../lib/queryClient";
import * as semestresApi from "./api";
import { CreateSemestreInput } from "./types";

export function useSemestres(search: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [CLAVES.semestres, search, page, pageSize],
    queryFn: () => semestresApi.fetchSemestres(search, page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useCreateSemestre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSemestreInput) => semestresApi.createSemestre(input),
    onSuccess: () => invalidar(queryClient, CLAVES.semestres),
  });
}

export function useDeleteSemestre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idsemestre, confirmar }: { idsemestre: string; confirmar: boolean }) =>
      semestresApi.deleteSemestre(idsemestre, confirmar),
    // Los grupos de ese semestre quedan sin semestre asignado.
    onSuccess: () => invalidar(queryClient, CLAVES.semestres, CLAVES.grupos, CLAVES.historial),
  });
}

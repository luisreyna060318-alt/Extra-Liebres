import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as semestresApi from "./api";
import { CreateSemestreInput } from "./types";

const SEMESTRES_KEY = "semestres";

export function useSemestres(search: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [SEMESTRES_KEY, search, page, pageSize],
    queryFn: () => semestresApi.fetchSemestres(search, page, pageSize),
  });
}

export function useCreateSemestre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSemestreInput) => semestresApi.createSemestre(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SEMESTRES_KEY] }),
  });
}

export function useDeleteSemestre() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idsemestre, confirmar }: { idsemestre: string; confirmar: boolean }) =>
      semestresApi.deleteSemestre(idsemestre, confirmar),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [SEMESTRES_KEY] }),
  });
}

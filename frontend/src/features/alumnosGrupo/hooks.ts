import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as alumnosGrupoApi from "./api";
import { EnrollBatchInput, UnenrollBatchInput } from "./types";

const ROSTER_KEY = "roster-grupo";

export function useRoster(idgrupo: string | undefined) {
  return useQuery({
    queryKey: [ROSTER_KEY, idgrupo],
    queryFn: () => alumnosGrupoApi.fetchRoster(idgrupo as string),
    enabled: Boolean(idgrupo),
  });
}

export function useEnrollAlumnos(idgrupo: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EnrollBatchInput) => alumnosGrupoApi.enrollAlumnos(idgrupo as string, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROSTER_KEY, idgrupo] }),
  });
}

export function useUnenrollAlumnos(idgrupo: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UnenrollBatchInput) =>
      alumnosGrupoApi.unenrollAlumnos(idgrupo as string, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [ROSTER_KEY, idgrupo] }),
  });
}

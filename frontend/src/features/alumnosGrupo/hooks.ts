import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLAVES, invalidar } from "../../lib/queryClient";
import * as alumnosGrupoApi from "./api";
import { EnrollBatchInput, UnenrollBatchInput } from "./types";

export function useRoster(idgrupo: string | undefined) {
  return useQuery({
    queryKey: [CLAVES.roster, idgrupo],
    queryFn: () => alumnosGrupoApi.fetchRoster(idgrupo as string),
    enabled: Boolean(idgrupo),
  });
}

export function useEnrollAlumnos(idgrupo: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: EnrollBatchInput) => alumnosGrupoApi.enrollAlumnos(idgrupo as string, input),
    onSuccess: () => invalidar(queryClient, CLAVES.roster, CLAVES.historial),
  });
}

export function useUnenrollAlumnos(idgrupo: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: UnenrollBatchInput) =>
      alumnosGrupoApi.unenrollAlumnos(idgrupo as string, input),
    onSuccess: () => invalidar(queryClient, CLAVES.roster, CLAVES.historial),
  });
}

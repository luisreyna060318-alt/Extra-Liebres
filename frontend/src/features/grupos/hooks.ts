import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as gruposApi from "./api";
import { CreateGrupoInput, GruposFiltros, UpdateGrupoInput } from "./types";

const GRUPOS_KEY = "grupos";

export function useGrupos(filtros: GruposFiltros) {
  return useQuery({
    queryKey: [GRUPOS_KEY, filtros],
    queryFn: () => gruposApi.fetchGrupos(filtros),
  });
}

export function useGrupo(idgrupo: string | undefined) {
  return useQuery({
    queryKey: [GRUPOS_KEY, "detalle", idgrupo],
    queryFn: () => gruposApi.fetchGrupo(idgrupo as string),
    enabled: Boolean(idgrupo),
  });
}

export function useCreateGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGrupoInput) => gruposApi.createGrupo(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [GRUPOS_KEY] }),
  });
}

export function useUpdateGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idgrupo, input }: { idgrupo: string; input: UpdateGrupoInput }) =>
      gruposApi.updateGrupo(idgrupo, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [GRUPOS_KEY] }),
  });
}

export function useDeleteGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idgrupo, confirmar }: { idgrupo: string; confirmar: boolean }) =>
      gruposApi.deleteGrupo(idgrupo, confirmar),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [GRUPOS_KEY] }),
  });
}

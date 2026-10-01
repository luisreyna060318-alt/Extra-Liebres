import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLAVES, invalidar } from "../../lib/queryClient";
import * as gruposApi from "./api";
import { CreateGrupoInput, GruposFiltros, UpdateGrupoInput } from "./types";

export function useGrupos(filtros: GruposFiltros) {
  return useQuery({
    queryKey: [CLAVES.grupos, filtros],
    queryFn: () => gruposApi.fetchGrupos(filtros),
    placeholderData: keepPreviousData,
  });
}

export function useGrupo(idgrupo: string | undefined) {
  return useQuery({
    queryKey: [CLAVES.grupos, "detalle", idgrupo],
    queryFn: () => gruposApi.fetchGrupo(idgrupo as string),
    enabled: Boolean(idgrupo),
  });
}

export function useCreateGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateGrupoInput) => gruposApi.createGrupo(input),
    onSuccess: () => invalidar(queryClient, CLAVES.grupos),
  });
}

export function useUpdateGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idgrupo, input }: { idgrupo: string; input: UpdateGrupoInput }) =>
      gruposApi.updateGrupo(idgrupo, input),
    onSuccess: () => invalidar(queryClient, CLAVES.grupos),
  });
}

export function useDeleteGrupo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idgrupo, confirmar }: { idgrupo: string; confirmar: boolean }) =>
      gruposApi.deleteGrupo(idgrupo, confirmar),
    // Borra en cascada las inscripciones del grupo.
    onSuccess: () => invalidar(queryClient, CLAVES.grupos, CLAVES.roster, CLAVES.historial),
  });
}

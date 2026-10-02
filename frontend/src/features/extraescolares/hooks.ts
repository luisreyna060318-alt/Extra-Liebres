import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLAVES, invalidar } from "../../lib/queryClient";
import * as extraescolaresApi from "./api";
import { CreateExtraescolarInput, UpdateExtraescolarInput } from "./types";

export function useExtraescolares(search: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [CLAVES.extraescolares, search, page, pageSize],
    queryFn: () => extraescolaresApi.fetchExtraescolares(search, page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useCreateExtraescolar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExtraescolarInput) => extraescolaresApi.createExtraescolar(input),
    onSuccess: () => invalidar(queryClient, CLAVES.extraescolares),
  });
}

export function useUpdateExtraescolar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      idextraescolar,
      input,
    }: {
      idextraescolar: string;
      input: UpdateExtraescolarInput;
    }) => extraescolaresApi.updateExtraescolar(idextraescolar, input),
    // El nombre de la actividad se muestra en grupos e historiales.
    onSuccess: () =>
      invalidar(queryClient, CLAVES.extraescolares, CLAVES.grupos, CLAVES.historial),
  });
}

export function useDeleteExtraescolar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idextraescolar, confirmar }: { idextraescolar: string; confirmar: boolean }) =>
      extraescolaresApi.deleteExtraescolar(idextraescolar, confirmar),
    // Borra en cascada sus grupos e inscripciones.
    onSuccess: () =>
      invalidar(queryClient, CLAVES.extraescolares, CLAVES.grupos, CLAVES.roster, CLAVES.historial),
  });
}

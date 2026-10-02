import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CLAVES, invalidar } from "../../lib/queryClient";
import * as promotoresApi from "./api";
import { CreatePromotorInput, UpdatePromotorInput } from "./types";

export function usePromotores(search: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [CLAVES.promotores, search, page, pageSize],
    queryFn: () => promotoresApi.fetchPromotores(search, page, pageSize),
    placeholderData: keepPreviousData,
  });
}

export function useCreatePromotor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePromotorInput) => promotoresApi.createPromotor(input),
    onSuccess: () => invalidar(queryClient, CLAVES.promotores),
  });
}

export function useUpdatePromotor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rfc, input }: { rfc: string; input: UpdatePromotorInput }) =>
      promotoresApi.updatePromotor(rfc, input),
    // El nombre del promotor se muestra en grupos e historiales.
    onSuccess: () => invalidar(queryClient, CLAVES.promotores, CLAVES.grupos, CLAVES.historial),
  });
}

export function useDeletePromotor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rfc, confirmar }: { rfc: string; confirmar: boolean }) =>
      promotoresApi.deletePromotor(rfc, confirmar),
    // Borra en cascada sus grupos e inscripciones.
    onSuccess: () =>
      invalidar(queryClient, CLAVES.promotores, CLAVES.grupos, CLAVES.roster, CLAVES.historial),
  });
}

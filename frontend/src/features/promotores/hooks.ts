import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as promotoresApi from "./api";
import { CreatePromotorInput, UpdatePromotorInput } from "./types";

const PROMOTORES_KEY = "promotores";

export function usePromotores(search: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [PROMOTORES_KEY, search, page, pageSize],
    queryFn: () => promotoresApi.fetchPromotores(search, page, pageSize),
  });
}

export function useCreatePromotor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePromotorInput) => promotoresApi.createPromotor(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PROMOTORES_KEY] }),
  });
}

export function useUpdatePromotor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rfc, input }: { rfc: string; input: UpdatePromotorInput }) =>
      promotoresApi.updatePromotor(rfc, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PROMOTORES_KEY] }),
  });
}

export function useDeletePromotor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rfc, confirmar }: { rfc: string; confirmar: boolean }) =>
      promotoresApi.deletePromotor(rfc, confirmar),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [PROMOTORES_KEY] }),
  });
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as extraescolaresApi from "./api";
import { CreateExtraescolarInput, UpdateExtraescolarInput } from "./types";

const EXTRAESCOLARES_KEY = "extraescolares";

export function useExtraescolares(search: string, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: [EXTRAESCOLARES_KEY, search, page, pageSize],
    queryFn: () => extraescolaresApi.fetchExtraescolares(search, page, pageSize),
  });
}

export function useCreateExtraescolar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExtraescolarInput) => extraescolaresApi.createExtraescolar(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EXTRAESCOLARES_KEY] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EXTRAESCOLARES_KEY] }),
  });
}

export function useDeleteExtraescolar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ idextraescolar, confirmar }: { idextraescolar: string; confirmar: boolean }) =>
      extraescolaresApi.deleteExtraescolar(idextraescolar, confirmar),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [EXTRAESCOLARES_KEY] }),
  });
}

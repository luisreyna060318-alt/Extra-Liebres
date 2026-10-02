import { apiClient, seg } from "../../lib/apiClient";
import { PaginatedResponse } from "../../types/pagination";
import { CreatePromotorInput, Promotor, UpdatePromotorInput } from "./types";

export async function fetchPromotores(
  search: string | undefined,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Promotor>> {
  const { data } = await apiClient.get<PaginatedResponse<Promotor>>("/promotores", {
    params: { search, page, pageSize },
  });
  return data;
}

export async function createPromotor(input: CreatePromotorInput): Promise<Promotor> {
  const { data } = await apiClient.post<Promotor>("/promotores", input);
  return data;
}

export async function updatePromotor(rfc: string, input: UpdatePromotorInput): Promise<Promotor> {
  const { data } = await apiClient.put<Promotor>(`/promotores/${seg(rfc)}`, input);
  return data;
}

export async function deletePromotor(rfc: string, confirmar: boolean): Promise<void> {
  await apiClient.delete(`/promotores/${seg(rfc)}`, { params: { confirmar } });
}

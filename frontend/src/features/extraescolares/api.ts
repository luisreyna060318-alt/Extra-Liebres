import { apiClient, seg } from "../../lib/apiClient";
import { PaginatedResponse } from "../../types/pagination";
import { CreateExtraescolarInput, Extraescolar, UpdateExtraescolarInput } from "./types";

export async function fetchExtraescolares(
  search: string | undefined,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Extraescolar>> {
  const { data } = await apiClient.get<PaginatedResponse<Extraescolar>>("/extraescolares", {
    params: { search, page, pageSize },
  });
  return data;
}

export async function createExtraescolar(input: CreateExtraescolarInput): Promise<Extraescolar> {
  const { data } = await apiClient.post<Extraescolar>("/extraescolares", input);
  return data;
}

export async function updateExtraescolar(
  idextraescolar: string,
  input: UpdateExtraescolarInput
): Promise<Extraescolar> {
  const { data } = await apiClient.put<Extraescolar>(`/extraescolares/${seg(idextraescolar)}`, input);
  return data;
}

export async function deleteExtraescolar(
  idextraescolar: string,
  confirmar: boolean
): Promise<void> {
  await apiClient.delete(`/extraescolares/${seg(idextraescolar)}`, { params: { confirmar } });
}

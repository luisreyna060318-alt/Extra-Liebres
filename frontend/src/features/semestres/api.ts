import { apiClient } from "../../lib/apiClient";
import { PaginatedResponse } from "../../types/pagination";
import { CreateSemestreInput, Semestre } from "./types";

export async function fetchSemestres(
  search: string | undefined,
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<Semestre>> {
  const { data } = await apiClient.get<PaginatedResponse<Semestre>>("/semestres", {
    params: { search, page, pageSize },
  });
  return data;
}

export async function createSemestre(input: CreateSemestreInput): Promise<Semestre> {
  const { data } = await apiClient.post<Semestre>("/semestres", input);
  return data;
}

export async function deleteSemestre(idsemestre: string, confirmar: boolean): Promise<void> {
  await apiClient.delete(`/semestres/${idsemestre}`, { params: { confirmar } });
}

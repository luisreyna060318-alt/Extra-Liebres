import { apiClient } from "../../lib/apiClient";
import { PaginatedResponse } from "../../types/pagination";
import { CreateGrupoInput, Grupo, GruposFiltros, UpdateGrupoInput } from "./types";

export async function fetchGrupos(filtros: GruposFiltros): Promise<PaginatedResponse<Grupo>> {
  const { data } = await apiClient.get<PaginatedResponse<Grupo>>("/grupos", { params: filtros });
  return data;
}

export async function fetchGrupo(idgrupo: string): Promise<Grupo> {
  const { data } = await apiClient.get<Grupo>(`/grupos/${idgrupo}`);
  return data;
}

export async function createGrupo(input: CreateGrupoInput): Promise<Grupo> {
  const { data } = await apiClient.post<Grupo>("/grupos", input);
  return data;
}

export async function updateGrupo(idgrupo: string, input: UpdateGrupoInput): Promise<Grupo> {
  const { data } = await apiClient.put<Grupo>(`/grupos/${idgrupo}`, input);
  return data;
}

export async function deleteGrupo(idgrupo: string, confirmar: boolean): Promise<void> {
  await apiClient.delete(`/grupos/${idgrupo}`, { params: { confirmar } });
}

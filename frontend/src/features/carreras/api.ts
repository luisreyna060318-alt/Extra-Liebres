import { apiClient } from "../../lib/apiClient";
import { PaginatedResponse } from "../../types/pagination";
import { Carrera, CreateCarreraInput, UpdateCarreraInput } from "./types";

export async function fetchCarreras(
  search: string | undefined,
  page: number,
  pageSize = 20
): Promise<PaginatedResponse<Carrera>> {
  const { data } = await apiClient.get<PaginatedResponse<Carrera>>("/carreras", {
    params: { search, page, pageSize },
  });
  return data;
}

export async function fetchCarrera(idcarrera: string): Promise<Carrera> {
  const { data } = await apiClient.get<Carrera>(`/carreras/${idcarrera}`);
  return data;
}

export async function createCarrera(input: CreateCarreraInput): Promise<Carrera> {
  const { data } = await apiClient.post<Carrera>("/carreras", input);
  return data;
}

export async function updateCarrera(
  idcarrera: string,
  input: UpdateCarreraInput
): Promise<Carrera> {
  const { data } = await apiClient.put<Carrera>(`/carreras/${idcarrera}`, input);
  return data;
}

export async function deleteCarrera(idcarrera: string): Promise<void> {
  await apiClient.delete(`/carreras/${idcarrera}`);
}

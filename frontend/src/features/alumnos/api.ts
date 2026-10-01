import { apiClient } from "../../lib/apiClient";
import { PaginatedResponse } from "../../types/pagination";
import { Alumno, CreateAlumnoInput, FiltrosAlumnos, UpdateAlumnoInput } from "./types";

export async function fetchAlumnos(
  filtros: FiltrosAlumnos,
  page: number,
  pageSize = 20
): Promise<PaginatedResponse<Alumno>> {
  const { data } = await apiClient.get<PaginatedResponse<Alumno>>("/alumnos", {
    params: { ...filtros, page, pageSize },
  });
  return data;
}

export async function fetchAlumno(nocontrol: string): Promise<Alumno> {
  const { data } = await apiClient.get<Alumno>(`/alumnos/${nocontrol}`);
  return data;
}

export async function createAlumno(input: CreateAlumnoInput): Promise<Alumno> {
  const { data } = await apiClient.post<Alumno>("/alumnos", input);
  return data;
}

export async function updateAlumno(nocontrol: string, input: UpdateAlumnoInput): Promise<Alumno> {
  const { data } = await apiClient.put<Alumno>(`/alumnos/${nocontrol}`, input);
  return data;
}

export async function deleteAlumno(nocontrol: string, confirmar: boolean): Promise<void> {
  await apiClient.delete(`/alumnos/${nocontrol}`, { params: { confirmar } });
}

/** URL lista para usar en un <a href> — el navegador maneja la descarga nativamente. */
export function getExportAlumnosUrl(filtros: FiltrosAlumnos): string {
  const params = new URLSearchParams();
  if (filtros.search) params.set("search", filtros.search);
  if (filtros.idcarrera) params.set("idcarrera", filtros.idcarrera);
  if (filtros.campus) params.set("campus", filtros.campus);
  if (filtros.sexo) params.set("sexo", filtros.sexo);
  const baseUrl = apiClient.defaults.baseURL ?? "";
  const query = params.toString();
  return `${baseUrl}/alumnos/export${query ? `?${query}` : ""}`;
}

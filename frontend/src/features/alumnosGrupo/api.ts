import { apiClient, seg } from "../../lib/apiClient";
import {
  EnrollBatchInput,
  ResultadoOperacion,
  RosterGrupo,
  UnenrollBatchInput,
} from "./types";

export async function fetchRoster(idgrupo: string): Promise<RosterGrupo> {
  const { data } = await apiClient.get<RosterGrupo>(`/grupos/${seg(idgrupo)}/alumnos`);
  return data;
}

export async function enrollAlumnos(
  idgrupo: string,
  input: EnrollBatchInput
): Promise<ResultadoOperacion[]> {
  const { data } = await apiClient.post<{ resultados: ResultadoOperacion[] }>(
    `/grupos/${seg(idgrupo)}/alumnos`,
    input
  );
  return data.resultados;
}

export async function unenrollAlumnos(
  idgrupo: string,
  input: UnenrollBatchInput
): Promise<ResultadoOperacion[]> {
  const { data } = await apiClient.delete<{ resultados: ResultadoOperacion[] }>(
    `/grupos/${seg(idgrupo)}/alumnos`,
    { data: input }
  );
  return data.resultados;
}

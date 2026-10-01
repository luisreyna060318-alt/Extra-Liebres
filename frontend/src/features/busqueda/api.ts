import { apiClient } from "../../lib/apiClient";
import { HistorialAlumno } from "./types";

export async function fetchHistorialAlumno(nocontrol: string): Promise<HistorialAlumno> {
  const { data } = await apiClient.get<HistorialAlumno>(
    `/busqueda/alumnos/${nocontrol}/extraescolares`
  );
  return data;
}

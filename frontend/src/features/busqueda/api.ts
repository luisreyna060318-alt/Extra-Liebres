import { apiClient, seg } from "../../lib/apiClient";
import { HistorialAlumno } from "./types";

export async function fetchHistorialAlumno(nocontrol: string): Promise<HistorialAlumno> {
  const { data } = await apiClient.get<HistorialAlumno>(
    `/busqueda/alumnos/${seg(nocontrol)}/extraescolares`
  );
  return data;
}

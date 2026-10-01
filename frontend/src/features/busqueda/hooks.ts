import { useQuery } from "@tanstack/react-query";
import * as busquedaApi from "./api";

export function useHistorialAlumno(nocontrol: string | undefined) {
  return useQuery({
    queryKey: ["historial-alumno", nocontrol],
    queryFn: () => busquedaApi.fetchHistorialAlumno(nocontrol as string),
    enabled: Boolean(nocontrol),
  });
}

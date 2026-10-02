import { useQuery } from "@tanstack/react-query";
import { CLAVES } from "../../lib/queryClient";
import * as busquedaApi from "./api";

export function useHistorialAlumno(nocontrol: string | undefined) {
  return useQuery({
    queryKey: [CLAVES.historial, nocontrol],
    queryFn: () => busquedaApi.fetchHistorialAlumno(nocontrol as string),
    enabled: Boolean(nocontrol),
  });
}

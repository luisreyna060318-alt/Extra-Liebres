import { getApiErrorMessage } from "../../lib/apiClient";
import { LoadingSpinner } from "./LoadingSpinner";

interface EstadoConsultaProps {
  cargando: boolean;
  error: unknown;
  onReintentar: () => void;
  children: React.ReactNode;
}

/**
 * Muestra "Cargando...", un error con opcion de reintentar, o el contenido.
 * Sin esto, una consulta fallida dejaba el spinner girando para siempre.
 */
export function EstadoConsulta({ cargando, error, onReintentar, children }: EstadoConsultaProps) {
  if (error) {
    return (
      <div className="alert alert-danger d-flex flex-wrap align-items-center gap-2" role="alert">
        <span className="flex-grow-1">No se pudieron cargar los datos: {getApiErrorMessage(error)}</span>
        <button type="button" className="btn btn-sm btn-outline-danger" onClick={onReintentar}>
          Reintentar
        </button>
      </div>
    );
  }
  if (cargando) return <LoadingSpinner />;
  return <>{children}</>;
}

import { ConfirmButton } from "../../../components/ui/ConfirmButton";
import { Extraescolar } from "../types";

interface ExtraescolaresTableProps {
  extraescolares: Extraescolar[];
  idEnEdicion?: string | null;
  onEditar: (extraescolar: Extraescolar) => void;
  onBorrar: (idextraescolar: string) => void;
}

export function ExtraescolaresTable({
  extraescolares,
  idEnEdicion,
  onEditar,
  onBorrar,
}: ExtraescolaresTableProps) {
  if (extraescolares.length === 0) {
    return <p className="text-muted">No se encontraron actividades extraescolares.</p>;
  }

  return (
    <>
      <div className="table-responsive d-none d-md-block">
        <table className="table table-striped table-hover align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {extraescolares.map((extraescolar) => (
              <tr
                key={extraescolar.idextraescolar}
                className={extraescolar.idextraescolar === idEnEdicion ? "table-active" : ""}
              >
                <td>{extraescolar.idextraescolar}</td>
                <td>{extraescolar.nombreextra}</td>
                <td className="btn-group-actions">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onEditar(extraescolar)}
                  >
                    Editar
                  </button>
                  <ConfirmButton
                    className="btn btn-sm btn-outline-danger"
                    confirmMessage={`¿Borrar la actividad ${extraescolar.nombreextra}?`}
                    onConfirm={() => onBorrar(extraescolar.idextraescolar)}
                  >
                    Borrar
                  </ConfirmButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="d-md-none d-flex flex-column gap-2">
        {extraescolares.map((extraescolar) => (
          <div
            key={extraescolar.idextraescolar}
            className={`card card-body${extraescolar.idextraescolar === idEnEdicion ? " border-primary" : ""}`}
          >
            <div className="fw-semibold">{extraescolar.nombreextra}</div>
            <div className="text-muted small mono">{extraescolar.idextraescolar}</div>
            <div className="btn-group-actions mt-3">
              <button
                className="btn btn-sm btn-outline-primary flex-fill"
                onClick={() => onEditar(extraescolar)}
              >
                Editar
              </button>
              <ConfirmButton
                className="btn btn-sm btn-outline-danger flex-fill"
                confirmMessage={`¿Borrar la actividad ${extraescolar.nombreextra}?`}
                onConfirm={() => onBorrar(extraescolar.idextraescolar)}
              >
                Borrar
              </ConfirmButton>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

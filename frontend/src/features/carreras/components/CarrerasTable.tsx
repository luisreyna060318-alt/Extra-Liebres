import { ConfirmButton } from "../../../components/ui/ConfirmButton";
import { Carrera } from "../types";

interface CarrerasTableProps {
  carreras: Carrera[];
  idEnEdicion?: string | null;
  onEditar: (carrera: Carrera) => void;
  onBorrar: (idcarrera: string) => void;
}

export function CarrerasTable({ carreras, idEnEdicion, onEditar, onBorrar }: CarrerasTableProps) {
  if (carreras.length === 0) {
    return <p className="text-muted">No se encontraron carreras.</p>;
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
            {carreras.map((carrera) => (
              <tr key={carrera.idcarrera} className={carrera.idcarrera === idEnEdicion ? "table-active" : ""}>
                <td>{carrera.idcarrera}</td>
                <td>{carrera.nombre}</td>
                <td className="btn-group-actions">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onEditar(carrera)}
                  >
                    Editar
                  </button>
                  <ConfirmButton
                    className="btn btn-sm btn-outline-danger"
                    confirmMessage={`¿Borrar la carrera ${carrera.nombre}?`}
                    onConfirm={() => onBorrar(carrera.idcarrera)}
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
        {carreras.map((carrera) => (
          <div
            key={carrera.idcarrera}
            className={`card card-body${carrera.idcarrera === idEnEdicion ? " border-primary" : ""}`}
          >
            <div className="fw-semibold">{carrera.nombre}</div>
            <div className="text-muted small mono">{carrera.idcarrera}</div>
            <div className="btn-group-actions mt-3">
              <button
                className="btn btn-sm btn-outline-primary flex-fill"
                onClick={() => onEditar(carrera)}
              >
                Editar
              </button>
              <ConfirmButton
                className="btn btn-sm btn-outline-danger flex-fill"
                confirmMessage={`¿Borrar la carrera ${carrera.nombre}?`}
                onConfirm={() => onBorrar(carrera.idcarrera)}
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

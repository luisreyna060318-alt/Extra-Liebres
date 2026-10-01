import { ConfirmButton } from "../../../components/ui/ConfirmButton";
import { Alumno } from "../types";

interface AlumnosTableProps {
  alumnos: Alumno[];
  idEnEdicion?: string | null;
  onEditar: (alumno: Alumno) => void;
  onBorrar: (nocontrol: string) => void;
}

export function AlumnosTable({ alumnos, idEnEdicion, onEditar, onBorrar }: AlumnosTableProps) {
  if (alumnos.length === 0) {
    return <p className="text-muted">No se encontraron alumnos con estos filtros.</p>;
  }

  return (
    <>
      <div className="table-responsive d-none d-md-block">
        <table className="table table-striped table-hover align-middle">
          <thead>
            <tr>
              <th>No. control</th>
              <th>Nombre completo</th>
              <th>Sexo</th>
              <th>Carrera</th>
              <th>Campus</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {alumnos.map((alumno) => (
              <tr key={alumno.nocontrol} className={alumno.nocontrol === idEnEdicion ? "table-active" : ""}>
                <td>{alumno.nocontrol}</td>
                <td>
                  {alumno.nombre} {alumno.appaterno} {alumno.apmaterno ?? ""}
                </td>
                <td>{alumno.sexo ?? "—"}</td>
                <td>{alumno.carrera.nombre}</td>
                <td>{alumno.campus.replace("_", " ")}</td>
                <td className="btn-group-actions">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onEditar(alumno)}
                  >
                    Editar
                  </button>
                  <ConfirmButton
                    className="btn btn-sm btn-outline-danger"
                    confirmMessage={`¿Borrar a ${alumno.nombre} ${alumno.appaterno}?`}
                    onConfirm={() => onBorrar(alumno.nocontrol)}
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
        {alumnos.map((alumno) => (
          <div
            key={alumno.nocontrol}
            className={`card card-body${alumno.nocontrol === idEnEdicion ? " border-primary" : ""}`}
          >
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <div className="fw-semibold">
                  {alumno.nombre} {alumno.appaterno} {alumno.apmaterno ?? ""}
                </div>
                <div className="text-muted small mono">{alumno.nocontrol}</div>
              </div>
              <span className="badge text-bg-light border">{alumno.campus.replace("_", " ")}</span>
            </div>
            <dl className="row-kv mt-2 mb-0">
              <div><dt>Carrera</dt><dd>{alumno.carrera.nombre}</dd></div>
              <div><dt>Sexo</dt><dd>{alumno.sexo ?? "—"}</dd></div>
            </dl>
            <div className="btn-group-actions mt-3">
              <button
                className="btn btn-sm btn-outline-primary flex-fill"
                onClick={() => onEditar(alumno)}
              >
                Editar
              </button>
              <ConfirmButton
                className="btn btn-sm btn-outline-danger flex-fill"
                confirmMessage={`¿Borrar a ${alumno.nombre} ${alumno.appaterno}?`}
                onConfirm={() => onBorrar(alumno.nocontrol)}
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

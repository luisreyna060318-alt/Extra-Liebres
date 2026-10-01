import { ConfirmButton } from "../../../components/ui/ConfirmButton";
import { Semestre } from "../types";

interface SemestresTableProps {
  semestres: Semestre[];
  onBorrar: (idsemestre: string) => void;
}

export function SemestresTable({ semestres, onBorrar }: SemestresTableProps) {
  if (semestres.length === 0) {
    return <p className="text-muted">No se encontraron semestres.</p>;
  }

  return (
    <>
      <div className="table-responsive d-none d-md-block">
        <table className="table table-striped table-hover align-middle">
          <thead>
            <tr>
              <th>ID</th>
              <th>Periodo</th>
              <th>Anio</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {semestres.map((semestre) => (
              <tr key={semestre.idsemestre}>
                <td>{semestre.idsemestre}</td>
                <td>
                  {semestre.mesinicio} - {semestre.mestermino}
                </td>
                <td>{semestre.anio}</td>
                <td className="btn-group-actions">
                  <ConfirmButton
                    className="btn btn-sm btn-outline-danger"
                    confirmMessage={`¿Borrar el semestre ${semestre.idsemestre}?`}
                    onConfirm={() => onBorrar(semestre.idsemestre)}
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
        {semestres.map((semestre) => (
          <div key={semestre.idsemestre} className="card card-body">
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <div className="fw-semibold">{semestre.idsemestre}</div>
                <div className="text-muted small">
                  {semestre.mesinicio} - {semestre.mestermino} · {semestre.anio}
                </div>
              </div>
            </div>
            <div className="btn-group-actions mt-3">
              <ConfirmButton
                className="btn btn-sm btn-outline-danger flex-fill"
                confirmMessage={`¿Borrar el semestre ${semestre.idsemestre}?`}
                onConfirm={() => onBorrar(semestre.idsemestre)}
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

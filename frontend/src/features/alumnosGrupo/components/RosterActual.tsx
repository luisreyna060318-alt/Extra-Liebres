import { ConfirmButton } from "../../../components/ui/ConfirmButton";
import { RosterGrupo } from "../types";

interface RosterActualProps {
  roster: RosterGrupo;
  onRetirar: (nocontrol: string) => void;
}

export function RosterActual({ roster, onRetirar }: RosterActualProps) {
  return (
    <div>
      <div className="row mb-3">
        <div className="col-md-3">
          <div className="card card-body text-center">
            <span className="text-muted small">Total inscritos</span>
            <span className="fs-4 fw-bold">{roster.total}</span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-body text-center">
            <span className="text-muted small">Masculino</span>
            <span className="fs-4 fw-bold">
              {roster.estadisticasPorSexo.masculino.cantidad} (
              {roster.estadisticasPorSexo.masculino.porcentaje}%)
            </span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-body text-center">
            <span className="text-muted small">Femenino</span>
            <span className="fs-4 fw-bold">
              {roster.estadisticasPorSexo.femenino.cantidad} (
              {roster.estadisticasPorSexo.femenino.porcentaje}%)
            </span>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card card-body text-center">
            <span className="text-muted small">Sin especificar</span>
            <span className="fs-4 fw-bold">
              {roster.estadisticasPorSexo.sinEspecificar.cantidad} (
              {roster.estadisticasPorSexo.sinEspecificar.porcentaje}%)
            </span>
          </div>
        </div>
      </div>

      {roster.alumnos.length === 0 ? (
        <p className="text-muted">Aun no hay alumnos inscritos en este grupo.</p>
      ) : (
        <>
          <div className="table-responsive d-none d-md-block">
            <table className="table table-striped table-sm align-middle">
              <thead>
                <tr>
                  <th>No. control</th>
                  <th>Nombre</th>
                  <th>Sexo</th>
                  <th>Calificacion</th>
                  <th>Desempeno</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {roster.alumnos.map((alumno) => (
                  <tr key={alumno.nocontrol}>
                    <td>{alumno.nocontrol}</td>
                    <td>
                      {alumno.nombre} {alumno.appaterno} {alumno.apmaterno ?? ""}
                    </td>
                    <td>{alumno.sexo ?? "—"}</td>
                    <td>{alumno.calificacion}</td>
                    <td>{alumno.desempeno}</td>
                    <td>
                      <ConfirmButton
                        className="btn btn-sm btn-outline-danger"
                        confirmMessage={`¿Retirar a ${alumno.nocontrol} de este grupo?`}
                        onConfirm={() => onRetirar(alumno.nocontrol)}
                      >
                        Retirar
                      </ConfirmButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-md-none d-flex flex-column gap-2">
            {roster.alumnos.map((alumno) => (
              <div key={alumno.nocontrol} className="card card-body">
                <div className="fw-semibold">
                  {alumno.nombre} {alumno.appaterno} {alumno.apmaterno ?? ""}
                </div>
                <div className="text-muted small mono">{alumno.nocontrol}</div>
                <dl className="row-kv mt-2 mb-0">
                  <div><dt>Calificacion</dt><dd>{alumno.calificacion}</dd></div>
                  <div><dt>Desempeno</dt><dd>{alumno.desempeno}</dd></div>
                </dl>
                <div className="btn-group-actions mt-3">
                  <ConfirmButton
                    className="btn btn-sm btn-outline-danger flex-fill"
                    confirmMessage={`¿Retirar a ${alumno.nocontrol} de este grupo?`}
                    onConfirm={() => onRetirar(alumno.nocontrol)}
                  >
                    Retirar
                  </ConfirmButton>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

import { Link } from "react-router-dom";
import { ConfirmButton } from "../../../components/ui/ConfirmButton";
import { Grupo } from "../types";

interface GruposTableProps {
  grupos: Grupo[];
  idEnEdicion?: string | null;
  onEditar: (grupo: Grupo) => void;
  onBorrar: (idgrupo: string) => void;
}

function horario(grupo: Grupo): string {
  const dias = [grupo.primerdia, grupo.segundodia].filter(Boolean).join(" y ") || "Sin dia";
  const horas =
    grupo.horainicio && grupo.horatermino ? ` (${grupo.horainicio} - ${grupo.horatermino})` : "";
  return `${dias}${horas}`;
}

export function GruposTable({ grupos, idEnEdicion, onEditar, onBorrar }: GruposTableProps) {
  if (grupos.length === 0) {
    return <p className="text-muted">No se encontraron grupos con estos filtros.</p>;
  }

  return (
    <>
      <div className="table-responsive d-none d-md-block">
        <table className="table table-striped table-hover align-middle">
          <thead>
            <tr>
              <th>Actividad</th>
              <th>Promotor</th>
              <th>Semestre</th>
              <th>Horario</th>
              <th>Aula</th>
              <th>ID grupo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map((grupo) => (
              <tr key={grupo.idgrupo} className={grupo.idgrupo === idEnEdicion ? "table-active" : ""}>
                <td>{grupo.extraescolar.nombreextra}</td>
                <td>
                  {grupo.promotor.nombre} {grupo.promotor.appaterno}
                </td>
                <td>{grupo.semestre ? `${grupo.semestre.idsemestre}` : "Sin asignar"}</td>
                <td>{horario(grupo)}</td>
                <td>{grupo.aula ?? "-"}</td>
                <td className="text-muted small mono text-break">{grupo.idgrupo}</td>
                <td className="btn-group-actions">
                  <Link
                    to={`/gestionar-alumnos-grupo?idgrupo=${encodeURIComponent(grupo.idgrupo)}`}
                    className="btn btn-sm btn-outline-secondary"
                  >
                    Ver roster
                  </Link>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onEditar(grupo)}
                  >
                    Editar
                  </button>
                  <ConfirmButton
                    className="btn btn-sm btn-outline-danger"
                    confirmMessage={`¿Borrar el grupo de ${grupo.extraescolar.nombreextra} con ${grupo.promotor.nombre} ${grupo.promotor.appaterno}?`}
                    onConfirm={() => onBorrar(grupo.idgrupo)}
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
        {grupos.map((grupo) => (
          <div
            key={grupo.idgrupo}
            className={`card card-body${grupo.idgrupo === idEnEdicion ? " border-primary" : ""}`}
          >
            <div className="fw-semibold">{grupo.extraescolar.nombreextra}</div>
            <div className="text-muted small mono text-break">{grupo.idgrupo}</div>
            <dl className="row-kv mt-2 mb-0">
              <div><dt>Promotor</dt><dd>{grupo.promotor.nombre} {grupo.promotor.appaterno}</dd></div>
              <div><dt>Semestre</dt><dd>{grupo.semestre ? grupo.semestre.idsemestre : "Sin asignar"}</dd></div>
              <div><dt>Horario</dt><dd>{horario(grupo)}</dd></div>
              <div><dt>Aula</dt><dd>{grupo.aula ?? "-"}</dd></div>
            </dl>
            <div className="btn-group-actions mt-3">
              <Link
                to={`/gestionar-alumnos-grupo?idgrupo=${encodeURIComponent(grupo.idgrupo)}`}
                className="btn btn-sm btn-outline-secondary flex-fill"
              >
                Ver roster
              </Link>
              <button
                className="btn btn-sm btn-outline-primary flex-fill"
                onClick={() => onEditar(grupo)}
              >
                Editar
              </button>
              <ConfirmButton
                className="btn btn-sm btn-outline-danger flex-fill"
                confirmMessage={`¿Borrar el grupo de ${grupo.extraescolar.nombreextra} con ${grupo.promotor.nombre} ${grupo.promotor.appaterno}?`}
                onConfirm={() => onBorrar(grupo.idgrupo)}
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

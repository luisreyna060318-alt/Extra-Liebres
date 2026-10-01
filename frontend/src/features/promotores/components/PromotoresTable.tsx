import { ConfirmButton } from "../../../components/ui/ConfirmButton";
import { Promotor } from "../types";

interface PromotoresTableProps {
  promotores: Promotor[];
  idEnEdicion?: string | null;
  onEditar: (promotor: Promotor) => void;
  onBorrar: (rfc: string) => void;
}

export function PromotoresTable({ promotores, idEnEdicion, onEditar, onBorrar }: PromotoresTableProps) {
  if (promotores.length === 0) {
    return <p className="text-muted">No se encontraron promotores.</p>;
  }

  return (
    <>
      <div className="table-responsive d-none d-md-block">
        <table className="table table-striped table-hover align-middle">
          <thead>
            <tr>
              <th>RFC</th>
              <th>Nombre completo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {promotores.map((promotor) => (
              <tr key={promotor.rfc} className={promotor.rfc === idEnEdicion ? "table-active" : ""}>
                <td>{promotor.rfc}</td>
                <td>
                  {promotor.nombre} {promotor.appaterno} {promotor.apmaterno}
                </td>
                <td className="btn-group-actions">
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onEditar(promotor)}
                  >
                    Editar
                  </button>
                  <ConfirmButton
                    className="btn btn-sm btn-outline-danger"
                    confirmMessage={`¿Borrar a ${promotor.nombre} ${promotor.appaterno}?`}
                    onConfirm={() => onBorrar(promotor.rfc)}
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
        {promotores.map((promotor) => (
          <div
            key={promotor.rfc}
            className={`card card-body${promotor.rfc === idEnEdicion ? " border-primary" : ""}`}
          >
            <div className="fw-semibold">
              {promotor.nombre} {promotor.appaterno} {promotor.apmaterno}
            </div>
            <div className="text-muted small mono">{promotor.rfc}</div>
            <div className="btn-group-actions mt-3">
              <button
                className="btn btn-sm btn-outline-primary flex-fill"
                onClick={() => onEditar(promotor)}
              >
                Editar
              </button>
              <ConfirmButton
                className="btn btn-sm btn-outline-danger flex-fill"
                confirmMessage={`¿Borrar a ${promotor.nombre} ${promotor.appaterno}?`}
                onConfirm={() => onBorrar(promotor.rfc)}
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

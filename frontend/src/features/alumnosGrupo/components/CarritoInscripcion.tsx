import { ESCALA_DESEMPENO } from "../desempenoLabels";

export interface ItemCarrito {
  nocontrol: string;
  nombreCompleto: string;
  calificacion: number | null;
}

interface CarritoInscripcionProps {
  items: ItemCarrito[];
  onCambiarCalificacion: (nocontrol: string, calificacion: number) => void;
  onQuitar: (nocontrol: string) => void;
  onInscribir: () => void;
  enviando: boolean;
}

export function CarritoInscripcion({
  items,
  onCambiarCalificacion,
  onQuitar,
  onInscribir,
  enviando,
}: CarritoInscripcionProps) {
  if (items.length === 0) {
    return <p className="text-muted">Selecciona alumnos de la lista para inscribirlos.</p>;
  }

  const faltantes = items.filter((item) => item.calificacion === null).length;

  return (
    <div>
      <div className="table-responsive">
        <table className="table table-sm align-middle">
          <thead>
            <tr>
              <th>No. control</th>
              <th>Nombre</th>
              <th>Calificacion</th>
              <th>Desempeno</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.nocontrol}>
                <td>{item.nocontrol}</td>
                <td>{item.nombreCompleto}</td>
                <td>
                  <select
                    className={`form-select form-select-sm${item.calificacion === null ? " is-invalid" : ""}`}
                    value={item.calificacion ?? ""}
                    onChange={(e) =>
                      onCambiarCalificacion(item.nocontrol, Number(e.target.value))
                    }
                  >
                    <option value="" disabled>
                      -- Elegir --
                    </option>
                    {[0, 1, 2, 3, 4].map((valor) => (
                      <option key={valor} value={valor}>
                        {valor}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{item.calificacion !== null ? ESCALA_DESEMPENO[item.calificacion] : "—"}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => onQuitar(item.nocontrol)}
                  >
                    Quitar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {faltantes > 0 && (
        <p className="text-danger small">
          Falta asignar calificacion a {faltantes} alumno{faltantes > 1 ? "s" : ""} antes de inscribir.
        </p>
      )}
      <button
        type="button"
        className="btn btn-brand"
        onClick={onInscribir}
        disabled={enviando || faltantes > 0}
      >
        Inscribir seleccionados
      </button>
    </div>
  );
}

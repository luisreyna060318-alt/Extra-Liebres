import { useState } from "react";
import { useAlumnos } from "../../alumnos/hooks";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";

interface BuscadorAlumnosProps {
  idsExcluidos: string[];
  onAgregar: (nocontrol: string, nombreCompleto: string) => void;
}

export function BuscadorAlumnos({ idsExcluidos, onAgregar }: BuscadorAlumnosProps) {
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebouncedValue(busqueda);
  const { data: resultado, isLoading } = useAlumnos({ search: busquedaDebounced });
  const alumnos = resultado?.data ?? [];

  return (
    <div>
      <label className="form-label">Buscar alumno para inscribir</label>
      <input
        className="form-control mb-2"
        placeholder="Numero de control o nombre..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
      {isLoading ? (
        <p className="text-muted">Buscando...</p>
      ) : (
        <div className="table-responsive" style={{ maxHeight: 300 }}>
          <table className="table table-sm table-hover align-middle">
            <tbody>
              {alumnos.map((alumno) => {
                const nombreCompleto = `${alumno.nombre} ${alumno.appaterno} ${alumno.apmaterno ?? ""}`;
                const yaAgregado = idsExcluidos.includes(alumno.nocontrol);
                return (
                  <tr key={alumno.nocontrol}>
                    <td>{alumno.nocontrol}</td>
                    <td>{nombreCompleto}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-success"
                        disabled={yaAgregado}
                        onClick={() => onAgregar(alumno.nocontrol, nombreCompleto)}
                      >
                        {yaAgregado ? "Agregado" : "Seleccionar"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

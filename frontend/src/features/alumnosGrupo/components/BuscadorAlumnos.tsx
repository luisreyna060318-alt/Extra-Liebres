import { useId, useState } from "react";
import { EstadoConsulta } from "../../../components/ui/EstadoConsulta";
import { useDebouncedValue } from "../../../lib/useDebouncedValue";
import { useAlumnos } from "../../alumnos/hooks";

interface BuscadorAlumnosProps {
  idsExcluidos: string[];
  onAgregar: (nocontrol: string, nombreCompleto: string) => void;
}

export function BuscadorAlumnos({ idsExcluidos, onAgregar }: BuscadorAlumnosProps) {
  const id = useId();
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebouncedValue(busqueda);
  const consulta = useAlumnos({ search: busquedaDebounced });
  const alumnos = consulta.data?.data ?? [];

  return (
    <div>
      <label className="form-label" htmlFor={id}>
        Buscar alumno para inscribir
      </label>
      <input
        id={id}
        type="search"
        className="form-control mb-2"
        placeholder="Numero de control o nombre completo..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
      <EstadoConsulta
        cargando={consulta.isLoading}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {alumnos.length === 0 ? (
          <p className="text-muted">No se encontraron alumnos.</p>
        ) : (
          <div className="table-responsive" style={{ maxHeight: 300 }}>
            <table className="table table-sm table-hover align-middle">
              <caption className="visually-hidden">Resultados de la busqueda de alumnos</caption>
              <tbody>
                {alumnos.map((alumno) => {
                  const nombreCompleto = `${alumno.nombre} ${alumno.appaterno} ${alumno.apmaterno ?? ""}`.trim();
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
                          aria-label={`${yaAgregado ? "Ya agregado" : "Seleccionar"}: ${nombreCompleto}`}
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
      </EstadoConsulta>
    </div>
  );
}

import axios from "axios";
import { useId, useState } from "react";
import AsyncSelect from "react-select/async";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { getApiErrorMessage } from "../../lib/apiClient";
import { fetchAlumnos } from "../alumnos/api";
import { useHistorialAlumno } from "./hooks";

interface OpcionAlumno {
  value: string;
  label: string;
}

export function BusquedaAlumnoPage() {
  const id = useId();
  const [nocontrol, setNocontrol] = useState<string | undefined>(undefined);
  const { data, isLoading, error } = useHistorialAlumno(nocontrol);
  const noExiste = axios.isAxiosError(error) && error.response?.status === 404;

  async function cargarAlumnos(term: string): Promise<OpcionAlumno[]> {
    const resultado = await fetchAlumnos({ search: term }, 1, 20);
    return resultado.data.map((alumno) => ({
      value: alumno.nocontrol,
      label: `${alumno.nocontrol} - ${alumno.nombre} ${alumno.appaterno} ${alumno.apmaterno ?? ""}`,
    }));
  }

  return (
    <div>
      <h1 className="page-title">Extraescolares cursados por un alumno</h1>

      <div className="mb-3" style={{ maxWidth: 420 }}>
        <label className="form-label" htmlFor={id}>
          Alumno
        </label>
        <AsyncSelect<OpcionAlumno>
          inputId={id}
          cacheOptions
          defaultOptions
          isClearable
          loadOptions={cargarAlumnos}
          placeholder="Buscar por numero de control o nombre..."
          noOptionsMessage={() => "Sin resultados."}
          loadingMessage={() => "Buscando..."}
          onChange={(opcion) => setNocontrol(opcion?.value)}
        />
      </div>

      {isLoading && <LoadingSpinner />}
      {error && (
        <div className="alert alert-danger" role="alert">
          {noExiste
            ? "No se encontro un alumno con ese numero de control."
            : `No se pudo consultar el historial: ${getApiErrorMessage(error)}`}
        </div>
      )}

      {data && (
        <>
          <h2 className="h5">
            {data.alumno.nombre} {data.alumno.appaterno} {data.alumno.apmaterno ?? ""}
          </h2>
          {data.historial.length === 0 ? (
            <p className="text-muted">Este alumno no tiene actividades extraescolares registradas.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-striped align-middle">
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Promotor</th>
                    <th>Semestre</th>
                    <th>Calificacion</th>
                    <th>Desempeno</th>
                  </tr>
                </thead>
                <tbody>
                  {data.historial.map((item) => (
                    <tr key={item.idgrupo}>
                      <td>{item.extraescolar}</td>
                      <td>{item.promotor}</td>
                      <td>{item.semestre ?? "Sin asignar"}</td>
                      <td>{item.calificacion}</td>
                      <td>{item.desempeno}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

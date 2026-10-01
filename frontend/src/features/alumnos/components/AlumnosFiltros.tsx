import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { fetchCarreras } from "../../carreras/api";
import { Campus, FiltrosAlumnos, Sexo } from "../types";

interface OpcionCarrera {
  value: string;
  label: string;
}

interface AlumnosFiltrosProps {
  filtros: FiltrosAlumnos;
  onChange: (filtros: FiltrosAlumnos) => void;
}

export function AlumnosFiltrosForm({ filtros, onChange }: AlumnosFiltrosProps) {
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<OpcionCarrera | null>(null);

  useEffect(() => {
    if (!filtros.idcarrera) setCarreraSeleccionada(null);
  }, [filtros.idcarrera]);

  async function cargarCarreras(term: string): Promise<OpcionCarrera[]> {
    const resultado = await fetchCarreras(term, 1, 20);
    return resultado.data.map((c) => ({ value: c.idcarrera, label: c.nombre }));
  }

  return (
    <div className="row g-3 mb-3">
      <div className="col-md-4">
        <input
          className="form-control"
          placeholder="Buscar por numero de control o nombre..."
          value={filtros.search ?? ""}
          onChange={(e) => onChange({ ...filtros, search: e.target.value })}
        />
      </div>
      <div className="col-md-3">
        <AsyncSelect<OpcionCarrera>
          cacheOptions
          defaultOptions
          isClearable
          value={carreraSeleccionada}
          loadOptions={cargarCarreras}
          placeholder="Filtrar por carrera..."
          onChange={(opcion) => {
            setCarreraSeleccionada(opcion);
            onChange({ ...filtros, idcarrera: opcion?.value });
          }}
        />
      </div>
      <div className="col-md-2">
        <select
          className="form-select"
          value={filtros.campus ?? ""}
          onChange={(e) =>
            onChange({ ...filtros, campus: (e.target.value || undefined) as Campus | undefined })
          }
        >
          <option value="">Todos los campus</option>
          <option value="CAMPUS_1">CAMPUS 1</option>
          <option value="CAMPUS_2">CAMPUS 2</option>
        </select>
      </div>
      <div className="col-md-3">
        <select
          className="form-select"
          value={filtros.sexo ?? ""}
          onChange={(e) =>
            onChange({ ...filtros, sexo: (e.target.value || undefined) as Sexo | undefined })
          }
        >
          <option value="">Todos (masculino/femenino/sin especificar)</option>
          <option value="MASCULINO">MASCULINO</option>
          <option value="FEMENINO">FEMENINO</option>
        </select>
      </div>
    </div>
  );
}

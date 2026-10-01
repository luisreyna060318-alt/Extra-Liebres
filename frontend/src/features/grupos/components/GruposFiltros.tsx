import { useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { fetchExtraescolares } from "../../extraescolares/api";
import { fetchPromotores } from "../../promotores/api";
import { GruposFiltros } from "../types";

interface Opcion {
  value: string;
  label: string;
}

interface GruposFiltrosFormProps {
  filtros: GruposFiltros;
  onChange: (filtros: GruposFiltros) => void;
}

export function GruposFiltrosForm({ filtros, onChange }: GruposFiltrosFormProps) {
  const [actividadSeleccionada, setActividadSeleccionada] = useState<Opcion | null>(null);
  const [promotorSeleccionado, setPromotorSeleccionado] = useState<Opcion | null>(null);

  useEffect(() => {
    if (!filtros.idextraescolar) setActividadSeleccionada(null);
  }, [filtros.idextraescolar]);

  useEffect(() => {
    if (!filtros.rfcpromotor) setPromotorSeleccionado(null);
  }, [filtros.rfcpromotor]);

  async function cargarExtraescolares(term: string): Promise<Opcion[]> {
    const resultado = await fetchExtraescolares(term, 1, 20);
    return resultado.data.map((e) => ({ value: e.idextraescolar, label: e.nombreextra }));
  }

  async function cargarPromotores(term: string): Promise<Opcion[]> {
    const resultado = await fetchPromotores(term, 1, 20);
    return resultado.data.map((p) => ({
      value: p.rfc,
      label: `${p.nombre} ${p.appaterno} ${p.apmaterno}`,
    }));
  }

  // Se filtra por el ID de la opcion elegida (no por su texto): asi el filtro
  // por promotor devuelve sus grupos y el de actividad no mezcla actividades
  // cuyo nombre contiene al de la elegida.
  return (
    <div className="row g-3 mb-3">
      <div className="col-md-4">
        <AsyncSelect<Opcion>
          aria-label="Filtrar por actividad extraescolar"
          cacheOptions
          defaultOptions
          isClearable
          value={actividadSeleccionada}
          loadOptions={cargarExtraescolares}
          placeholder="Filtrar por actividad extraescolar..."
          noOptionsMessage={() => "Sin resultados."}
          loadingMessage={() => "Buscando..."}
          onChange={(opcion) => {
            setActividadSeleccionada(opcion);
            onChange({ ...filtros, idextraescolar: opcion?.value });
          }}
        />
      </div>
      <div className="col-md-4">
        <AsyncSelect<Opcion>
          aria-label="Filtrar por promotor"
          cacheOptions
          defaultOptions
          isClearable
          value={promotorSeleccionado}
          loadOptions={cargarPromotores}
          placeholder="Filtrar por promotor..."
          noOptionsMessage={() => "Sin resultados."}
          loadingMessage={() => "Buscando..."}
          onChange={(opcion) => {
            setPromotorSeleccionado(opcion);
            onChange({ ...filtros, rfcpromotor: opcion?.value });
          }}
        />
      </div>
      <div className="col-md-4">
        <input
          className="form-control"
          aria-label="Filtrar por anio del semestre"
          placeholder="Filtrar por anio (2025)..."
          maxLength={4}
          inputMode="numeric"
          value={filtros.anio ?? ""}
          onChange={(e) => onChange({ ...filtros, anio: e.target.value.replace(/\D/g, "") })}
        />
      </div>
    </div>
  );
}

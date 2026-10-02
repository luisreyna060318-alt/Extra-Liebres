import AsyncSelect from "react-select/async";
import { fetchGrupos } from "../../grupos/api";

export interface OpcionGrupo {
  value: string;
  label: string;
}

interface GrupoSelectorProps {
  inputId?: string;
  value?: OpcionGrupo | null;
  onSeleccionar: (idgrupo: string | null) => void;
}

export function GrupoSelector({ inputId, value, onSeleccionar }: GrupoSelectorProps) {
  async function cargarGrupos(term: string): Promise<OpcionGrupo[]> {
    const resultado = await fetchGrupos({ search: term, pageSize: 20 });
    return resultado.data.map((g) => ({
      value: g.idgrupo,
      label: `${g.extraescolar.nombreextra} - ${g.promotor.nombre} ${g.promotor.appaterno} (${g.idgrupo})`,
    }));
  }

  return (
    <AsyncSelect<OpcionGrupo>
      inputId={inputId}
      cacheOptions
      defaultOptions
      value={value}
      loadOptions={cargarGrupos}
      placeholder="Buscar grupo por actividad, promotor o id..."
      noOptionsMessage={() => "Sin resultados."}
      loadingMessage={() => "Buscando..."}
      onChange={(opcion) => onSeleccionar(opcion?.value ?? null)}
      isClearable
    />
  );
}

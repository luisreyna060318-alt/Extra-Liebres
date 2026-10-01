import AsyncSelect from "react-select/async";
import { fetchGrupos } from "../../grupos/api";

export interface OpcionGrupo {
  value: string;
  label: string;
}

interface GrupoSelectorProps {
  value?: OpcionGrupo | null;
  onSeleccionar: (idgrupo: string | null) => void;
}

export function GrupoSelector({ value, onSeleccionar }: GrupoSelectorProps) {
  async function cargarGrupos(term: string): Promise<OpcionGrupo[]> {
    const resultado = await fetchGrupos({ search: term, pageSize: 20 });
    return resultado.data.map((g) => ({
      value: g.idgrupo,
      label: `${g.extraescolar.nombreextra} - ${g.promotor.nombre} ${g.promotor.appaterno} (${g.idgrupo})`,
    }));
  }

  return (
    <AsyncSelect<OpcionGrupo>
      cacheOptions
      defaultOptions
      value={value}
      loadOptions={cargarGrupos}
      placeholder="Buscar grupo por actividad, promotor o id..."
      onChange={(opcion) => onSeleccionar(opcion?.value ?? null)}
      isClearable
    />
  );
}

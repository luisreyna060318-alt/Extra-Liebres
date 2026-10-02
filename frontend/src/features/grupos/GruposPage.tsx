import { useState } from "react";
import { EstadoConsulta } from "../../components/ui/EstadoConsulta";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage } from "../../lib/apiClient";
import { useBorradoConConfirmacion } from "../../lib/useBorradoConConfirmacion";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { useToast } from "../../lib/useToast";
import { GrupoForm } from "./components/GrupoForm";
import { GruposFiltrosForm } from "./components/GruposFiltros";
import { GruposTable } from "./components/GruposTable";
import { useCreateGrupo, useDeleteGrupo, useGrupos, useUpdateGrupo } from "./hooks";
import { CreateGrupoInput, Grupo, GruposFiltros, UpdateGrupoInput } from "./types";

export function GruposPage() {
  const { showToast } = useToast();
  const [filtros, setFiltros] = useState<GruposFiltros>({});
  const filtrosDebounced = useDebouncedValue(filtros);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [grupoEnEdicion, setGrupoEnEdicion] = useState<Grupo | null>(null);
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(grupoEnEdicion);

  const consulta = useGrupos({ ...filtrosDebounced, page, pageSize });
  const resultado = consulta.data;
  const crear = useCreateGrupo();
  const actualizar = useUpdateGrupo();
  const borrar = useDeleteGrupo();
  const borrado = useBorradoConConfirmacion({
    borrar: (idgrupo, confirmar) => borrar.mutateAsync({ idgrupo, confirmar }),
    mensajeExito: "Grupo borrado correctamente.",
  });

  function handleCrear(input: CreateGrupoInput) {
    crear.mutate(input, {
      onSuccess: () => {
        showToast("success", "Grupo agregado correctamente.");
        cerrar();
      },
      onError: (error) => showToast("danger", getApiErrorMessage(error)),
    });
  }

  function handleActualizar(input: UpdateGrupoInput) {
    if (!grupoEnEdicion) return;
    actualizar.mutate(
      { idgrupo: grupoEnEdicion.idgrupo, input },
      {
        onSuccess: () => {
          showToast("success", "Grupo actualizado correctamente.");
          setGrupoEnEdicion(null);
        },
        onError: (error) => showToast("danger", getApiErrorMessage(error)),
      }
    );
  }

  function handleCancelar() {
    setGrupoEnEdicion(null);
    cerrar();
  }

  return (
    <div>
      <h1 className="page-title">Grupos</h1>

      <div ref={formRef}>
        {abierto ? (
          <GrupoForm
            grupoEnEdicion={grupoEnEdicion}
            onCrear={handleCrear}
            onActualizar={handleActualizar}
            onCancelar={handleCancelar}
            enviando={crear.isPending || actualizar.isPending}
          />
        ) : (
          <button type="button" className="btn btn-brand mb-4" onClick={abrirCreacion}>
            + Agregar grupo
          </button>
        )}
      </div>

      <GruposFiltrosForm
        filtros={filtros}
        onChange={(nuevosFiltros) => {
          setFiltros(nuevosFiltros);
          setPage(1);
        }}
      />

      {Object.values(filtros).some(Boolean) && (
        <button
          type="button"
          className="btn btn-link btn-sm ps-0 mb-2"
          onClick={() => {
            setFiltros({});
            setPage(1);
          }}
        >
          Limpiar filtros
        </button>
      )}

      <EstadoConsulta
        cargando={consulta.isLoading || !resultado}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {resultado && (
          <>
            <GruposTable
              grupos={resultado.data}
              idEnEdicion={grupoEnEdicion?.idgrupo}
              onEditar={setGrupoEnEdicion}
              onBorrar={borrado.solicitarBorrado}
            />
            <Pagination
              page={resultado.page}
              pageSize={resultado.pageSize}
              total={resultado.total}
              onPageChange={setPage}
              onPageSizeChange={(nuevoTamano) => {
                setPageSize(nuevoTamano);
                setPage(1);
              }}
            />
          </>
        )}
      </EstadoConsulta>

      {borrado.dialogo}
    </div>
  );
}

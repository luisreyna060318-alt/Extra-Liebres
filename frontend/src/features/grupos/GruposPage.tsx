import { useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage, getImpactoConfirmacion } from "../../lib/apiClient";
import { useToast } from "../../lib/ToastContext";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { GrupoForm } from "./components/GrupoForm";
import { GruposFiltrosForm } from "./components/GruposFiltros";
import { GruposTable } from "./components/GruposTable";
import { useCreateGrupo, useDeleteGrupo, useGrupos, useUpdateGrupo } from "./hooks";
import { CreateGrupoInput, Grupo, GruposFiltros } from "./types";

export function GruposPage() {
  const { showToast } = useToast();
  const [filtros, setFiltros] = useState<GruposFiltros>({});
  const filtrosDebounced = useDebouncedValue(filtros);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [grupoEnEdicion, setGrupoEnEdicion] = useState<Grupo | null>(null);
  const [confirmacion, setConfirmacion] = useState<{ idgrupo: string; mensaje: string } | null>(
    null
  );
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(grupoEnEdicion);

  const { data: resultado, isLoading } = useGrupos({ ...filtrosDebounced, page, pageSize });
  const crear = useCreateGrupo();
  const actualizar = useUpdateGrupo();
  const borrar = useDeleteGrupo();

  function handleCrear(input: CreateGrupoInput) {
    crear.mutate(input, {
      onSuccess: () => {
        showToast("success", "Grupo agregado correctamente.");
        cerrar();
      },
      onError: (error) => showToast("danger", getApiErrorMessage(error)),
    });
  }

  function handleActualizar(input: CreateGrupoInput) {
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

  function handleBorrar(idgrupo: string) {
    borrar.mutate(
      { idgrupo, confirmar: false },
      {
        onSuccess: () => showToast("success", "Grupo borrado correctamente."),
        onError: (error) => {
          const impacto = getImpactoConfirmacion(error);
          if (impacto) {
            setConfirmacion({ idgrupo, mensaje: impacto.mensaje });
            return;
          }
          showToast("danger", getApiErrorMessage(error));
        },
      }
    );
  }

  function handleConfirmarBorrado() {
    if (!confirmacion) return;
    borrar.mutate(
      { idgrupo: confirmacion.idgrupo, confirmar: true },
      {
        onSuccess: () => {
          showToast("success", "Grupo borrado correctamente.");
          setConfirmacion(null);
        },
        onError: (error) => {
          showToast("danger", getApiErrorMessage(error));
          setConfirmacion(null);
        },
      }
    );
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

      {isLoading || !resultado ? (
        <LoadingSpinner />
      ) : (
        <>
          <GruposTable
            grupos={resultado.data}
            idEnEdicion={grupoEnEdicion?.idgrupo}
            onEditar={setGrupoEnEdicion}
            onBorrar={handleBorrar}
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

      {confirmacion && (
        <ConfirmDialog
          mensaje={confirmacion.mensaje}
          enviando={borrar.isPending}
          onConfirmar={handleConfirmarBorrado}
          onCancelar={() => setConfirmacion(null)}
        />
      )}
    </div>
  );
}

import { useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage, getImpactoConfirmacion } from "../../lib/apiClient";
import { useToast } from "../../lib/ToastContext";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { SemestreForm } from "./components/SemestreForm";
import { SemestresTable } from "./components/SemestresTable";
import { useCreateSemestre, useDeleteSemestre, useSemestres } from "./hooks";
import { CreateSemestreInput } from "./types";

export function SemestresPage() {
  const { showToast } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebouncedValue(busqueda);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [confirmacion, setConfirmacion] = useState<{ idsemestre: string; mensaje: string } | null>(
    null
  );
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(null);

  const { data: resultado, isLoading } = useSemestres(busquedaDebounced, page, pageSize);
  const crear = useCreateSemestre();
  const borrar = useDeleteSemestre();

  function handleCrear(input: CreateSemestreInput) {
    crear.mutate(input, {
      onSuccess: () => {
        showToast("success", "Semestre agregado correctamente.");
        cerrar();
      },
      onError: (error) => showToast("danger", getApiErrorMessage(error)),
    });
  }

  function handleBorrar(idsemestre: string) {
    borrar.mutate(
      { idsemestre, confirmar: false },
      {
        onSuccess: () => showToast("success", "Semestre borrado correctamente."),
        onError: (error) => {
          const impacto = getImpactoConfirmacion(error);
          if (impacto) {
            setConfirmacion({ idsemestre, mensaje: impacto.mensaje });
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
      { idsemestre: confirmacion.idsemestre, confirmar: true },
      {
        onSuccess: () => {
          showToast("success", "Semestre borrado correctamente.");
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
      <h1 className="page-title">Semestres</h1>

      <div ref={formRef}>
        {abierto ? (
          <SemestreForm onCrear={handleCrear} onCancelar={cerrar} enviando={crear.isPending} />
        ) : (
          <button type="button" className="btn btn-brand mb-4" onClick={abrirCreacion}>
            + Agregar semestre
          </button>
        )}
      </div>

      <div className="mb-3">
        <div className="input-group" style={{ maxWidth: 420 }}>
          <input
            className="form-control"
            placeholder="Buscar por anio..."
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPage(1);
            }}
          />
          {busqueda && (
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                setBusqueda("");
                setPage(1);
              }}
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {isLoading || !resultado ? (
        <LoadingSpinner />
      ) : (
        <>
          <SemestresTable semestres={resultado.data} onBorrar={handleBorrar} />
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

import { useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage, getImpactoConfirmacion } from "../../lib/apiClient";
import { useToast } from "../../lib/ToastContext";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { ExtraescolarForm } from "./components/ExtraescolarForm";
import { ExtraescolaresTable } from "./components/ExtraescolaresTable";
import {
  useCreateExtraescolar,
  useDeleteExtraescolar,
  useExtraescolares,
  useUpdateExtraescolar,
} from "./hooks";
import { Extraescolar } from "./types";

export function ExtraescolaresPage() {
  const { showToast } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebouncedValue(busqueda);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [extraescolarEnEdicion, setExtraescolarEnEdicion] = useState<Extraescolar | null>(null);
  const [confirmacion, setConfirmacion] = useState<{
    idextraescolar: string;
    mensaje: string;
  } | null>(null);
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(extraescolarEnEdicion);

  const { data: resultado, isLoading } = useExtraescolares(busquedaDebounced, page, pageSize);
  const crear = useCreateExtraescolar();
  const actualizar = useUpdateExtraescolar();
  const borrar = useDeleteExtraescolar();

  function handleCrear(nombreextra: string) {
    crear.mutate(
      { nombreextra },
      {
        onSuccess: () => {
          showToast("success", "Actividad agregada correctamente.");
          cerrar();
        },
        onError: (error) => showToast("danger", getApiErrorMessage(error)),
      }
    );
  }

  function handleActualizar(nombreextra: string) {
    if (!extraescolarEnEdicion) return;
    actualizar.mutate(
      { idextraescolar: extraescolarEnEdicion.idextraescolar, input: { nombreextra } },
      {
        onSuccess: () => {
          showToast("success", "Actividad actualizada correctamente.");
          setExtraescolarEnEdicion(null);
        },
        onError: (error) => showToast("danger", getApiErrorMessage(error)),
      }
    );
  }

  function handleCancelar() {
    setExtraescolarEnEdicion(null);
    cerrar();
  }

  function handleBorrar(idextraescolar: string) {
    borrar.mutate(
      { idextraescolar, confirmar: false },
      {
        onSuccess: () => showToast("success", "Actividad borrada correctamente."),
        onError: (error) => {
          const impacto = getImpactoConfirmacion(error);
          if (impacto) {
            setConfirmacion({ idextraescolar, mensaje: impacto.mensaje });
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
      { idextraescolar: confirmacion.idextraescolar, confirmar: true },
      {
        onSuccess: () => {
          showToast("success", "Actividad borrada correctamente.");
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
      <h1 className="page-title">Actividades extraescolares</h1>

      <div ref={formRef}>
        {abierto ? (
          <ExtraescolarForm
            extraescolarEnEdicion={extraescolarEnEdicion}
            onCrear={handleCrear}
            onActualizar={handleActualizar}
            onCancelar={handleCancelar}
            enviando={crear.isPending || actualizar.isPending}
          />
        ) : (
          <button type="button" className="btn btn-brand mb-4" onClick={abrirCreacion}>
            + Agregar actividad
          </button>
        )}
      </div>

      <div className="mb-3">
        <div className="input-group" style={{ maxWidth: 420 }}>
          <input
            className="form-control"
            placeholder="Buscar por nombre o ID..."
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
          <ExtraescolaresTable
            extraescolares={resultado.data}
            idEnEdicion={extraescolarEnEdicion?.idextraescolar}
            onEditar={setExtraescolarEnEdicion}
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

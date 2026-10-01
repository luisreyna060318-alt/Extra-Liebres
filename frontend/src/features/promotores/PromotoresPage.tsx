import { useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage, getImpactoConfirmacion } from "../../lib/apiClient";
import { useToast } from "../../lib/ToastContext";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { PromotorForm } from "./components/PromotorForm";
import { PromotoresTable } from "./components/PromotoresTable";
import {
  useCreatePromotor,
  useDeletePromotor,
  usePromotores,
  useUpdatePromotor,
} from "./hooks";
import { CreatePromotorInput, Promotor } from "./types";

export function PromotoresPage() {
  const { showToast } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebouncedValue(busqueda);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [promotorEnEdicion, setPromotorEnEdicion] = useState<Promotor | null>(null);
  const [confirmacion, setConfirmacion] = useState<{ rfc: string; mensaje: string } | null>(null);
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(promotorEnEdicion);

  const { data: resultado, isLoading } = usePromotores(busquedaDebounced, page, pageSize);
  const crear = useCreatePromotor();
  const actualizar = useUpdatePromotor();
  const borrar = useDeletePromotor();

  function handleCrear(input: CreatePromotorInput) {
    crear.mutate(input, {
      onSuccess: () => {
        showToast("success", "Promotor agregado correctamente.");
        cerrar();
      },
      onError: (error) => showToast("danger", getApiErrorMessage(error)),
    });
  }

  function handleActualizar(input: CreatePromotorInput) {
    if (!promotorEnEdicion) return;
    actualizar.mutate(
      { rfc: promotorEnEdicion.rfc, input },
      {
        onSuccess: () => {
          showToast("success", "Promotor actualizado correctamente.");
          setPromotorEnEdicion(null);
        },
        onError: (error) => showToast("danger", getApiErrorMessage(error)),
      }
    );
  }

  function handleCancelar() {
    setPromotorEnEdicion(null);
    cerrar();
  }

  function handleBorrar(rfc: string) {
    borrar.mutate(
      { rfc, confirmar: false },
      {
        onSuccess: () => showToast("success", "Promotor borrado correctamente."),
        onError: (error) => {
          const impacto = getImpactoConfirmacion(error);
          if (impacto) {
            setConfirmacion({ rfc, mensaje: impacto.mensaje });
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
      { rfc: confirmacion.rfc, confirmar: true },
      {
        onSuccess: () => {
          showToast("success", "Promotor borrado correctamente.");
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
      <h1 className="page-title">Promotores</h1>

      <div ref={formRef}>
        {abierto ? (
          <PromotorForm
            promotorEnEdicion={promotorEnEdicion}
            onCrear={handleCrear}
            onActualizar={handleActualizar}
            onCancelar={handleCancelar}
            enviando={crear.isPending || actualizar.isPending}
          />
        ) : (
          <button type="button" className="btn btn-brand mb-4" onClick={abrirCreacion}>
            + Agregar promotor
          </button>
        )}
      </div>

      <div className="mb-3">
        <div className="input-group" style={{ maxWidth: 420 }}>
          <input
            className="form-control"
            placeholder="Buscar por RFC o nombre..."
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
          <PromotoresTable
            promotores={resultado.data}
            idEnEdicion={promotorEnEdicion?.rfc}
            onEditar={setPromotorEnEdicion}
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

import { useState } from "react";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage } from "../../lib/apiClient";
import { useToast } from "../../lib/ToastContext";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { CarreraForm } from "./components/CarreraForm";
import { CarrerasTable } from "./components/CarrerasTable";
import { useCarreras, useCreateCarrera, useDeleteCarrera, useUpdateCarrera } from "./hooks";
import { Carrera } from "./types";

export function CarrerasPage() {
  const { showToast } = useToast();
  const [busqueda, setBusqueda] = useState("");
  const busquedaDebounced = useDebouncedValue(busqueda);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [carreraEnEdicion, setCarreraEnEdicion] = useState<Carrera | null>(null);
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(carreraEnEdicion);

  const { data: resultado, isLoading } = useCarreras(busquedaDebounced, page, pageSize);
  const crear = useCreateCarrera();
  const actualizar = useUpdateCarrera();
  const borrar = useDeleteCarrera();

  function handleCrear(nombre: string) {
    crear.mutate(
      { nombre },
      {
        onSuccess: () => {
          showToast("success", "Carrera agregada correctamente.");
          cerrar();
        },
        onError: (error) => showToast("danger", getApiErrorMessage(error)),
      }
    );
  }

  function handleActualizar(nombre: string) {
    if (!carreraEnEdicion) return;
    actualizar.mutate(
      { idcarrera: carreraEnEdicion.idcarrera, input: { nombre } },
      {
        onSuccess: () => {
          showToast("success", "Carrera actualizada correctamente.");
          setCarreraEnEdicion(null);
        },
        onError: (error) => showToast("danger", getApiErrorMessage(error)),
      }
    );
  }

  function handleCancelar() {
    setCarreraEnEdicion(null);
    cerrar();
  }

  function handleBorrar(idcarrera: string) {
    borrar.mutate(idcarrera, {
      onSuccess: () => showToast("success", "Carrera borrada correctamente."),
      onError: (error) => showToast("danger", getApiErrorMessage(error)),
    });
  }

  return (
    <div>
      <h1 className="page-title">Carreras</h1>

      <div ref={formRef}>
        {abierto ? (
          <CarreraForm
            carreraEnEdicion={carreraEnEdicion}
            onCrear={handleCrear}
            onActualizar={handleActualizar}
            onCancelar={handleCancelar}
            enviando={crear.isPending || actualizar.isPending}
          />
        ) : (
          <button type="button" className="btn btn-brand mb-4" onClick={abrirCreacion}>
            + Agregar carrera
          </button>
        )}
      </div>

      <div className="mb-3">
        <div className="input-group" style={{ maxWidth: 420 }}>
          <input
            className="form-control"
            placeholder="Buscar por nombre..."
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
          <CarrerasTable
            carreras={resultado.data}
            idEnEdicion={carreraEnEdicion?.idcarrera}
            onEditar={setCarreraEnEdicion}
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
    </div>
  );
}

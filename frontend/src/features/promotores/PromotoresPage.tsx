import { useState } from "react";
import { BuscadorListado } from "../../components/ui/BuscadorListado";
import { EstadoConsulta } from "../../components/ui/EstadoConsulta";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage } from "../../lib/apiClient";
import { useBorradoConConfirmacion } from "../../lib/useBorradoConConfirmacion";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { useToast } from "../../lib/useToast";
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
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(promotorEnEdicion);

  const consulta = usePromotores(busquedaDebounced, page, pageSize);
  const resultado = consulta.data;
  const crear = useCreatePromotor();
  const actualizar = useUpdatePromotor();
  const borrar = useDeletePromotor();
  const borrado = useBorradoConConfirmacion({
    borrar: (rfc, confirmar) => borrar.mutateAsync({ rfc, confirmar }),
    mensajeExito: "Promotor borrado correctamente.",
  });

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
    const { nombre, appaterno, apmaterno } = input;
    actualizar.mutate(
      { rfc: promotorEnEdicion.rfc, input: { nombre, appaterno, apmaterno } },
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

      <BuscadorListado
        etiqueta="Buscar promotores por RFC o nombre"
        placeholder="Buscar por RFC o nombre..."
        valor={busqueda}
        onChange={(valor) => {
          setBusqueda(valor);
          setPage(1);
        }}
      />

      <EstadoConsulta
        cargando={consulta.isLoading || !resultado}
        error={consulta.error}
        onReintentar={() => void consulta.refetch()}
      >
        {resultado && (
          <>
            <PromotoresTable
              promotores={resultado.data}
              idEnEdicion={promotorEnEdicion?.rfc}
              onEditar={setPromotorEnEdicion}
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

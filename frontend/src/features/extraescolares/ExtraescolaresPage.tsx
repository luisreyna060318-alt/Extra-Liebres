import { useState } from "react";
import { BuscadorListado } from "../../components/ui/BuscadorListado";
import { EstadoConsulta } from "../../components/ui/EstadoConsulta";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage } from "../../lib/apiClient";
import { useBorradoConConfirmacion } from "../../lib/useBorradoConConfirmacion";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { useToast } from "../../lib/useToast";
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
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(extraescolarEnEdicion);

  const consulta = useExtraescolares(busquedaDebounced, page, pageSize);
  const resultado = consulta.data;
  const crear = useCreateExtraescolar();
  const actualizar = useUpdateExtraescolar();
  const borrar = useDeleteExtraescolar();
  const borrado = useBorradoConConfirmacion({
    borrar: (idextraescolar, confirmar) => borrar.mutateAsync({ idextraescolar, confirmar }),
    mensajeExito: "Actividad borrada correctamente.",
  });

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

      <BuscadorListado
        etiqueta="Buscar actividades por nombre o ID"
        placeholder="Buscar por nombre o ID..."
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
            <ExtraescolaresTable
              extraescolares={resultado.data}
              idEnEdicion={extraescolarEnEdicion?.idextraescolar}
              onEditar={setExtraescolarEnEdicion}
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

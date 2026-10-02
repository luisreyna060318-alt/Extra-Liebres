import { useState } from "react";
import { BuscadorListado } from "../../components/ui/BuscadorListado";
import { EstadoConsulta } from "../../components/ui/EstadoConsulta";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage } from "../../lib/apiClient";
import { useBorradoConConfirmacion } from "../../lib/useBorradoConConfirmacion";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { useToast } from "../../lib/useToast";
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

  const consulta = useCarreras(busquedaDebounced, page, pageSize);
  const resultado = consulta.data;
  const crear = useCreateCarrera();
  const actualizar = useUpdateCarrera();
  const borrar = useDeleteCarrera();
  // Una carrera con alumnos nunca se borra (la API responde 409 sin opcion de
  // confirmar): en ese caso el hook solo muestra el mensaje de la API.
  const borrado = useBorradoConConfirmacion({
    borrar: (idcarrera, confirmar) => borrar.mutateAsync({ idcarrera, confirmar }),
    mensajeExito: "Carrera borrada correctamente.",
  });

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

      <BuscadorListado
        etiqueta="Buscar carreras por nombre"
        placeholder="Buscar por nombre..."
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
            <CarrerasTable
              carreras={resultado.data}
              idEnEdicion={carreraEnEdicion?.idcarrera}
              onEditar={setCarreraEnEdicion}
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

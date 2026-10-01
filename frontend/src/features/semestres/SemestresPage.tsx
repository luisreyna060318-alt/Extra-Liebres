import { useState } from "react";
import { BuscadorListado } from "../../components/ui/BuscadorListado";
import { EstadoConsulta } from "../../components/ui/EstadoConsulta";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage } from "../../lib/apiClient";
import { useBorradoConConfirmacion } from "../../lib/useBorradoConConfirmacion";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { useToast } from "../../lib/useToast";
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
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(null);

  const consulta = useSemestres(busquedaDebounced, page, pageSize);
  const resultado = consulta.data;
  const crear = useCreateSemestre();
  const borrar = useDeleteSemestre();
  const borrado = useBorradoConConfirmacion({
    borrar: (idsemestre, confirmar) => borrar.mutateAsync({ idsemestre, confirmar }),
    mensajeExito: "Semestre borrado correctamente.",
  });

  function handleCrear(input: CreateSemestreInput) {
    crear.mutate(input, {
      onSuccess: () => {
        showToast("success", "Semestre agregado correctamente.");
        cerrar();
      },
      onError: (error) => showToast("danger", getApiErrorMessage(error)),
    });
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

      <BuscadorListado
        etiqueta="Buscar semestres por anio"
        placeholder="Buscar por anio (2025)..."
        maxLength={4}
        soloDigitos
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
            <SemestresTable semestres={resultado.data} onBorrar={borrado.solicitarBorrado} />
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

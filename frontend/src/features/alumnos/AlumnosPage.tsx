import { useState } from "react";
import { EstadoConsulta } from "../../components/ui/EstadoConsulta";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage } from "../../lib/apiClient";
import { useBorradoConConfirmacion } from "../../lib/useBorradoConConfirmacion";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { useToast } from "../../lib/useToast";
import { AlumnoForm } from "./components/AlumnoForm";
import { AlumnosFiltrosForm } from "./components/AlumnosFiltros";
import { AlumnosTable } from "./components/AlumnosTable";
import { getExportAlumnosUrl } from "./api";
import { useAlumnos, useCreateAlumno, useDeleteAlumno, useUpdateAlumno } from "./hooks";
import { Alumno, CreateAlumnoInput, FiltrosAlumnos, UpdateAlumnoInput } from "./types";

export function AlumnosPage() {
  const { showToast } = useToast();
  const [filtros, setFiltros] = useState<FiltrosAlumnos>({});
  const filtrosDebounced = useDebouncedValue(filtros);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [alumnoEnEdicion, setAlumnoEnEdicion] = useState<Alumno | null>(null);
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(alumnoEnEdicion);

  const consulta = useAlumnos(filtrosDebounced, page, pageSize);
  const resultado = consulta.data;
  const crear = useCreateAlumno();
  const actualizar = useUpdateAlumno();
  const borrar = useDeleteAlumno();
  const borrado = useBorradoConConfirmacion({
    borrar: (nocontrol, confirmar) => borrar.mutateAsync({ nocontrol, confirmar }),
    mensajeExito: "Alumno borrado correctamente.",
  });

  function handleCrear(input: CreateAlumnoInput) {
    crear.mutate(input, {
      onSuccess: () => {
        showToast("success", "Alumno agregado correctamente.");
        cerrar();
      },
      onError: (error) => showToast("danger", getApiErrorMessage(error)),
    });
  }

  function handleActualizar(input: UpdateAlumnoInput) {
    if (!alumnoEnEdicion) return;
    actualizar.mutate(
      { nocontrol: alumnoEnEdicion.nocontrol, input },
      {
        onSuccess: () => {
          showToast("success", "Alumno actualizado correctamente.");
          setAlumnoEnEdicion(null);
        },
        onError: (error) => showToast("danger", getApiErrorMessage(error)),
      }
    );
  }

  function handleCancelar() {
    setAlumnoEnEdicion(null);
    cerrar();
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
        <h1 className="page-title flex-grow-1">Alumnos</h1>
        <a
          className="btn btn-outline-secondary mb-3"
          href={getExportAlumnosUrl(filtrosDebounced)}
          download
        >
          Exportar CSV
        </a>
      </div>

      <div ref={formRef}>
        {abierto ? (
          <AlumnoForm
            alumnoEnEdicion={alumnoEnEdicion}
            onCrear={handleCrear}
            onActualizar={handleActualizar}
            onCancelar={handleCancelar}
            enviando={crear.isPending || actualizar.isPending}
          />
        ) : (
          <button type="button" className="btn btn-brand mb-4" onClick={abrirCreacion}>
            + Agregar alumno
          </button>
        )}
      </div>

      <AlumnosFiltrosForm
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
            <AlumnosTable
              alumnos={resultado.data}
              idEnEdicion={alumnoEnEdicion?.nocontrol}
              onEditar={setAlumnoEnEdicion}
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

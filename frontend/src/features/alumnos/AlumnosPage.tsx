import { useState } from "react";
import { ConfirmDialog } from "../../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { Pagination } from "../../components/ui/Pagination";
import { getApiErrorMessage, getImpactoConfirmacion } from "../../lib/apiClient";
import { useToast } from "../../lib/ToastContext";
import { useDebouncedValue } from "../../lib/useDebouncedValue";
import { useFormularioColapsable } from "../../lib/useFormularioColapsable";
import { AlumnoForm } from "./components/AlumnoForm";
import { AlumnosFiltrosForm } from "./components/AlumnosFiltros";
import { AlumnosTable } from "./components/AlumnosTable";
import { getExportAlumnosUrl } from "./api";
import { useAlumnos, useCreateAlumno, useDeleteAlumno, useUpdateAlumno } from "./hooks";
import { Alumno, CreateAlumnoInput, FiltrosAlumnos } from "./types";

export function AlumnosPage() {
  const { showToast } = useToast();
  const [filtros, setFiltros] = useState<FiltrosAlumnos>({});
  const filtrosDebounced = useDebouncedValue(filtros);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [alumnoEnEdicion, setAlumnoEnEdicion] = useState<Alumno | null>(null);
  const [confirmacion, setConfirmacion] = useState<{ nocontrol: string; mensaje: string } | null>(
    null
  );
  const { abierto, formRef, abrirCreacion, cerrar } = useFormularioColapsable(alumnoEnEdicion);

  const { data: resultado, isLoading } = useAlumnos(filtrosDebounced, page, pageSize);
  const crear = useCreateAlumno();
  const actualizar = useUpdateAlumno();
  const borrar = useDeleteAlumno();

  function handleCrear(input: CreateAlumnoInput) {
    crear.mutate(input, {
      onSuccess: () => {
        showToast("success", "Alumno agregado correctamente.");
        cerrar();
      },
      onError: (error) => showToast("danger", getApiErrorMessage(error)),
    });
  }

  function handleActualizar(input: CreateAlumnoInput) {
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

  function handleBorrar(nocontrol: string) {
    borrar.mutate(
      { nocontrol, confirmar: false },
      {
        onSuccess: () => showToast("success", "Alumno borrado correctamente."),
        onError: (error) => {
          const impacto = getImpactoConfirmacion(error);
          if (impacto) {
            setConfirmacion({ nocontrol, mensaje: impacto.mensaje });
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
      { nocontrol: confirmacion.nocontrol, confirmar: true },
      {
        onSuccess: () => {
          showToast("success", "Alumno borrado correctamente.");
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

      {isLoading || !resultado ? (
        <LoadingSpinner />
      ) : (
        <>
          <AlumnosTable
            alumnos={resultado.data}
            idEnEdicion={alumnoEnEdicion?.nocontrol}
            onEditar={setAlumnoEnEdicion}
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

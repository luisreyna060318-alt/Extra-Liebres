import { useId, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { EstadoConsulta } from "../../components/ui/EstadoConsulta";
import { getApiErrorMessage } from "../../lib/apiClient";
import { useToast } from "../../lib/useToast";
import { useGrupo } from "../grupos/hooks";
import { BuscadorAlumnos } from "./components/BuscadorAlumnos";
import { CarritoInscripcion, ItemCarrito } from "./components/CarritoInscripcion";
import { GrupoSelector } from "./components/GrupoSelector";
import { RosterActual } from "./components/RosterActual";
import { useEnrollAlumnos, useRoster, useUnenrollAlumnos } from "./hooks";
import { ResultadoOperacion } from "./types";

function contar(resultados: ResultadoOperacion[], estado: ResultadoOperacion["estado"]): number {
  return resultados.filter((r) => r.estado === estado).length;
}

export function AlumnosGrupoPage() {
  const { showToast } = useToast();
  const idSelector = useId();
  const [searchParams, setSearchParams] = useSearchParams();
  const [idgrupo, setIdgrupoState] = useState<string | null>(searchParams.get("idgrupo"));
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

  const grupo = useGrupo(idgrupo ?? undefined);
  const roster = useRoster(idgrupo ?? undefined);
  const inscribir = useEnrollAlumnos(idgrupo ?? undefined);
  const retirar = useUnenrollAlumnos(idgrupo ?? undefined);
  const grupoSeleccionado = grupo.data;

  function setIdgrupo(nuevo: string | null) {
    setIdgrupoState(nuevo);
    setCarrito([]);
    setSearchParams(nuevo ? { idgrupo: nuevo } : {}, { replace: true });
  }

  const idsYaInscritos = roster.data?.alumnos.map((a) => a.nocontrol) ?? [];
  const idsEnCarrito = carrito.map((c) => c.nocontrol);

  function handleAgregarACarrito(nocontrol: string, nombreCompleto: string) {
    setCarrito((prev) => [...prev, { nocontrol, nombreCompleto, calificacion: null }]);
  }

  function handleCambiarCalificacion(nocontrol: string, calificacion: number) {
    setCarrito((prev) =>
      prev.map((item) => (item.nocontrol === nocontrol ? { ...item, calificacion } : item))
    );
  }

  function handleQuitarDeCarrito(nocontrol: string) {
    setCarrito((prev) => prev.filter((item) => item.nocontrol !== nocontrol));
  }

  function handleInscribir() {
    if (!idgrupo || carrito.length === 0) return;
    if (carrito.some((item) => item.calificacion === null)) {
      showToast("danger", "Asigna una calificacion a todos los alumnos antes de inscribir.");
      return;
    }
    const alumnos = carrito.map(({ nocontrol, calificacion }) => ({
      nocontrol,
      calificacion: calificacion as number,
    }));
    inscribir.mutate(
      { alumnos },
      {
        onSuccess: (resultados) => {
          const agregados = contar(resultados, "agregado");
          const duplicados = contar(resultados, "ya_inscrito");
          const inexistentes = contar(resultados, "no_existe");
          showToast(
            "success",
            `${agregados} alumno(s) inscrito(s).` +
              (duplicados ? ` ${duplicados} ya estaban inscritos.` : "") +
              (inexistentes ? ` ${inexistentes} ya no existen en el sistema.` : "")
          );
          setCarrito([]);
        },
        onError: (error) => showToast("danger", getApiErrorMessage(error)),
      }
    );
  }

  function handleRetirar(nocontrol: string) {
    if (!idgrupo) return;
    retirar.mutate(
      { nocontrol: [nocontrol] },
      {
        onSuccess: (resultados) =>
          contar(resultados, "eliminado") > 0
            ? showToast("success", "Alumno retirado del grupo.")
            : showToast("danger", "El alumno ya no estaba inscrito en este grupo."),
        onError: (error) => showToast("danger", getApiErrorMessage(error)),
      }
    );
  }

  return (
    <div>
      <h1 className="page-title">Gestionar alumnos en grupo</h1>

      <div className="mb-4" style={{ maxWidth: 480 }}>
        <label className="form-label" htmlFor={idSelector}>
          Grupo
        </label>
        <GrupoSelector
          inputId={idSelector}
          value={
            grupoSeleccionado
              ? {
                  value: grupoSeleccionado.idgrupo,
                  label: `${grupoSeleccionado.extraescolar.nombreextra} - ${grupoSeleccionado.promotor.nombre} ${grupoSeleccionado.promotor.appaterno} (${grupoSeleccionado.idgrupo})`,
                }
              : null
          }
          onSeleccionar={setIdgrupo}
        />
      </div>

      {!idgrupo && <p className="text-muted">Selecciona un grupo para gestionar sus inscripciones.</p>}

      {idgrupo && grupo.error ? (
        <div className="alert alert-warning" role="alert">
          No se pudo abrir el grupo "{idgrupo}": {getApiErrorMessage(grupo.error)}
        </div>
      ) : (
        idgrupo && (
          <div className="row g-4">
            <div className="col-lg-6">
              <BuscadorAlumnos
                idsExcluidos={[...idsYaInscritos, ...idsEnCarrito]}
                onAgregar={handleAgregarACarrito}
              />
              <hr />
              <h2 className="h6 label-subrayado">Por inscribir</h2>
              <CarritoInscripcion
                items={carrito}
                onCambiarCalificacion={handleCambiarCalificacion}
                onQuitar={handleQuitarDeCarrito}
                onInscribir={handleInscribir}
                enviando={inscribir.isPending}
              />
            </div>
            <div className="col-lg-6">
              <h2 className="h6 label-subrayado">Roster actual</h2>
              <EstadoConsulta
                cargando={roster.isLoading || !roster.data}
                error={roster.error}
                onReintentar={() => void roster.refetch()}
              >
                {roster.data && (
                  <RosterActual
                    roster={roster.data}
                    onRetirar={handleRetirar}
                    retirando={retirar.isPending}
                  />
                )}
              </EstadoConsulta>
            </div>
          </div>
        )
      )}
    </div>
  );
}

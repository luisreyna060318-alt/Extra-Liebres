import { FormEvent, useEffect, useId, useState } from "react";
import AsyncSelect from "react-select/async";
import { fetchExtraescolares } from "../../extraescolares/api";
import { fetchPromotores } from "../../promotores/api";
import { fetchSemestres } from "../../semestres/api";
import { DIAS_SEMANA, generarOpcionesHora } from "../horas";
import { CreateGrupoInput, DiaSemana, Grupo, UpdateGrupoInput } from "../types";

interface Opcion {
  value: string;
  label: string;
}

const HORAS = generarOpcionesHora();

/** "" = sin valor (se envia como null al editar para que la API lo borre). */
interface EstadoFormulario {
  idextraescolar: string;
  rfcpromotor: string;
  idsemestre: string;
  primerdia: DiaSemana | "";
  segundodia: DiaSemana | "";
  horainicio: string;
  horatermino: string;
  aula: string;
}

const ESTADO_INICIAL: EstadoFormulario = {
  idextraescolar: "",
  rfcpromotor: "",
  idsemestre: "",
  primerdia: "",
  segundodia: "",
  horainicio: "",
  horatermino: "",
  aula: "",
};

function posterior(dia: DiaSemana | "", referencia: DiaSemana | ""): boolean {
  return Boolean(dia && referencia) && DIAS_SEMANA.indexOf(dia as DiaSemana) > DIAS_SEMANA.indexOf(referencia as DiaSemana);
}

interface GrupoFormProps {
  grupoEnEdicion: Grupo | null;
  onCrear: (input: CreateGrupoInput) => void;
  onActualizar: (input: UpdateGrupoInput) => void;
  onCancelar: () => void;
  enviando: boolean;
}

export function GrupoForm({
  grupoEnEdicion,
  onCrear,
  onActualizar,
  onCancelar,
  enviando,
}: GrupoFormProps) {
  const id = useId();
  const [form, setForm] = useState<EstadoFormulario>(ESTADO_INICIAL);
  const editando = Boolean(grupoEnEdicion);

  useEffect(() => {
    if (grupoEnEdicion) {
      setForm({
        idextraescolar: grupoEnEdicion.idextraescolar,
        rfcpromotor: grupoEnEdicion.rfcpromotor,
        idsemestre: grupoEnEdicion.idsemestre ?? "",
        primerdia: grupoEnEdicion.primerdia ?? "",
        segundodia: grupoEnEdicion.segundodia ?? "",
        horainicio: grupoEnEdicion.horainicio ?? "",
        horatermino: grupoEnEdicion.horatermino ?? "",
        aula: grupoEnEdicion.aula ?? "",
      });
    } else {
      setForm(ESTADO_INICIAL);
    }
  }, [grupoEnEdicion]);

  async function cargarExtraescolares(term: string): Promise<Opcion[]> {
    const resultado = await fetchExtraescolares(term, 1, 20);
    return resultado.data.map((e) => ({
      value: e.idextraescolar,
      label: `${e.idextraescolar} - ${e.nombreextra}`,
    }));
  }

  async function cargarPromotores(term: string): Promise<Opcion[]> {
    const resultado = await fetchPromotores(term, 1, 20);
    return resultado.data.map((p) => ({
      value: p.rfc,
      label: `${p.rfc} - ${p.nombre} ${p.appaterno} ${p.apmaterno}`,
    }));
  }

  async function cargarSemestres(term: string): Promise<Opcion[]> {
    const resultado = await fetchSemestres(term, 1, 20);
    return resultado.data.map((s) => ({
      value: s.idsemestre,
      label: `${s.idsemestre} (${s.mesinicio}-${s.mestermino} ${s.anio})`,
    }));
  }

  // Al cambiar el primer dia o la hora de inicio se limpian el segundo dia y
  // la hora de termino si dejan de ser validos (antes quedaban ocultos en el
  // estado y la API rechazaba el formulario sin explicar por que).
  function cambiarPrimerDia(primerdia: DiaSemana | "") {
    setForm((actual) => ({
      ...actual,
      primerdia,
      segundodia: posterior(actual.segundodia, primerdia) ? actual.segundodia : "",
    }));
  }

  function cambiarHoraInicio(horainicio: string) {
    setForm((actual) => ({
      ...actual,
      horainicio,
      horatermino: !horainicio || actual.horatermino > horainicio ? actual.horatermino : "",
    }));
  }

  const faltaRelacion = !editando && (!form.idextraescolar || !form.rfcpromotor || !form.idsemestre);
  const horarioIncompleto = Boolean(form.horainicio) !== Boolean(form.horatermino);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (faltaRelacion || horarioIncompleto) return;
    const horario = {
      primerdia: form.primerdia || null,
      segundodia: form.segundodia || null,
      horainicio: form.horainicio || null,
      horatermino: form.horatermino || null,
      aula: form.aula.trim() || null,
    };
    if (editando) {
      onActualizar(horario);
    } else {
      onCrear({
        idextraescolar: form.idextraescolar,
        rfcpromotor: form.rfcpromotor,
        idsemestre: form.idsemestre,
        ...horario,
      });
    }
  }

  return (
    <form className="card card-body mb-4" onSubmit={handleSubmit}>
      <h2 className="h5 label-subrayado">{editando ? "Editar grupo" : "Registrar grupo"}</h2>
      {editando && (
        <p className="form-text mt-0">
          Actividad, promotor y semestre no se pueden cambiar: forman parte del identificador del
          grupo. Para reasignarlos, borra este grupo y registra uno nuevo.
        </p>
      )}

      <div className="row g-3">
        <div className="col-md-4">
          <label className="form-label" htmlFor={`${id}-actividad`}>
            Actividad extraescolar
          </label>
          {editando ? (
            <input
              id={`${id}-actividad`}
              className="form-control"
              disabled
              readOnly
              value={grupoEnEdicion?.extraescolar.nombreextra}
            />
          ) : (
            <AsyncSelect<Opcion>
              inputId={`${id}-actividad`}
              cacheOptions
              defaultOptions
              loadOptions={cargarExtraescolares}
              placeholder="Buscar actividad..."
              noOptionsMessage={() => "Sin resultados."}
              loadingMessage={() => "Buscando..."}
              onChange={(opcion) => setForm({ ...form, idextraescolar: opcion?.value ?? "" })}
            />
          )}
        </div>
        <div className="col-md-4">
          <label className="form-label" htmlFor={`${id}-promotor`}>
            Promotor
          </label>
          {editando ? (
            <input
              id={`${id}-promotor`}
              className="form-control"
              disabled
              readOnly
              value={`${grupoEnEdicion?.promotor.nombre} ${grupoEnEdicion?.promotor.appaterno}`}
            />
          ) : (
            <AsyncSelect<Opcion>
              inputId={`${id}-promotor`}
              cacheOptions
              defaultOptions
              loadOptions={cargarPromotores}
              placeholder="Buscar promotor..."
              noOptionsMessage={() => "Sin resultados."}
              loadingMessage={() => "Buscando..."}
              onChange={(opcion) => setForm({ ...form, rfcpromotor: opcion?.value ?? "" })}
            />
          )}
        </div>
        <div className="col-md-4">
          <label className="form-label" htmlFor={`${id}-semestre`}>
            Semestre
          </label>
          {editando ? (
            <input
              id={`${id}-semestre`}
              className="form-control"
              disabled
              readOnly
              value={grupoEnEdicion?.idsemestre ?? "Sin asignar"}
            />
          ) : (
            <AsyncSelect<Opcion>
              inputId={`${id}-semestre`}
              cacheOptions
              defaultOptions
              loadOptions={cargarSemestres}
              placeholder="Buscar semestre..."
              noOptionsMessage={() => "Sin resultados."}
              loadingMessage={() => "Buscando..."}
              onChange={(opcion) => setForm({ ...form, idsemestre: opcion?.value ?? "" })}
            />
          )}
        </div>

        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-primerdia`}>
            Primer dia
          </label>
          <select
            id={`${id}-primerdia`}
            className="form-select"
            value={form.primerdia}
            onChange={(e) => cambiarPrimerDia(e.target.value as DiaSemana | "")}
          >
            <option value="">-- Ninguno --</option>
            {DIAS_SEMANA.map((dia) => (
              <option key={dia} value={dia}>
                {dia}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-segundodia`}>
            Segundo dia
          </label>
          <select
            id={`${id}-segundodia`}
            className="form-select"
            disabled={!form.primerdia}
            value={form.segundodia}
            onChange={(e) => setForm({ ...form, segundodia: e.target.value as DiaSemana | "" })}
          >
            <option value="">-- Ninguno --</option>
            {DIAS_SEMANA.filter((dia) => posterior(dia, form.primerdia)).map((dia) => (
              <option key={dia} value={dia}>
                {dia}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-horainicio`}>
            Hora inicio
          </label>
          <select
            id={`${id}-horainicio`}
            className="form-select"
            value={form.horainicio}
            onChange={(e) => cambiarHoraInicio(e.target.value)}
          >
            <option value="">-- Ninguna --</option>
            {HORAS.map((hora) => (
              <option key={hora} value={hora}>
                {hora}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-horatermino`}>
            Hora termino
          </label>
          <select
            id={`${id}-horatermino`}
            className={`form-select${horarioIncompleto ? " is-invalid" : ""}`}
            value={form.horatermino}
            onChange={(e) => setForm({ ...form, horatermino: e.target.value })}
            aria-describedby={horarioIncompleto ? `${id}-horario-error` : undefined}
          >
            <option value="">-- Ninguna --</option>
            {HORAS.filter((hora) => !form.horainicio || hora > form.horainicio).map((hora) => (
              <option key={hora} value={hora}>
                {hora}
              </option>
            ))}
          </select>
          {horarioIncompleto && (
            <div className="invalid-feedback" id={`${id}-horario-error`}>
              Captura la hora de inicio y la de termino, o ninguna.
            </div>
          )}
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor={`${id}-aula`}>
            Aula
          </label>
          <input
            id={`${id}-aula`}
            className="form-control"
            maxLength={50}
            value={form.aula}
            onChange={(e) => setForm({ ...form, aula: e.target.value })}
          />
        </div>
      </div>

      {faltaRelacion && (
        <p className="form-text mb-0 mt-2">
          Selecciona la actividad, el promotor y el semestre para continuar.
        </p>
      )}

      <div className="btn-group-actions mt-3">
        <button
          type="submit"
          className="btn btn-brand"
          disabled={enviando || faltaRelacion || horarioIncompleto}
        >
          {editando ? "Guardar cambios" : "Agregar"}
        </button>
        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

import { FormEvent, useEffect, useState } from "react";
import AsyncSelect from "react-select/async";
import { fetchExtraescolares } from "../../extraescolares/api";
import { fetchPromotores } from "../../promotores/api";
import { fetchSemestres } from "../../semestres/api";
import { DIAS_SEMANA, generarOpcionesHora } from "../horas";
import { CreateGrupoInput, DiaSemana, Grupo } from "../types";

interface Opcion {
  value: string;
  label: string;
}

const HORAS = generarOpcionesHora();

const ESTADO_INICIAL: CreateGrupoInput = {
  idextraescolar: "",
  rfcpromotor: "",
  idsemestre: "",
  primerdia: undefined,
  segundodia: undefined,
  horainicio: undefined,
  horatermino: undefined,
  aula: "",
};

interface GrupoFormProps {
  grupoEnEdicion: Grupo | null;
  onCrear: (input: CreateGrupoInput) => void;
  onActualizar: (input: CreateGrupoInput) => void;
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
  const [form, setForm] = useState<CreateGrupoInput>(ESTADO_INICIAL);
  const editando = Boolean(grupoEnEdicion);

  useEffect(() => {
    if (grupoEnEdicion) {
      setForm({
        idextraescolar: grupoEnEdicion.idextraescolar,
        rfcpromotor: grupoEnEdicion.rfcpromotor,
        idsemestre: grupoEnEdicion.idsemestre ?? "",
        primerdia: grupoEnEdicion.primerdia ?? undefined,
        segundodia: grupoEnEdicion.segundodia ?? undefined,
        horainicio: grupoEnEdicion.horainicio ?? undefined,
        horatermino: grupoEnEdicion.horatermino ?? undefined,
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

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload: CreateGrupoInput = {
      ...form,
      primerdia: form.primerdia || undefined,
      segundodia: form.segundodia || undefined,
      horainicio: form.horainicio || undefined,
      horatermino: form.horatermino || undefined,
      aula: form.aula || undefined,
    };
    if (editando) {
      onActualizar(payload);
    } else {
      onCrear(payload);
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
          <label className="form-label">Actividad extraescolar</label>
          {editando ? (
            <input
              className="form-control"
              disabled
              readOnly
              value={grupoEnEdicion?.extraescolar.nombreextra}
            />
          ) : (
            <AsyncSelect<Opcion>
              cacheOptions
              defaultOptions
              loadOptions={cargarExtraescolares}
              placeholder="Buscar actividad..."
              onChange={(opcion) => setForm({ ...form, idextraescolar: opcion?.value ?? "" })}
            />
          )}
        </div>
        <div className="col-md-4">
          <label className="form-label">Promotor</label>
          {editando ? (
            <input
              className="form-control"
              disabled
              readOnly
              value={`${grupoEnEdicion?.promotor.nombre} ${grupoEnEdicion?.promotor.appaterno}`}
            />
          ) : (
            <AsyncSelect<Opcion>
              cacheOptions
              defaultOptions
              loadOptions={cargarPromotores}
              placeholder="Buscar promotor..."
              onChange={(opcion) => setForm({ ...form, rfcpromotor: opcion?.value ?? "" })}
            />
          )}
        </div>
        <div className="col-md-4">
          <label className="form-label">Semestre</label>
          {editando ? (
            <input
              className="form-control"
              disabled
              readOnly
              value={grupoEnEdicion?.idsemestre ?? ""}
            />
          ) : (
            <AsyncSelect<Opcion>
              cacheOptions
              defaultOptions
              loadOptions={cargarSemestres}
              placeholder="Buscar semestre..."
              onChange={(opcion) => setForm({ ...form, idsemestre: opcion?.value ?? "" })}
            />
          )}
        </div>

        <div className="col-md-3">
          <label className="form-label">Primer dia</label>
          <select
            className="form-select"
            value={form.primerdia ?? ""}
            onChange={(e) =>
              setForm({ ...form, primerdia: (e.target.value || undefined) as DiaSemana | undefined })
            }
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
          <label className="form-label">Segundo dia</label>
          <select
            className="form-select"
            disabled={!form.primerdia}
            value={form.segundodia ?? ""}
            onChange={(e) =>
              setForm({ ...form, segundodia: (e.target.value || undefined) as DiaSemana | undefined })
            }
          >
            <option value="">-- Ninguno --</option>
            {DIAS_SEMANA.filter(
              (dia) =>
                !form.primerdia || DIAS_SEMANA.indexOf(dia) > DIAS_SEMANA.indexOf(form.primerdia)
            ).map((dia) => (
              <option key={dia} value={dia}>
                {dia}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label">Hora inicio</label>
          <select
            className="form-select"
            value={form.horainicio ?? ""}
            onChange={(e) => setForm({ ...form, horainicio: e.target.value || undefined })}
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
          <label className="form-label">Hora termino</label>
          <select
            className="form-select"
            value={form.horatermino ?? ""}
            onChange={(e) => setForm({ ...form, horatermino: e.target.value || undefined })}
          >
            <option value="">-- Ninguna --</option>
            {HORAS.filter((hora) => !form.horainicio || hora > form.horainicio).map((hora) => (
              <option key={hora} value={hora}>
                {hora}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Aula</label>
          <input
            className="form-control"
            maxLength={50}
            value={form.aula ?? ""}
            onChange={(e) => setForm({ ...form, aula: e.target.value })}
          />
        </div>
      </div>

      <div className="btn-group-actions mt-3">
        <button type="submit" className="btn btn-brand" disabled={enviando}>
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

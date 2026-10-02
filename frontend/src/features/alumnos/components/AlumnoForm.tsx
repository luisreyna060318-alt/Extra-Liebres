import { FormEvent, useEffect, useId, useState } from "react";
import AsyncSelect from "react-select/async";
import { fetchCarreras } from "../../carreras/api";
import { Alumno, Campus, CreateAlumnoInput, Sexo, UpdateAlumnoInput } from "../types";

interface OpcionCarrera {
  value: string;
  label: string;
}

interface EstadoFormulario {
  nocontrol: string;
  nombre: string;
  appaterno: string;
  apmaterno: string;
  sexo: Sexo | "";
  idcarrera: string;
  campus: Campus;
}

const ESTADO_INICIAL: EstadoFormulario = {
  nocontrol: "",
  nombre: "",
  appaterno: "",
  apmaterno: "",
  sexo: "",
  idcarrera: "",
  campus: "CAMPUS_1",
};

interface AlumnoFormProps {
  alumnoEnEdicion: Alumno | null;
  onCrear: (input: CreateAlumnoInput) => void;
  onActualizar: (input: UpdateAlumnoInput) => void;
  onCancelar: () => void;
  enviando: boolean;
}

export function AlumnoForm({
  alumnoEnEdicion,
  onCrear,
  onActualizar,
  onCancelar,
  enviando,
}: AlumnoFormProps) {
  const id = useId();
  const [form, setForm] = useState<EstadoFormulario>(ESTADO_INICIAL);
  const [carreraSeleccionada, setCarreraSeleccionada] = useState<OpcionCarrera | null>(null);
  const editando = Boolean(alumnoEnEdicion);

  useEffect(() => {
    if (alumnoEnEdicion) {
      setForm({
        nocontrol: alumnoEnEdicion.nocontrol,
        nombre: alumnoEnEdicion.nombre,
        appaterno: alumnoEnEdicion.appaterno,
        apmaterno: alumnoEnEdicion.apmaterno ?? "",
        sexo: alumnoEnEdicion.sexo ?? "",
        idcarrera: alumnoEnEdicion.idcarrera,
        campus: alumnoEnEdicion.campus,
      });
      setCarreraSeleccionada({
        value: alumnoEnEdicion.carrera.idcarrera,
        label: alumnoEnEdicion.carrera.nombre,
      });
    } else {
      setForm(ESTADO_INICIAL);
      setCarreraSeleccionada(null);
    }
  }, [alumnoEnEdicion]);

  async function cargarCarreras(term: string): Promise<OpcionCarrera[]> {
    const resultado = await fetchCarreras(term, 1, 20);
    return resultado.data.map((c) => ({ value: c.idcarrera, label: c.nombre }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // Los campos opcionales vacios se envian como null para que la API los
    // borre (al editar, omitirlos dejaria el valor anterior).
    const comunes = {
      nombre: form.nombre,
      appaterno: form.appaterno,
      apmaterno: form.apmaterno.trim() || null,
      sexo: form.sexo || null,
      idcarrera: form.idcarrera,
      campus: form.campus,
    };
    if (editando) {
      onActualizar(comunes);
    } else {
      onCrear({ nocontrol: form.nocontrol, ...comunes });
    }
  }

  return (
    <form className="card card-body mb-4" onSubmit={handleSubmit}>
      <h2 className="h5 label-subrayado">{editando ? "Editar alumno" : "Registrar alumno"}</h2>
      <div className="row g-3">
        <div className="col-md-2">
          <label className="form-label" htmlFor={`${id}-nocontrol`}>
            No. control
          </label>
          <input
            id={`${id}-nocontrol`}
            className="form-control"
            required
            maxLength={11}
            pattern="\d+"
            inputMode="numeric"
            disabled={editando}
            value={form.nocontrol}
            onChange={(e) => setForm({ ...form, nocontrol: e.target.value.replace(/\D/g, "") })}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-nombre`}>
            Nombre
          </label>
          <input
            id={`${id}-nombre`}
            className="form-control"
            required
            maxLength={50}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-appaterno`}>
            Apellido paterno
          </label>
          <input
            id={`${id}-appaterno`}
            className="form-control"
            required
            maxLength={50}
            value={form.appaterno}
            onChange={(e) => setForm({ ...form, appaterno: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-apmaterno`}>
            Apellido materno
          </label>
          <input
            id={`${id}-apmaterno`}
            className="form-control"
            maxLength={50}
            value={form.apmaterno}
            onChange={(e) => setForm({ ...form, apmaterno: e.target.value })}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-sexo`}>
            Sexo
          </label>
          <select
            id={`${id}-sexo`}
            className="form-select"
            value={form.sexo}
            onChange={(e) => setForm({ ...form, sexo: e.target.value as Sexo | "" })}
          >
            <option value="">-- No especificado --</option>
            <option value="MASCULINO">MASCULINO</option>
            <option value="FEMENINO">FEMENINO</option>
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label" htmlFor={`${id}-carrera`}>
            Carrera
          </label>
          <AsyncSelect<OpcionCarrera>
            inputId={`${id}-carrera`}
            cacheOptions
            defaultOptions
            value={carreraSeleccionada}
            loadOptions={cargarCarreras}
            placeholder="Buscar carrera..."
            noOptionsMessage={() => "Sin resultados. Registra la carrera en el modulo Carreras."}
            loadingMessage={() => "Buscando..."}
            onChange={(opcion) => {
              setCarreraSeleccionada(opcion);
              setForm({ ...form, idcarrera: opcion?.value ?? "" });
            }}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-campus`}>
            Campus
          </label>
          <select
            id={`${id}-campus`}
            className="form-select"
            value={form.campus}
            onChange={(e) => setForm({ ...form, campus: e.target.value as Campus })}
          >
            <option value="CAMPUS_1">CAMPUS 1</option>
            <option value="CAMPUS_2">CAMPUS 2</option>
          </select>
        </div>
      </div>

      {!form.idcarrera && <p className="form-text mb-0 mt-2">Selecciona una carrera para continuar.</p>}

      <div className="btn-group-actions mt-3">
        <button type="submit" className="btn btn-brand" disabled={enviando || !form.idcarrera}>
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

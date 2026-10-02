import { FormEvent, useId, useState } from "react";
import { CreateSemestreInput, MesInicio, MesTermino } from "../types";

const PAR_MESES: Record<MesInicio, MesTermino> = {
  ENERO: "JUNIO",
  AGOSTO: "DICIEMBRE",
};

const ESTADO_INICIAL: CreateSemestreInput = {
  mesinicio: "ENERO",
  mestermino: "JUNIO",
  anio: "",
};

interface SemestreFormProps {
  onCrear: (input: CreateSemestreInput) => void;
  onCancelar: () => void;
  enviando: boolean;
}

export function SemestreForm({ onCrear, onCancelar, enviando }: SemestreFormProps) {
  const id = useId();
  const [form, setForm] = useState<CreateSemestreInput>(ESTADO_INICIAL);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // No se limpia aqui: si el alta falla, el usuario conserva lo capturado.
    // Si tiene exito, la pagina cierra (desmonta) el formulario.
    onCrear(form);
  }

  return (
    <form className="card card-body mb-4" onSubmit={handleSubmit}>
      <h2 className="h5 label-subrayado">Registrar semestre</h2>
      <div className="row g-3">
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-mesinicio`}>
            Mes de inicio
          </label>
          <select
            id={`${id}-mesinicio`}
            className="form-select"
            value={form.mesinicio}
            onChange={(e) => {
              const mesinicio = e.target.value as MesInicio;
              setForm({ ...form, mesinicio, mestermino: PAR_MESES[mesinicio] });
            }}
          >
            <option value="ENERO">ENERO</option>
            <option value="AGOSTO">AGOSTO</option>
          </select>
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-mestermino`}>
            Mes de termino
          </label>
          <input
            id={`${id}-mestermino`}
            className="form-control"
            disabled
            readOnly
            value={form.mestermino}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label" htmlFor={`${id}-anio`}>
            Anio
          </label>
          <input
            id={`${id}-anio`}
            className="form-control"
            required
            maxLength={4}
            pattern="\d{4}"
            inputMode="numeric"
            placeholder="2025"
            value={form.anio}
            onChange={(e) => setForm({ ...form, anio: e.target.value.replace(/\D/g, "") })}
          />
        </div>
      </div>

      <div className="btn-group-actions mt-3">
        <button type="submit" className="btn btn-brand" disabled={enviando}>
          Agregar
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

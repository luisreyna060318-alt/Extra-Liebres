import { FormEvent, useEffect, useState } from "react";
import { CreatePromotorInput, Promotor } from "../types";

const ESTADO_INICIAL: CreatePromotorInput = {
  rfc: "",
  nombre: "",
  appaterno: "",
  apmaterno: "",
};

interface PromotorFormProps {
  promotorEnEdicion: Promotor | null;
  onCrear: (input: CreatePromotorInput) => void;
  onActualizar: (input: CreatePromotorInput) => void;
  onCancelar: () => void;
  enviando: boolean;
}

export function PromotorForm({
  promotorEnEdicion,
  onCrear,
  onActualizar,
  onCancelar,
  enviando,
}: PromotorFormProps) {
  const [form, setForm] = useState<CreatePromotorInput>(ESTADO_INICIAL);
  const editando = Boolean(promotorEnEdicion);

  useEffect(() => {
    setForm(promotorEnEdicion ?? ESTADO_INICIAL);
  }, [promotorEnEdicion]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editando) {
      onActualizar(form);
    } else {
      onCrear(form);
    }
  }

  return (
    <form className="card card-body mb-4" onSubmit={handleSubmit}>
      <h2 className="h5 label-subrayado">{editando ? "Editar promotor" : "Registrar promotor"}</h2>
      <div className="row g-3">
        <div className="col-md-3">
          <label className="form-label">RFC</label>
          <input
            className="form-control text-uppercase"
            required
            maxLength={13}
            disabled={editando}
            value={form.rfc}
            onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Nombre</label>
          <input
            className="form-control"
            required
            maxLength={50}
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Apellido paterno</label>
          <input
            className="form-control"
            required
            maxLength={50}
            value={form.appaterno}
            onChange={(e) => setForm({ ...form, appaterno: e.target.value })}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Apellido materno</label>
          <input
            className="form-control"
            required
            maxLength={50}
            value={form.apmaterno}
            onChange={(e) => setForm({ ...form, apmaterno: e.target.value })}
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

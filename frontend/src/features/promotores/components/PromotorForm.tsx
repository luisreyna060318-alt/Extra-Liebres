import { FormEvent, useEffect, useId, useState } from "react";
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
  const id = useId();
  const [form, setForm] = useState<CreatePromotorInput>(ESTADO_INICIAL);
  const editando = Boolean(promotorEnEdicion);

  useEffect(() => {
    setForm(
      promotorEnEdicion
        ? {
            rfc: promotorEnEdicion.rfc,
            nombre: promotorEnEdicion.nombre,
            appaterno: promotorEnEdicion.appaterno,
            apmaterno: promotorEnEdicion.apmaterno,
          }
        : ESTADO_INICIAL
    );
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
          <label className="form-label" htmlFor={`${id}-rfc`}>
            RFC
          </label>
          <input
            id={`${id}-rfc`}
            className="form-control text-uppercase"
            required
            maxLength={13}
            disabled={editando}
            value={form.rfc}
            onChange={(e) => setForm({ ...form, rfc: e.target.value.toUpperCase() })}
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

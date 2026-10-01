import { FormEvent, useEffect, useState } from "react";
import { Carrera } from "../types";

interface CarreraFormProps {
  carreraEnEdicion: Carrera | null;
  onCrear: (nombre: string) => void;
  onActualizar: (nombre: string) => void;
  onCancelar: () => void;
  enviando: boolean;
}

export function CarreraForm({
  carreraEnEdicion,
  onCrear,
  onActualizar,
  onCancelar,
  enviando,
}: CarreraFormProps) {
  const [nombre, setNombre] = useState("");
  const editando = Boolean(carreraEnEdicion);

  useEffect(() => {
    setNombre(carreraEnEdicion?.nombre ?? "");
  }, [carreraEnEdicion]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editando) {
      onActualizar(nombre);
    } else {
      onCrear(nombre);
    }
  }

  return (
    <form className="card card-body mb-4" onSubmit={handleSubmit}>
      <h2 className="h5 label-subrayado">
        {editando ? `Editar carrera (${carreraEnEdicion?.idcarrera})` : "Registrar carrera"}
      </h2>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Nombre de la carrera</label>
          <input
            className="form-control"
            required
            maxLength={120}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
          />
          <div className="form-text">
            El identificador (p.ej. "1-II") se genera automaticamente.
          </div>
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

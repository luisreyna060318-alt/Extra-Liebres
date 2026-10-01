import { FormEvent, useEffect, useState } from "react";
import { Extraescolar } from "../types";

interface ExtraescolarFormProps {
  extraescolarEnEdicion: Extraescolar | null;
  onCrear: (nombreextra: string) => void;
  onActualizar: (nombreextra: string) => void;
  onCancelar: () => void;
  enviando: boolean;
}

export function ExtraescolarForm({
  extraescolarEnEdicion,
  onCrear,
  onActualizar,
  onCancelar,
  enviando,
}: ExtraescolarFormProps) {
  const [nombreextra, setNombreextra] = useState("");
  const editando = Boolean(extraescolarEnEdicion);

  useEffect(() => {
    setNombreextra(extraescolarEnEdicion?.nombreextra ?? "");
  }, [extraescolarEnEdicion]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (editando) {
      onActualizar(nombreextra);
    } else {
      onCrear(nombreextra);
    }
  }

  return (
    <form className="card card-body mb-4" onSubmit={handleSubmit}>
      <h2 className="h5 label-subrayado">
        {editando ? `Editar actividad (${extraescolarEnEdicion?.idextraescolar})` : "Registrar actividad extraescolar"}
      </h2>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Nombre de la actividad</label>
          <input
            className="form-control"
            required
            maxLength={120}
            value={nombreextra}
            onChange={(e) => setNombreextra(e.target.value)}
          />
          <div className="form-text">
            El identificador (p.ej. "12-FS") se genera automaticamente.
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

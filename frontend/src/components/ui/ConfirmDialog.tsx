import { useEffect } from "react";

interface ConfirmDialogProps {
  mensaje: string;
  titulo?: string;
  enviando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Modal de confirmacion para acciones con efectos secundarios (borrados en
 * cascada, desvinculaciones). A diferencia de ConfirmButton (window.confirm
 * generico), este muestra el mensaje especifico que devuelve la API con el
 * impacto real de la operacion (cuantos registros se veran afectados).
 */
export function ConfirmDialog({
  mensaje,
  titulo = "Confirmar accion",
  enviando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  useEffect(() => {
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape" && !enviando) {
        onCancelar();
      }
    }
    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  }, [enviando, onCancelar]);

  return (
    <>
      <div
        className="modal d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget && !enviando) onCancelar();
        }}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{titulo}</h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={onCancelar}
                disabled={enviando}
              />
            </div>
            <div className="modal-body">
              <p className="mb-0">{mensaje}</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={onCancelar}
                disabled={enviando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={onConfirmar}
                disabled={enviando}
              >
                Si, continuar
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop d-block" />
    </>
  );
}

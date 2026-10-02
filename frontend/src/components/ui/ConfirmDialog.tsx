import { useEffect, useId, useRef } from "react";

interface ConfirmDialogProps {
  mensaje: string;
  titulo?: string;
  enviando?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}

/**
 * Modal de confirmacion para acciones con efectos secundarios (borrados en
 * cascada, desvinculaciones). Muestra el mensaje especifico que devuelve la
 * API con el impacto real de la operacion.
 *
 * Accesibilidad: al abrirse enfoca "Cancelar" (la opcion segura), mantiene
 * el foco de Tab dentro del dialogo, cierra con Escape y al cerrarse devuelve
 * el foco al elemento que lo abrio.
 */
export function ConfirmDialog({
  mensaje,
  titulo = "Confirmar accion",
  enviando = false,
  onConfirmar,
  onCancelar,
}: ConfirmDialogProps) {
  const idTitulo = useId();
  const idMensaje = useId();
  const dialogoRef = useRef<HTMLDivElement>(null);
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    cancelarRef.current?.focus();
    return () => previo?.focus?.();
  }, []);

  useEffect(() => {
    function alPresionarTecla(e: KeyboardEvent) {
      if (e.key === "Escape" && !enviando) {
        onCancelar();
        return;
      }
      if (e.key !== "Tab" || !dialogoRef.current) return;
      const enfocables = Array.from(
        dialogoRef.current.querySelectorAll<HTMLElement>("button:not([disabled])")
      );
      if (enfocables.length === 0) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const dentro = dialogoRef.current.contains(document.activeElement);
      if (e.shiftKey && (document.activeElement === primero || !dentro)) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && (document.activeElement === ultimo || !dentro)) {
        e.preventDefault();
        primero.focus();
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
        aria-labelledby={idTitulo}
        aria-describedby={idMensaje}
        onClick={(e) => {
          if (e.target === e.currentTarget && !enviando) onCancelar();
        }}
      >
        <div className="modal-dialog" ref={dialogoRef}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h5" id={idTitulo}>
                {titulo}
              </h2>
              <button
                type="button"
                className="btn-close"
                aria-label="Cerrar"
                onClick={onCancelar}
                disabled={enviando}
              />
            </div>
            <div className="modal-body">
              <p className="mb-0" id={idMensaje}>
                {mensaje}
              </p>
            </div>
            <div className="modal-footer">
              <button
                ref={cancelarRef}
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
                {enviando ? "Procesando..." : "Si, continuar"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop d-block" />
    </>
  );
}

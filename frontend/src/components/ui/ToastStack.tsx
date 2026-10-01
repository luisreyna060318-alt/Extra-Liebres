import { useToast } from "../../lib/ToastContext";

/** Notificaciones flotantes (arriba a la derecha) que se autodesvanecen. */
export function ToastStack() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1080 }}
      aria-live="polite"
      aria-atomic="true"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast show align-items-center text-white bg-${toast.tipo} border-0 mb-2`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">{toast.mensaje}</div>
            <button
              type="button"
              className="btn-close btn-close-white me-2 m-auto"
              aria-label="Cerrar"
              onClick={() => dismissToast(toast.id)}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export function LoadingSpinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="d-flex align-items-center gap-2 text-muted py-3">
      <div className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

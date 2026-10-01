import { KeyboardEvent, useEffect, useState } from "react";

const TAMANOS_DISPONIBLES = [20, 50, 100];

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange, onPageSizeChange }: PaginationProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / pageSize));
  const [paginaInput, setPaginaInput] = useState(String(page));

  useEffect(() => {
    setPaginaInput(String(page));
  }, [page]);

  if (total === 0) return null;

  const desde = (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);

  function irAPagina() {
    const destino = Math.min(Math.max(1, Number(paginaInput) || 1), totalPaginas);
    onPageChange(destino);
    setPaginaInput(String(destino));
  }

  function alPresionarTecla(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      irAPagina();
    }
  }

  return (
    <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mt-3">
      <div className="d-flex align-items-center gap-2">
        <span className="text-muted small">
          Mostrando {desde}-{hasta} de {total}
        </span>
        {onPageSizeChange && (
          <select
            className="form-select form-select-sm"
            style={{ width: "auto" }}
            aria-label="Registros por pagina"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {TAMANOS_DISPONIBLES.map((tamano) => (
              <option key={tamano} value={tamano}>
                {tamano} por pagina
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="d-flex align-items-center gap-2 btn-group-actions">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <div className="d-flex align-items-center gap-1">
          <span className="small text-muted">Pagina</span>
          <input
            type="number"
            className="form-control form-control-sm"
            style={{ width: "4.5rem" }}
            min={1}
            max={totalPaginas}
            value={paginaInput}
            onChange={(e) => setPaginaInput(e.target.value)}
            onKeyDown={alPresionarTecla}
            onBlur={irAPagina}
            aria-label="Ir a la pagina"
          />
          <span className="small text-muted">de {totalPaginas}</span>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary"
          disabled={page >= totalPaginas}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}

interface BuscadorListadoProps {
  valor: string;
  onChange: (valor: string) => void;
  placeholder: string;
  etiqueta: string;
  maxLength?: number;
  soloDigitos?: boolean;
}

/** Caja de busqueda de los listados de catalogo, con boton para limpiarla. */
export function BuscadorListado({
  valor,
  onChange,
  placeholder,
  etiqueta,
  maxLength,
  soloDigitos = false,
}: BuscadorListadoProps) {
  return (
    <div className="mb-3">
      <div className="input-group" style={{ maxWidth: 420 }}>
        <input
          className="form-control"
          type="search"
          aria-label={etiqueta}
          placeholder={placeholder}
          maxLength={maxLength}
          inputMode={soloDigitos ? "numeric" : undefined}
          value={valor}
          onChange={(e) => onChange(soloDigitos ? e.target.value.replace(/\D/g, "") : e.target.value)}
        />
        {valor && (
          <button type="button" className="btn btn-outline-secondary" onClick={() => onChange("")}>
            Limpiar
          </button>
        )}
      </div>
    </div>
  );
}

import { useEffect, useRef, useState } from "react";

/**
 * Controla la visibilidad del formulario de alta/edicion de los modulos de
 * catalogo: colapsado por defecto, se abre solo cuando el usuario pide crear
 * uno nuevo o cuando entra en modo edicion, y hace scroll hacia el formulario
 * en ambos casos para que el cambio sea visible aunque la tabla este larga.
 */
export function useFormularioColapsable(entidadEnEdicion: unknown) {
  const [mostrarCreacion, setMostrarCreacion] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const abierto = mostrarCreacion || entidadEnEdicion !== null;

  useEffect(() => {
    if (abierto) {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Solo debe hacer scroll cuando la razon de apertura cambia, no en cada re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, entidadEnEdicion]);

  return {
    abierto,
    formRef,
    abrirCreacion: () => setMostrarCreacion(true),
    cerrar: () => setMostrarCreacion(false),
  };
}

import { useState } from "react";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { getApiErrorMessage, getImpactoConfirmacion } from "./apiClient";
import { useToast } from "./useToast";

interface Opciones {
  /** Ejecuta el borrado; con confirmar=true la API acepta los efectos secundarios. */
  borrar: (id: string, confirmar: boolean) => Promise<unknown>;
  mensajeExito: string;
}

/**
 * Flujo de borrado comun a todas las paginas: intenta borrar; si la API
 * responde 409 con el impacto (cascada/desvinculacion), muestra el modal con
 * ese mensaje y, al aceptar, repite con ?confirmar=true.
 */
export function useBorradoConConfirmacion({ borrar, mensajeExito }: Opciones) {
  const { showToast } = useToast();
  const [confirmacion, setConfirmacion] = useState<{ id: string; mensaje: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function ejecutar(id: string, confirmar: boolean) {
    setEnviando(true);
    try {
      await borrar(id, confirmar);
      showToast("success", mensajeExito);
      setConfirmacion(null);
    } catch (error) {
      const impacto = confirmar ? null : getImpactoConfirmacion(error);
      if (impacto) {
        setConfirmacion({ id, mensaje: impacto.mensaje });
      } else {
        showToast("danger", getApiErrorMessage(error));
        setConfirmacion(null);
      }
    } finally {
      setEnviando(false);
    }
  }

  const dialogo = confirmacion ? (
    <ConfirmDialog
      mensaje={confirmacion.mensaje}
      enviando={enviando}
      onConfirmar={() => void ejecutar(confirmacion.id, true)}
      onCancelar={() => setConfirmacion(null)}
    />
  ) : null;

  return { solicitarBorrado: (id: string) => void ejecutar(id, false), dialogo };
}

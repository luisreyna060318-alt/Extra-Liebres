import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it, vi } from "vitest";
import { renderConProveedores } from "../../test/renderConProveedores";
import { useBorradoConConfirmacion } from "../useBorradoConConfirmacion";

function error409ConImpacto() {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("409", "ERR_BAD_REQUEST", config, null, {
    status: 409,
    statusText: "Conflict",
    headers: {},
    config,
    data: { error: "Este grupo tiene 2 alumno(s) inscrito(s).", details: { requiereConfirmacion: true } },
  });
}

function Prueba({ borrar }: { borrar: (id: string, confirmar: boolean) => Promise<unknown> }) {
  const borrado = useBorradoConConfirmacion({ borrar, mensajeExito: "Grupo borrado." });
  return (
    <>
      <button onClick={() => borrado.solicitarBorrado("G-1")}>Borrar</button>
      {borrado.dialogo}
    </>
  );
}

describe("useBorradoConConfirmacion", () => {
  it("si la API pide confirmar, muestra el impacto y al aceptar repite con confirmar=true", async () => {
    const borrar = vi.fn().mockRejectedValueOnce(error409ConImpacto()).mockResolvedValueOnce(undefined);
    renderConProveedores(<Prueba borrar={borrar} />);

    await userEvent.click(screen.getByRole("button", { name: "Borrar" }));
    expect(await screen.findByText("Este grupo tiene 2 alumno(s) inscrito(s).")).toBeInTheDocument();
    expect(borrar).toHaveBeenLastCalledWith("G-1", false);

    await userEvent.click(screen.getByRole("button", { name: "Si, continuar" }));
    await waitFor(() => expect(borrar).toHaveBeenLastCalledWith("G-1", true));
    expect(await screen.findByText("Grupo borrado.")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("si no hay impacto borra directo y avisa", async () => {
    const borrar = vi.fn().mockResolvedValue(undefined);
    renderConProveedores(<Prueba borrar={borrar} />);
    await userEvent.click(screen.getByRole("button", { name: "Borrar" }));
    expect(await screen.findByText("Grupo borrado.")).toBeInTheDocument();
    expect(borrar).toHaveBeenCalledTimes(1);
  });
});

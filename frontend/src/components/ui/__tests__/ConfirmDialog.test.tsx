import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "../ConfirmDialog";

describe("ConfirmDialog", () => {
  it("enfoca 'Cancelar' al abrirse y se anuncia con su titulo y mensaje", () => {
    render(<ConfirmDialog mensaje="Se borraran 3 inscripciones." onConfirmar={() => {}} onCancelar={() => {}} />);
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();
    expect(screen.getByRole("dialog", { name: "Confirmar accion" })).toHaveAccessibleDescription(
      "Se borraran 3 inscripciones."
    );
  });

  it("mantiene el foco dentro del dialogo al tabular", async () => {
    render(<ConfirmDialog mensaje="x" onConfirmar={() => {}} onCancelar={() => {}} />);
    const dialogo = screen.getByRole("dialog");
    for (let i = 0; i < 5; i++) {
      await userEvent.tab();
      expect(dialogo).toContainElement(document.activeElement as HTMLElement);
    }
  });

  it("Escape cancela y 'Si, continuar' confirma", async () => {
    const onCancelar = vi.fn();
    const onConfirmar = vi.fn();
    render(<ConfirmDialog mensaje="x" onConfirmar={onConfirmar} onCancelar={onCancelar} />);
    await userEvent.keyboard("{Escape}");
    expect(onCancelar).toHaveBeenCalledTimes(1);
    await userEvent.click(screen.getByRole("button", { name: "Si, continuar" }));
    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Pagination } from "../Pagination";

describe("Pagination", () => {
  it("muestra el rango y el total de paginas", () => {
    render(<Pagination page={2} pageSize={20} total={45} onPageChange={() => {}} />);
    expect(screen.getByText("Mostrando 21-40 de 45")).toBeInTheDocument();
    expect(screen.getByText("de 3")).toBeInTheDocument();
  });

  it("regresa a la ultima pagina valida si la actual quedo fuera de rango", () => {
    const onPageChange = vi.fn();
    render(<Pagination page={2} pageSize={20} total={20} onPageChange={onPageChange} />);
    expect(onPageChange).toHaveBeenCalledWith(1);
    expect(screen.queryByText(/Mostrando 21-20/)).not.toBeInTheDocument();
  });

  it("permite saltar a una pagina escribiendola", async () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} pageSize={20} total={1804} onPageChange={onPageChange} />);
    const campo = screen.getByLabelText("Ir a la pagina");
    await userEvent.clear(campo);
    await userEvent.type(campo, "91{Enter}");
    expect(onPageChange).toHaveBeenCalledWith(91);
  });
});

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Alumno } from "../../types";
import { AlumnoForm } from "../AlumnoForm";

vi.mock("../../../carreras/api", () => ({
  fetchCarreras: vi.fn(async () => ({ data: [], total: 0, page: 1, pageSize: 20 })),
}));

const ALUMNO: Alumno = {
  nocontrol: "21110001",
  nombre: "Ana",
  appaterno: "Lopez",
  apmaterno: "Ruiz",
  sexo: "FEMENINO",
  idcarrera: "1-II",
  campus: "CAMPUS_1",
  carrera: { idcarrera: "1-II", nombre: "Ingenieria Industrial" },
};

describe("AlumnoForm", () => {
  it("al editar, quitar sexo y apellido materno envia null (no los omite)", async () => {
    const onActualizar = vi.fn();
    render(
      <AlumnoForm alumnoEnEdicion={ALUMNO} onCrear={vi.fn()} onActualizar={onActualizar} onCancelar={vi.fn()} enviando={false} />
    );
    await userEvent.selectOptions(screen.getByLabelText("Sexo"), "");
    await userEvent.clear(screen.getByLabelText("Apellido materno"));
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onActualizar).toHaveBeenCalledWith({
      nombre: "Ana",
      appaterno: "Lopez",
      apmaterno: null,
      sexo: null,
      idcarrera: "1-II",
      campus: "CAMPUS_1",
    });
  });

  it("todas las etiquetas estan asociadas a su campo", () => {
    render(
      <AlumnoForm alumnoEnEdicion={null} onCrear={vi.fn()} onActualizar={vi.fn()} onCancelar={vi.fn()} enviando={false} />
    );
    for (const etiqueta of ["No. control", "Nombre", "Apellido paterno", "Apellido materno", "Sexo", "Carrera", "Campus"]) {
      expect(screen.getByLabelText(etiqueta)).toBeInTheDocument();
    }
  });
});

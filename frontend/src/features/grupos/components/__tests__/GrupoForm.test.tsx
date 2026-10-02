import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Grupo } from "../../types";
import { GrupoForm } from "../GrupoForm";

const vacio = { data: [], total: 0, page: 1, pageSize: 20 };
vi.mock("../../../extraescolares/api", () => ({ fetchExtraescolares: vi.fn(async () => vacio) }));
vi.mock("../../../promotores/api", () => ({ fetchPromotores: vi.fn(async () => vacio) }));
vi.mock("../../../semestres/api", () => ({ fetchSemestres: vi.fn(async () => vacio) }));

const GRUPO: Grupo = {
  idgrupo: "1-1FS-PRUE800101-AD25",
  primerdia: "LUNES",
  segundodia: "MIERCOLES",
  horainicio: "16:00",
  horatermino: "17:00",
  aula: "Cancha 1",
  idsemestre: "AD-25",
  idextraescolar: "1-FS",
  rfcpromotor: "PRUE800101AB1",
  extraescolar: { idextraescolar: "1-FS", nombreextra: "Futbol Soccer" },
  promotor: { rfc: "PRUE800101AB1", nombre: "Laura", appaterno: "Garcia", apmaterno: "Reyes" },
  semestre: { idsemestre: "AD-25", mesinicio: "AGOSTO", mestermino: "DICIEMBRE", anio: "2025" },
};

function renderEdicion(onActualizar = vi.fn()) {
  render(
    <GrupoForm grupoEnEdicion={GRUPO} onCrear={vi.fn()} onActualizar={onActualizar} onCancelar={vi.fn()} enviando={false} />
  );
  return onActualizar;
}

describe("GrupoForm", () => {
  it("al editar, los campos vaciados se envian como null para que la API los borre", async () => {
    const onActualizar = renderEdicion();
    await userEvent.selectOptions(screen.getByLabelText("Segundo dia"), "");
    await userEvent.selectOptions(screen.getByLabelText("Hora inicio"), "");
    await userEvent.selectOptions(screen.getByLabelText("Hora termino"), "");
    await userEvent.clear(screen.getByLabelText("Aula"));
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(onActualizar).toHaveBeenCalledWith({
      primerdia: "LUNES",
      segundodia: null,
      horainicio: null,
      horatermino: null,
      aula: null,
    });
  });

  it("al mover el primer dia despues del segundo, limpia el segundo dia", async () => {
    const onActualizar = renderEdicion();
    await userEvent.selectOptions(screen.getByLabelText("Primer dia"), "JUEVES");
    expect(screen.getByLabelText("Segundo dia")).toHaveValue("");
    await userEvent.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(onActualizar).toHaveBeenCalledWith(expect.objectContaining({ primerdia: "JUEVES", segundodia: null }));
  });

  it("no deja guardar un horario con solo hora de inicio", async () => {
    const onActualizar = renderEdicion();
    await userEvent.selectOptions(screen.getByLabelText("Hora termino"), "");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(screen.getByText(/Captura la hora de inicio y la de termino/)).toBeInTheDocument();
    expect(onActualizar).not.toHaveBeenCalled();
  });

  it("al crear, exige actividad, promotor y semestre", () => {
    render(<GrupoForm grupoEnEdicion={null} onCrear={vi.fn()} onActualizar={vi.fn()} onCancelar={vi.fn()} enviando={false} />);
    expect(screen.getByRole("button", { name: "Agregar" })).toBeDisabled();
    expect(screen.getByText(/Selecciona la actividad, el promotor y el semestre/)).toBeInTheDocument();
  });
});

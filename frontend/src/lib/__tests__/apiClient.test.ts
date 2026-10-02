import { AxiosError, AxiosHeaders } from "axios";
import { describe, expect, it } from "vitest";
import { getApiErrorMessage, getImpactoConfirmacion, seg } from "../apiClient";

function errorHttp(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError("fallo", "ERR_BAD_REQUEST", config, null, {
    status,
    statusText: "",
    headers: {},
    config,
    data,
  });
}

describe("getApiErrorMessage", () => {
  it("prefiere los mensajes de validacion por campo que manda la API", () => {
    const error = errorHttp(400, {
      error: "Datos de entrada invalidos",
      details: {
        formErrors: [],
        fieldErrors: { idextraescolar: ["Selecciona la actividad extraescolar."], idsemestre: ["Selecciona el semestre."] },
      },
    });
    expect(getApiErrorMessage(error)).toBe("Selecciona la actividad extraescolar. Selecciona el semestre.");
  });

  it("usa el mensaje general si no hay errores por campo", () => {
    expect(getApiErrorMessage(errorHttp(409, { error: 'Ya existe la carrera "X".' }))).toBe(
      'Ya existe la carrera "X".'
    );
  });

  it("explica la falta de conexion en lugar de mostrar 'Network Error'", () => {
    const sinRespuesta = new AxiosError("Network Error", "ERR_NETWORK");
    expect(getApiErrorMessage(sinRespuesta)).toMatch(/No se pudo conectar/);
  });
});

describe("getImpactoConfirmacion", () => {
  it("reconoce el 409 que pide confirmar un borrado con efectos secundarios", () => {
    const error = errorHttp(409, { error: "Este grupo tiene 3 alumno(s)...", details: { requiereConfirmacion: true } });
    expect(getImpactoConfirmacion(error)).toEqual({ mensaje: "Este grupo tiene 3 alumno(s)..." });
  });

  it("ignora otros 409 (p. ej. carrera con alumnos, que no se puede forzar)", () => {
    expect(getImpactoConfirmacion(errorHttp(409, { error: "No puedes borrar...", details: { alumnosAsignados: 2 } }))).toBeNull();
  });
});

describe("seg", () => {
  it("codifica caracteres que romperian la ruta", () => {
    expect(seg("12-C#/x?")).toBe("12-C%23%2Fx%3F");
  });
});

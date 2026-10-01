import { describe, expect, it, vi } from "vitest";

vi.mock("../../config/prisma", () => ({ prisma: {} }));

import {
  generarIdCarrera,
  generarIdExtraescolar,
  generarIdGrupo,
  generarIdSemestre,
  mesTerminoEsperado,
  siguienteConsecutivo,
} from "../idGenerators";

/** Cliente simulado: findMany devuelve los IDs indicados para la tabla pedida. */
function dbCon(ids: { extraescolar?: string[]; carrera?: string[]; grupo?: string[] }) {
  return {
    extraescolar: { findMany: vi.fn().mockResolvedValue((ids.extraescolar ?? []).map((idextraescolar) => ({ idextraescolar }))) },
    carrera: { findMany: vi.fn().mockResolvedValue((ids.carrera ?? []).map((idcarrera) => ({ idcarrera }))) },
    grupo: { findMany: vi.fn().mockResolvedValue((ids.grupo ?? []).map((idgrupo) => ({ idgrupo }))) },
  } as never;
}

describe("generarIdSemestre", () => {
  it("compone iniciales + ultimos 2 digitos del anio", () => {
    expect(generarIdSemestre("ENERO", "JUNIO", "2025")).toBe("EJ-25");
    expect(generarIdSemestre("AGOSTO", "DICIEMBRE", "2024")).toBe("AD-24");
  });
});

describe("mesTerminoEsperado", () => {
  it("empareja los meses del sistema academico", () => {
    expect(mesTerminoEsperado("ENERO")).toBe("JUNIO");
    expect(mesTerminoEsperado("AGOSTO")).toBe("DICIEMBRE");
  });
});

describe("siguienteConsecutivo", () => {
  it("usa el mayor prefijo numerico existente + 1, sin importar huecos ni orden", () => {
    expect(siguienteConsecutivo([])).toBe(1);
    expect(siguienteConsecutivo(["3-A", "12-BER", "7-X", "SIN-NUMERO"])).toBe(13);
  });
});

describe("generarIdExtraescolar", () => {
  it("usa 1 como consecutivo cuando no hay actividades previas", async () => {
    expect(await generarIdExtraescolar("Futbol Soccer", dbCon({}))).toBe("1-FS");
  });

  it("continua desde el maximo prefijo numerico existente", async () => {
    const db = dbCon({ extraescolar: ["3-A", "12-BER", "7-X"] });
    expect(await generarIdExtraescolar("Club de Ajedrez", db)).toBe("13-CDA");
  });
});

describe("generarIdCarrera", () => {
  it("usa 1 como consecutivo cuando no hay carreras previas", async () => {
    expect(await generarIdCarrera("Ingenieria Industrial", dbCon({}))).toBe("1-II");
  });

  it("continua desde el maximo prefijo numerico existente", async () => {
    const db = dbCon({ carrera: ["5-CP", "9-LA"] });
    expect(await generarIdCarrera("Ingenieria en Sistemas", db)).toBe("10-IES");
  });
});

describe("generarIdGrupo", () => {
  it("compone consecutivo + partes sin guiones, usando SINSEM si no hay semestre", async () => {
    const db = dbCon({ grupo: ["1-A", "2-B", "3-C", "4-D"] });
    const id = await generarIdGrupo(
      { idextraescolar: "1-FS", rfcpromotor: "ZUHR111111000", idsemestre: null },
      db
    );
    expect(id).toBe("5-1FS-ZUHR111111-SINSEM");
  });

  it("usa el idsemestre sin guiones cuando se proporciona", async () => {
    const id = await generarIdGrupo(
      { idextraescolar: "9-BDGYE", rfcpromotor: "BEMM111111000", idsemestre: "EJ-24" },
      dbCon({})
    );
    expect(id).toBe("1-9BDGYE-BEMM111111-EJ24");
  });

  it("tras borrar un grupo no repite un consecutivo existente (antes usaba el total + 1)", async () => {
    // Quedan 2 grupos, pero el mayor consecutivo es 3: el siguiente debe ser 4, no 3.
    const db = dbCon({ grupo: ["2-1FS-AAAA-EJ25", "3-1FS-AAAA-EJ25"] });
    const id = await generarIdGrupo({ idextraescolar: "1-FS", rfcpromotor: "AAAA", idsemestre: "EJ-25" }, db);
    expect(id).toBe("4-1FS-AAAA-EJ25");
  });
});

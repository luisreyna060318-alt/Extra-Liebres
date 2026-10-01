import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/prisma", () => ({
  prisma: {
    extraescolar: { findMany: vi.fn() },
    carrera: { findMany: vi.fn() },
    grupo: { count: vi.fn() },
  },
}));

import { prisma } from "../../config/prisma";
import {
  generarIdCarrera,
  generarIdExtraescolar,
  generarIdGrupo,
  generarIdSemestre,
  mesTerminoEsperado,
} from "../idGenerators";

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

describe("generarIdExtraescolar", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa 1 como consecutivo cuando no hay actividades previas", async () => {
    vi.mocked(prisma.extraescolar.findMany).mockResolvedValue([]);
    expect(await generarIdExtraescolar("Futbol Soccer")).toBe("1-FS");
  });

  it("continua desde el maximo prefijo numerico existente", async () => {
    vi.mocked(prisma.extraescolar.findMany).mockResolvedValue([
      { idextraescolar: "3-A" },
      { idextraescolar: "12-BER" },
      { idextraescolar: "7-X" },
    ] as never);
    expect(await generarIdExtraescolar("Club de Ajedrez")).toBe("13-CDA");
  });
});

describe("generarIdCarrera", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa 1 como consecutivo cuando no hay carreras previas", async () => {
    vi.mocked(prisma.carrera.findMany).mockResolvedValue([]);
    expect(await generarIdCarrera("Ingenieria Industrial")).toBe("1-II");
  });

  it("continua desde el maximo prefijo numerico existente", async () => {
    vi.mocked(prisma.carrera.findMany).mockResolvedValue([
      { idcarrera: "5-CP" },
      { idcarrera: "9-LA" },
    ] as never);
    expect(await generarIdCarrera("Ingenieria en Sistemas")).toBe("10-IES");
  });
});

describe("generarIdGrupo", () => {
  beforeEach(() => vi.clearAllMocks());

  it("compone consecutivo + partes sin guiones, usando SINSEM si no hay semestre", async () => {
    vi.mocked(prisma.grupo.count).mockResolvedValue(4);
    const id = await generarIdGrupo({
      idextraescolar: "1-FS",
      rfcpromotor: "ZUHR111111000",
      idsemestre: null,
    });
    expect(id).toBe("5-1FS-ZUHR111111-SINSEM");
  });

  it("usa el idsemestre sin guiones cuando se proporciona", async () => {
    vi.mocked(prisma.grupo.count).mockResolvedValue(0);
    const id = await generarIdGrupo({
      idextraescolar: "9-BDGYE",
      rfcpromotor: "BEMM111111000",
      idsemestre: "EJ-24",
    });
    expect(id).toBe("1-9BDGYE-BEMM111111-EJ24");
  });
});

/**
 * Pruebas de integracion de los defectos encontrados en la auditoria: cada
 * caso reproduce el escenario que fallaba y verifica el comportamiento
 * corregido, contra la base de prueba real.
 */
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { prisma } from "../../config/prisma";
import {
  crearAlumnoDePrueba,
  crearCarreraDePrueba,
  crearExtraescolarDePrueba,
  crearPromotorDePrueba,
  crearSemestreDePrueba,
  limpiarBaseDePrueba,
} from "../testHelpers";

const app = createApp();

beforeEach(async () => {
  await limpiarBaseDePrueba();
});

afterAll(async () => {
  await limpiarBaseDePrueba();
  await prisma.$disconnect();
});

async function catalogosBase() {
  const carrera = await crearCarreraDePrueba();
  const promotor = await crearPromotorDePrueba("PRUE800101AB1");
  const extraescolar = await crearExtraescolarDePrueba("1-FS");
  const semestre = await crearSemestreDePrueba("AD-25");
  return { carrera, promotor, extraescolar, semestre };
}

async function crearGrupoPorApi(body: Record<string, unknown>) {
  const respuesta = await request(app).post("/api/grupos").send(body);
  expect(respuesta.status).toBe(201);
  return respuesta.body as { idgrupo: string };
}

describe("Edicion: vaciar campos opcionales", () => {
  it("un alumno puede quedar sin apellido materno y sin sexo", async () => {
    const { carrera } = await catalogosBase();
    await crearAlumnoDePrueba("10000001", carrera.idcarrera);

    const respuesta = await request(app)
      .put("/api/alumnos/10000001")
      .send({ apmaterno: "", sexo: null });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ apmaterno: null, sexo: null, nombre: "Alumno" });
  });

  it("un campo ausente en el PUT no se modifica", async () => {
    const { carrera } = await catalogosBase();
    await crearAlumnoDePrueba("10000002", carrera.idcarrera);

    const respuesta = await request(app).put("/api/alumnos/10000002").send({ nombre: "Otro" });

    expect(respuesta.body).toMatchObject({ nombre: "Otro", apmaterno: "Prueba", sexo: "MASCULINO" });
  });

  it("un grupo puede quedar sin segundo dia, sin horario y sin aula", async () => {
    const { promotor, extraescolar, semestre } = await catalogosBase();
    const { idgrupo } = await crearGrupoPorApi({
      idextraescolar: extraescolar.idextraescolar,
      rfcpromotor: promotor.rfc,
      idsemestre: semestre.idsemestre,
      primerdia: "LUNES",
      segundodia: "MIERCOLES",
      horainicio: "16:00",
      horatermino: "17:00",
      aula: "Cancha 1",
    });

    const respuesta = await request(app)
      .put(`/api/grupos/${encodeURIComponent(idgrupo)}`)
      .send({ segundodia: null, horainicio: null, horatermino: null, aula: "" });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      primerdia: "LUNES",
      segundodia: null,
      horainicio: null,
      horatermino: null,
      aula: null,
    });
  });
});

describe("Edicion de grupo: reglas de horario sobre el resultado final", () => {
  async function grupoLunesMiercoles() {
    const { promotor, extraescolar, semestre } = await catalogosBase();
    return crearGrupoPorApi({
      idextraescolar: extraescolar.idextraescolar,
      rfcpromotor: promotor.rfc,
      idsemestre: semestre.idsemestre,
      primerdia: "LUNES",
      segundodia: "MIERCOLES",
      horainicio: "16:00",
      horatermino: "17:00",
    });
  }

  it("rechaza un PUT parcial que dejaria el segundo dia antes del primero", async () => {
    const { idgrupo } = await grupoLunesMiercoles();

    const respuesta = await request(app)
      .put(`/api/grupos/${encodeURIComponent(idgrupo)}`)
      .send({ primerdia: "JUEVES" });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.details.fieldErrors.segundodia[0]).toMatch(/posterior/);
    const guardado = await prisma.grupo.findUnique({ where: { idgrupo } });
    expect(guardado?.primerdia).toBe("LUNES");
  });

  it("acepta un PUT parcial que deja un horario valido", async () => {
    const { idgrupo } = await grupoLunesMiercoles();

    const respuesta = await request(app)
      .put(`/api/grupos/${encodeURIComponent(idgrupo)}`)
      .send({ horainicio: "15:00" });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({ horainicio: "15:00", horatermino: "17:00" });
  });
});

describe("Generacion de IDs", () => {
  it("tras borrar un grupo se puede crear otro con la misma actividad, promotor y semestre", async () => {
    const { promotor, extraescolar, semestre } = await catalogosBase();
    const combinacion = {
      idextraescolar: extraescolar.idextraescolar,
      rfcpromotor: promotor.rfc,
      idsemestre: semestre.idsemestre,
    };
    const primero = await crearGrupoPorApi(combinacion);
    const segundo = await crearGrupoPorApi(combinacion);
    await request(app).delete(`/api/grupos/${encodeURIComponent(primero.idgrupo)}`).expect(204);

    const tercero = await crearGrupoPorApi(combinacion);

    expect(segundo.idgrupo.startsWith("2-")).toBe(true);
    expect(tercero.idgrupo.startsWith("3-")).toBe(true);
  });

  it("altas simultaneas no repiten el consecutivo aunque las iniciales difieran", async () => {
    const nombres = ["Zeta Uno", "Yate Dos", "Xilo Tres", "Wok Cuatro", "Vela Cinco", "Uva Seis"];

    const respuestas = await Promise.all(
      nombres.map((nombreextra) => request(app).post("/api/extraescolares").send({ nombreextra }))
    );

    const consecutivos = respuestas.map((r) => {
      expect(r.status).toBe(201);
      return Number(r.body.idextraescolar.split("-")[0]);
    });
    expect([...consecutivos].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it("un nombre con muchas palabras genera un ID que cabe en su columna", async () => {
    const respuesta = await request(app)
      .post("/api/extraescolares")
      .send({ nombreextra: "a b c d e f g h i j k l m n o p q r s t u" });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.idextraescolar.length).toBeLessThanOrEqual(20);
  });
});

describe("Filtros y busqueda", () => {
  it("filtra grupos por id de actividad y RFC de promotor exactos", async () => {
    const { promotor, extraescolar, semestre } = await catalogosBase();
    const otroPromotor = await crearPromotorDePrueba("OTRO800101AB1");
    const otraActividad = await prisma.extraescolar.create({
      data: { idextraescolar: "2-FSF", nombreextra: "Futbol Soccer Femenil" },
    });
    await crearGrupoPorApi({ idextraescolar: extraescolar.idextraescolar, rfcpromotor: promotor.rfc, idsemestre: semestre.idsemestre });
    await crearGrupoPorApi({ idextraescolar: otraActividad.idextraescolar, rfcpromotor: promotor.rfc, idsemestre: semestre.idsemestre });
    await crearGrupoPorApi({ idextraescolar: extraescolar.idextraescolar, rfcpromotor: otroPromotor.rfc, idsemestre: semestre.idsemestre });

    const porActividad = await request(app).get("/api/grupos").query({ idextraescolar: "1-FS" });
    const porPromotor = await request(app).get("/api/grupos").query({ rfcpromotor: "otro800101ab1" });

    expect(porActividad.body.total).toBe(2);
    expect(porActividad.body.data.every((g: { idextraescolar: string }) => g.idextraescolar === "1-FS")).toBe(true);
    expect(porPromotor.body.total).toBe(1);
  });

  it("encuentra alumnos por nombre completo (palabras en campos distintos)", async () => {
    const { carrera } = await catalogosBase();
    await prisma.alumno.create({
      data: { nocontrol: "20000001", nombre: "Juan", appaterno: "Perez", idcarrera: carrera.idcarrera, campus: "CAMPUS_1" },
    });
    await prisma.alumno.create({
      data: { nocontrol: "20000002", nombre: "Juan", appaterno: "Lopez", idcarrera: carrera.idcarrera, campus: "CAMPUS_1" },
    });

    const respuesta = await request(app).get("/api/alumnos").query({ search: "juan perez" });

    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.data[0].nocontrol).toBe("20000001");
  });
});

describe("Inscripciones", () => {
  async function grupoConAlumnos() {
    const { carrera, promotor, extraescolar, semestre } = await catalogosBase();
    await crearAlumnoDePrueba("30000001", carrera.idcarrera);
    await prisma.alumno.create({
      data: { nocontrol: "12345678901", nombre: "Once", appaterno: "Digitos", sexo: "FEMENINO", idcarrera: carrera.idcarrera, campus: "CAMPUS_2" },
    });
    return crearGrupoPorApi({
      idextraescolar: extraescolar.idextraescolar,
      rfcpromotor: promotor.rfc,
      idsemestre: semestre.idsemestre,
    });
  }

  it("inscribe un lote en una sola operacion y reporta cada caso", async () => {
    const { idgrupo } = await grupoConAlumnos();
    const ruta = `/api/grupos/${encodeURIComponent(idgrupo)}/alumnos`;

    const respuesta = await request(app)
      .post(ruta)
      .send({
        alumnos: [
          { nocontrol: "30000001", calificacion: 4 },
          { nocontrol: "12345678901", calificacion: 2 },
          { nocontrol: "30000001", calificacion: 1 },
          { nocontrol: "99999999", calificacion: 3 },
        ],
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.resultados.map((r: { estado: string }) => r.estado)).toEqual([
      "agregado",
      "agregado",
      "ya_inscrito",
      "no_existe",
    ]);

    const roster = await request(app).get(ruta);
    expect(roster.body.total).toBe(2);
    expect(roster.body.estadisticasPorSexo.femenino).toEqual({ cantidad: 1, porcentaje: 50 });
    expect(roster.body.alumnos.find((a: { nocontrol: string }) => a.nocontrol === "12345678901").desempeno).toBe("BUENO");
  });

  it("acepta numeros de control de 11 digitos tambien al inscribir y en el historial", async () => {
    const { idgrupo } = await grupoConAlumnos();
    await request(app)
      .post(`/api/grupos/${encodeURIComponent(idgrupo)}/alumnos`)
      .send({ alumnos: [{ nocontrol: "12345678901", calificacion: 3 }] })
      .expect(201);

    const historial = await request(app).get("/api/busqueda/alumnos/12345678901/extraescolares");

    expect(historial.status).toBe(200);
    expect(historial.body.historial).toHaveLength(1);
    expect(historial.body.historial[0]).toMatchObject({ calificacion: 3, desempeno: "NOTABLE" });
  });

  it("retira y reporta a quien no estaba inscrito", async () => {
    const { idgrupo } = await grupoConAlumnos();
    const ruta = `/api/grupos/${encodeURIComponent(idgrupo)}/alumnos`;
    await request(app).post(ruta).send({ alumnos: [{ nocontrol: "30000001", calificacion: 4 }] });

    const respuesta = await request(app).delete(ruta).send({ nocontrol: ["30000001", "12345678901"] });

    expect(respuesta.body.resultados).toEqual([
      { nocontrol: "30000001", estado: "eliminado" },
      { nocontrol: "12345678901", estado: "no_inscrito" },
    ]);
  });

  it("rechaza lotes de mas de 200 alumnos", async () => {
    const { idgrupo } = await grupoConAlumnos();
    const alumnos = Array.from({ length: 201 }, (_, i) => ({ nocontrol: String(40000000 + i), calificacion: 1 }));

    const respuesta = await request(app)
      .post(`/api/grupos/${encodeURIComponent(idgrupo)}/alumnos`)
      .send({ alumnos });

    expect(respuesta.status).toBe(400);
  });
});

describe("Respuestas de error", () => {
  it("JSON malformado responde 400, no 500", async () => {
    const respuesta = await request(app)
      .post("/api/carreras")
      .set("Content-Type", "application/json")
      .send('{"nombre":');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.error).toMatch(/JSON/);
  });

  it("un cuerpo demasiado grande responde 413", async () => {
    const respuesta = await request(app)
      .post("/api/carreras")
      .send({ nombre: "x".repeat(200_000) });

    expect(respuesta.status).toBe(413);
  });

  it("renombrar una carrera a un nombre existente da un 409 claro y sin metadatos internos", async () => {
    await crearCarreraDePrueba("1-A", "Carrera A");
    await crearCarreraDePrueba("2-B", "Carrera B");

    const respuesta = await request(app).put("/api/carreras/1-A").send({ nombre: "Carrera B" });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.error).toBe('Ya existe la carrera "Carrera B".');
    expect(respuesta.body.details).toBeUndefined();
  });

  it("el RFC de la ruta no distingue mayusculas", async () => {
    await crearPromotorDePrueba("PRUE800101AB1");

    const respuesta = await request(app).get("/api/promotores/prue800101ab1");

    expect(respuesta.status).toBe(200);
  });
});

describe("Exportacion CSV", () => {
  it("neutraliza nombres que una hoja de calculo ejecutaria como formula", async () => {
    const { carrera } = await catalogosBase();
    await prisma.alumno.create({
      data: { nocontrol: "50000001", nombre: '=HYPERLINK("http://x","y")', appaterno: "Prueba", idcarrera: carrera.idcarrera, campus: "CAMPUS_1" },
    });

    const respuesta = await request(app).get("/api/alumnos/export");

    expect(respuesta.status).toBe(200);
    expect(respuesta.text).toContain('50000001,"\'=HYPERLINK(""http://x"",""y"")",Prueba');
  });
});

describe("Borrado con confirmacion de un promotor", () => {
  it("advierte grupos e inscripciones afectados y al confirmar borra en cascada", async () => {
    const { carrera, promotor, extraescolar, semestre } = await catalogosBase();
    await crearAlumnoDePrueba("60000001", carrera.idcarrera);
    const { idgrupo } = await crearGrupoPorApi({
      idextraescolar: extraescolar.idextraescolar,
      rfcpromotor: promotor.rfc,
      idsemestre: semestre.idsemestre,
    });
    await request(app)
      .post(`/api/grupos/${encodeURIComponent(idgrupo)}/alumnos`)
      .send({ alumnos: [{ nocontrol: "60000001", calificacion: 2 }] });

    const sinConfirmar = await request(app).delete(`/api/promotores/${promotor.rfc}`);
    expect(sinConfirmar.status).toBe(409);
    expect(sinConfirmar.body.details).toMatchObject({ gruposAfectados: 1, inscripcionesAfectadas: 1 });

    await request(app).delete(`/api/promotores/${promotor.rfc}`).query({ confirmar: "true" }).expect(204);
    expect(await prisma.grupo.count()).toBe(0);
    expect(await prisma.alumnoGrupo.count()).toBe(0);
    expect(await prisma.alumno.count()).toBe(1);
  });

  it("un id inexistente responde 404", async () => {
    const respuesta = await request(app).delete("/api/promotores/NOEXISTE00000");
    expect(respuesta.status).toBe(404);
  });
});

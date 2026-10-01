/**
 * Pruebas de integracion: levantan la app Express real (createApp()) y le
 * pegan peticiones HTTP reales via supertest, contra una base de datos
 * Postgres real y separada (DATABASE_URL debe apuntar a
 * "extraliebresdb_test", nunca a la base con los datos importados).
 */
import request from "supertest";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../../app";
import { prisma } from "../../config/prisma";
import {
  crearAlumnoDePrueba,
  crearCarreraDePrueba,
  crearExtraescolarDePrueba,
  crearGrupoDePrueba,
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

describe("Paginacion de listados", () => {
  it("GET /api/alumnos respeta page/pageSize y reporta el total real", async () => {
    const carrera = await crearCarreraDePrueba();
    await crearAlumnoDePrueba("10000001", carrera.idcarrera);
    await crearAlumnoDePrueba("10000002", carrera.idcarrera);
    await crearAlumnoDePrueba("10000003", carrera.idcarrera);

    const pagina1 = await request(app).get("/api/alumnos").query({ page: 1, pageSize: 2 });
    expect(pagina1.status).toBe(200);
    expect(pagina1.body.total).toBe(3);
    expect(pagina1.body.data).toHaveLength(2);
    expect(pagina1.body.page).toBe(1);

    const pagina2 = await request(app).get("/api/alumnos").query({ page: 2, pageSize: 2 });
    expect(pagina2.body.data).toHaveLength(1);
  });

  it("filtra por idcarrera/campus/sexo combinados", async () => {
    const carreraA = await crearCarreraDePrueba("1-A", "Carrera A");
    const carreraB = await crearCarreraDePrueba("2-B", "Carrera B");
    await crearAlumnoDePrueba("20000001", carreraA.idcarrera);
    await prisma.alumno.create({
      data: {
        nocontrol: "20000002",
        nombre: "Otra",
        appaterno: "Persona",
        sexo: "FEMENINO",
        idcarrera: carreraB.idcarrera,
        campus: "CAMPUS_2",
      },
    });

    const filtrado = await request(app)
      .get("/api/alumnos")
      .query({ idcarrera: carreraA.idcarrera, campus: "CAMPUS_1" });

    expect(filtrado.body.total).toBe(1);
    expect(filtrado.body.data[0].nocontrol).toBe("20000001");
  });
});

describe("Validacion de FK al crear un alumno", () => {
  it("rechaza una carrera inexistente con 400", async () => {
    const respuesta = await request(app).post("/api/alumnos").send({
      nocontrol: "30000001",
      nombre: "Test",
      appaterno: "Test",
      idcarrera: "NO-EXISTE",
      campus: "CAMPUS_1",
    });
    expect(respuesta.status).toBe(400);
  });

  it("crea el alumno cuando la carrera si existe", async () => {
    const carrera = await crearCarreraDePrueba();
    const respuesta = await request(app).post("/api/alumnos").send({
      nocontrol: "30000002",
      nombre: "Test",
      appaterno: "Test",
      idcarrera: carrera.idcarrera,
      campus: "CAMPUS_1",
    });
    expect(respuesta.status).toBe(201);
    expect(respuesta.body.carrera.nombre).toBe(carrera.nombre);
  });
});

describe("Borrado con confirmacion explicita", () => {
  async function prepararGrupoConInscripcion() {
    const carrera = await crearCarreraDePrueba();
    const promotor = await crearPromotorDePrueba();
    const extraescolar = await crearExtraescolarDePrueba();
    const semestre = await crearSemestreDePrueba();
    const alumno = await crearAlumnoDePrueba("40000001", carrera.idcarrera);
    const grupo = await crearGrupoDePrueba({
      idgrupo: "1-TEST-GRUPO",
      idextraescolar: extraescolar.idextraescolar,
      rfcpromotor: promotor.rfc,
      idsemestre: semestre.idsemestre,
    });
    await prisma.alumnoGrupo.create({
      data: { nocontrol: alumno.nocontrol, idgrupo: grupo.idgrupo, calificacion: 4, desempeno: "EXCELENTE" },
    });
    return { alumno, grupo };
  }

  it("bloquea el borrado de un alumno con historial y pide confirmacion", async () => {
    const { alumno } = await prepararGrupoConInscripcion();

    const sinConfirmar = await request(app).delete(`/api/alumnos/${alumno.nocontrol}`);
    expect(sinConfirmar.status).toBe(409);
    expect(sinConfirmar.body.details).toMatchObject({
      requiereConfirmacion: true,
      inscripcionesAfectadas: 1,
    });

    const existeAun = await prisma.alumno.findUnique({ where: { nocontrol: alumno.nocontrol } });
    expect(existeAun).not.toBeNull();

    const confirmado = await request(app)
      .delete(`/api/alumnos/${alumno.nocontrol}`)
      .query({ confirmar: "true" });
    expect(confirmado.status).toBe(204);

    const yaNoExiste = await prisma.alumno.findUnique({ where: { nocontrol: alumno.nocontrol } });
    expect(yaNoExiste).toBeNull();
  });

  it("bloquea el borrado de un grupo con inscripciones y, al confirmar, cascada tambien la inscripcion", async () => {
    const { grupo, alumno } = await prepararGrupoConInscripcion();

    const sinConfirmar = await request(app).delete(`/api/grupos/${grupo.idgrupo}`);
    expect(sinConfirmar.status).toBe(409);
    expect(sinConfirmar.body.details.inscripcionesAfectadas).toBe(1);

    const confirmado = await request(app)
      .delete(`/api/grupos/${grupo.idgrupo}`)
      .query({ confirmar: "true" });
    expect(confirmado.status).toBe(204);

    const inscripcion = await prisma.alumnoGrupo.findUnique({
      where: { nocontrol_idgrupo: { nocontrol: alumno.nocontrol, idgrupo: grupo.idgrupo } },
    });
    expect(inscripcion).toBeNull();
  });

  it("deja borrar directo (sin 409) cuando no hay dependientes", async () => {
    const carrera = await crearCarreraDePrueba();
    const alumno = await crearAlumnoDePrueba("40000099", carrera.idcarrera);

    const respuesta = await request(app).delete(`/api/alumnos/${alumno.nocontrol}`);
    expect(respuesta.status).toBe(204);
  });
});

describe("La carrera nunca cascada hacia alumnos", () => {
  it("bloquea el borrado sin ninguna forma de forzarlo, incluso con ?confirmar=true", async () => {
    const carrera = await crearCarreraDePrueba();
    await crearAlumnoDePrueba("50000001", carrera.idcarrera);

    const intento = await request(app)
      .delete(`/api/carreras/${carrera.idcarrera}`)
      .query({ confirmar: "true" });

    expect(intento.status).toBe(409);
    const sigueExistiendo = await prisma.carrera.findUnique({
      where: { idcarrera: carrera.idcarrera },
    });
    expect(sigueExistiendo).not.toBeNull();
  });

  it("permite borrar una carrera sin alumnos asignados", async () => {
    const carrera = await crearCarreraDePrueba();
    const respuesta = await request(app).delete(`/api/carreras/${carrera.idcarrera}`);
    expect(respuesta.status).toBe(204);
  });
});

describe("Generacion de IDs bajo concurrencia", () => {
  it("5 altas simultaneas de extraescolares no colisionan (condicion de carrera corregida)", async () => {
    const nombres = ["Alfa Uno", "Alfa Dos", "Alfa Tres", "Alfa Cuatro", "Alfa Cinco"];

    const respuestas = await Promise.all(
      nombres.map((nombreextra) => request(app).post("/api/extraescolares").send({ nombreextra }))
    );

    for (const respuesta of respuestas) {
      expect(respuesta.status).toBe(201);
    }

    const ids = respuestas.map((r) => r.body.idextraescolar);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

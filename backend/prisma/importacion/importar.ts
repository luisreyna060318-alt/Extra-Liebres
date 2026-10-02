/**
 * Logica de importacion del volcado legado, separada del script de linea de
 * comandos para poder probarla. Primero se prepara TODO en memoria (sin tocar
 * la base) y despues se escribe en una sola transaccion: si algo falla, la
 * base queda exactamente como estaba.
 */
import { Campus, DiaSemana, Prisma, PrismaClient, Sexo } from "@prisma/client";
import { calificacionADesempeno } from "../../src/utils/desempeno";
import { iniciales } from "../../src/utils/iniciales";
import { extraerInserts } from "./parser";

/** Nombre del catalogo al que se asignan los alumnos sin carrera en el volcado. */
export const CARRERA_SIN_ASIGNAR = "SIN CARRERA ASIGNADA (revisar)";

export interface DatosPreparados {
  promotores: Prisma.PromotorCreateManyInput[];
  extraescolares: Prisma.ExtraescolarCreateManyInput[];
  semestres: Prisma.SemestreCreateManyInput[];
  carreras: Prisma.CarreraCreateManyInput[];
  alumnos: Prisma.AlumnoCreateManyInput[];
  grupos: Prisma.GrupoCreateManyInput[];
  inscripciones: Prisma.AlumnoGrupoCreateManyInput[];
  /** Avisos sobre datos que se corrigieron, completaron u omitieron. */
  avisos: string[];
}

export type ConteoTablas = Record<
  "promotores" | "extraescolares" | "semestres" | "carreras" | "alumnos" | "grupos" | "inscripciones",
  number
>;

function texto(valor: string | null | undefined): string {
  return (valor ?? "").trim();
}

function vacioANulo(valor: string | null | undefined): string | null {
  const v = texto(valor);
  return v === "" ? null : v;
}

function mapearCampus(valor: string | null): Campus | null {
  const v = texto(valor).toUpperCase();
  if (v === "CAMPUS 1") return "CAMPUS_1";
  if (v === "CAMPUS 2") return "CAMPUS_2";
  return null;
}

function mapearSexo(valor: string | null): Sexo | null {
  const v = texto(valor).toUpperCase();
  if (v === "MASCULINO" || v === "FEMENINO") return v;
  return null;
}

const DIAS_VALIDOS: DiaSemana[] = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"];

function mapearDia(valor: string | null): DiaSemana | null {
  const v = texto(valor);
  if (!v) return null;
  const normalizado = v
    .toUpperCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return DIAS_VALIDOS.includes(normalizado as DiaSemana) ? (normalizado as DiaSemana) : null;
}

function muestra(valores: string[], maximo = 10): string {
  const lista = valores.slice(0, maximo).join(", ");
  return valores.length > maximo ? `${lista} y ${valores.length - maximo} mas` : lista;
}

/** Parsea y valida el volcado completo sin tocar la base de datos. */
export function prepararDatos(sql: string): DatosPreparados {
  const avisos: string[] = [];

  const promotores = extraerInserts(sql, "promotor")
    .filter((f) => texto(f.rfc) !== "")
    .map((f) => ({
      rfc: texto(f.rfc).toUpperCase(),
      nombre: texto(f.nombre),
      appaterno: texto(f.appaterno),
      apmaterno: texto(f.apmaterno),
    }));

  const extraescolares = extraerInserts(sql, "extraescolar")
    .filter((f) => texto(f.idextraescolar) !== "")
    .map((f) => ({ idextraescolar: texto(f.idextraescolar), nombreextra: texto(f.nombreextra) }));

  const semestres = extraerInserts(sql, "semestre")
    .filter((f) => texto(f.idsemestre) !== "")
    .map((f) => ({
      idsemestre: texto(f.idsemestre),
      mesinicio: texto(f.mesinicio),
      mestermino: texto(f.mestermino),
      anio: texto(f.anio),
    }));

  // --- Carreras: derivadas de los valores distintos de alumno.carrera ---
  const filasAlumno = extraerInserts(sql, "alumno").filter((f) => texto(f.nocontrol) !== "");
  const nombresCarrera = Array.from(
    new Set(filasAlumno.map((f) => texto(f.carrera)).filter((n) => n !== ""))
  ).sort();
  const carreras = nombresCarrera.map((nombre, indice) => ({
    idcarrera: `${indice + 1}-${iniciales(nombre)}`,
    nombre,
  }));
  const idPorNombre = new Map(carreras.map((c) => [c.nombre, c.idcarrera]));

  const sinCarrera = filasAlumno.filter((f) => texto(f.carrera) === "");
  if (sinCarrera.length > 0) {
    const idcarrera = `${carreras.length + 1}-SCA`;
    carreras.push({ idcarrera, nombre: CARRERA_SIN_ASIGNAR });
    idPorNombre.set("", idcarrera);
    avisos.push(
      `${sinCarrera.length} alumno(s) sin carrera en el volcado quedaron en la carrera ` +
        `"${CARRERA_SIN_ASIGNAR}": ${muestra(sinCarrera.map((f) => texto(f.nocontrol)))}.`
    );
  }

  // --- Alumnos ---
  const campusPorDefecto: string[] = [];
  const sexoNoReconocido: string[] = [];
  const alumnos = filasAlumno.map((f) => {
    const nocontrol = texto(f.nocontrol);
    const campus = mapearCampus(f.campus);
    if (!campus) campusPorDefecto.push(`${nocontrol} ("${texto(f.campus)}")`);
    const sexo = mapearSexo(f.sexo);
    if (!sexo && texto(f.sexo) !== "") sexoNoReconocido.push(`${nocontrol} ("${texto(f.sexo)}")`);
    return {
      nocontrol,
      nombre: texto(f.nombre),
      appaterno: texto(f.appaterno),
      apmaterno: vacioANulo(f.apmaterno),
      sexo,
      idcarrera: idPorNombre.get(texto(f.carrera)) as string,
      campus: campus ?? "CAMPUS_1",
    };
  });
  if (campusPorDefecto.length > 0) {
    avisos.push(
      `${campusPorDefecto.length} alumno(s) con campus no reconocido se registraron en CAMPUS 1: ` +
        `${muestra(campusPorDefecto)}.`
    );
  }
  if (sexoNoReconocido.length > 0) {
    avisos.push(
      `${sexoNoReconocido.length} alumno(s) con sexo no reconocido quedaron sin especificar: ` +
        `${muestra(sexoNoReconocido)}.`
    );
  }

  // --- Grupos ---
  const idsExtraescolar = new Set(extraescolares.map((e) => e.idextraescolar));
  const rfcs = new Set(promotores.map((p) => p.rfc));
  const idsSemestre = new Set(semestres.map((s) => s.idsemestre));
  const gruposOmitidos: string[] = [];
  const semestreInexistente: string[] = [];
  const diaNoReconocido: string[] = [];
  const grupos: Prisma.GrupoCreateManyInput[] = [];

  for (const f of extraerInserts(sql, "grupo")) {
    const idgrupo = texto(f.idgrupo);
    const idextraescolar = texto(f.idextraescolar);
    const rfcpromotor = texto(f.rfcpromotor).toUpperCase();
    if (!idgrupo || !idsExtraescolar.has(idextraescolar) || !rfcs.has(rfcpromotor)) {
      gruposOmitidos.push(idgrupo || "(sin id)");
      continue;
    }
    let idsemestre = vacioANulo(f.idsemestre);
    if (idsemestre && !idsSemestre.has(idsemestre)) {
      semestreInexistente.push(`${idgrupo} ("${idsemestre}")`);
      idsemestre = null;
    }
    const primerdia = mapearDia(f.primerdia);
    const segundodia = mapearDia(f.segundodia);
    if ((!primerdia && texto(f.primerdia)) || (!segundodia && texto(f.segundodia))) {
      diaNoReconocido.push(idgrupo);
    }
    grupos.push({
      idgrupo,
      primerdia,
      segundodia,
      horainicio: vacioANulo(f.horainicio),
      horatermino: vacioANulo(f.horatermino),
      aula: vacioANulo(f.aula),
      idsemestre,
      idextraescolar,
      rfcpromotor,
    });
  }
  if (gruposOmitidos.length > 0) {
    avisos.push(
      `${gruposOmitidos.length} grupo(s) omitidos porque su actividad o promotor no existe: ` +
        `${muestra(gruposOmitidos)}.`
    );
  }
  if (semestreInexistente.length > 0) {
    avisos.push(
      `${semestreInexistente.length} grupo(s) quedaron sin semestre porque el suyo no existe: ` +
        `${muestra(semestreInexistente)}.`
    );
  }
  if (diaNoReconocido.length > 0) {
    avisos.push(
      `${diaNoReconocido.length} grupo(s) con un dia no reconocido (quedo vacio): ${muestra(diaNoReconocido)}.`
    );
  }

  // --- Inscripciones ---
  const nocontroles = new Set(alumnos.map((a) => a.nocontrol));
  const idsGrupo = new Set(grupos.map((g) => g.idgrupo));
  const inscripcionesOmitidas: string[] = [];
  const desempenoRecalculado: string[] = [];
  const inscripciones: Prisma.AlumnoGrupoCreateManyInput[] = [];

  for (const f of extraerInserts(sql, "alumnosgrupo")) {
    const nocontrol = texto(f.nocontrol);
    const idgrupo = texto(f.idgrupo);
    const calificacion = Number(texto(f.calificacion));
    const clave = `${nocontrol}/${idgrupo}`;
    if (
      !nocontroles.has(nocontrol) ||
      !idsGrupo.has(idgrupo) ||
      !Number.isInteger(calificacion) ||
      calificacion < 0 ||
      calificacion > 4
    ) {
      inscripcionesOmitidas.push(clave);
      continue;
    }
    const desempeno = calificacionADesempeno(calificacion);
    if (texto(f.desempeno).toUpperCase() !== desempeno) desempenoRecalculado.push(clave);
    inscripciones.push({ nocontrol, idgrupo, calificacion, desempeno });
  }
  if (inscripcionesOmitidas.length > 0) {
    avisos.push(
      `${inscripcionesOmitidas.length} inscripcion(es) omitidas por alumno/grupo inexistente o ` +
        `calificacion fuera de 0-4: ${muestra(inscripcionesOmitidas)}.`
    );
  }
  if (desempenoRecalculado.length > 0) {
    avisos.push(
      `${desempenoRecalculado.length} inscripcion(es) traian un desempeno que no correspondia a su ` +
        `calificacion; se recalculo: ${muestra(desempenoRecalculado)}.`
    );
  }

  return { promotores, extraescolares, semestres, carreras, alumnos, grupos, inscripciones, avisos };
}

export async function contarRegistros(db: PrismaClient): Promise<ConteoTablas> {
  const [promotores, extraescolares, semestres, carreras, alumnos, grupos, inscripciones] =
    await Promise.all([
      db.promotor.count(),
      db.extraescolar.count(),
      db.semestre.count(),
      db.carrera.count(),
      db.alumno.count(),
      db.grupo.count(),
      db.alumnoGrupo.count(),
    ]);
  return { promotores, extraescolares, semestres, carreras, alumnos, grupos, inscripciones };
}

/**
 * Reemplaza el contenido de las 7 tablas por `datos` en UNA transaccion.
 * Devuelve cuantos registros se insertaron realmente en cada tabla (los
 * duplicados por llave unica se descartan y se reportan como diferencia).
 */
export async function importarDatos(db: PrismaClient, datos: DatosPreparados): Promise<ConteoTablas> {
  return db.$transaction(
    async (tx) => {
      // Orden seguro respetando llaves foraneas: hijos antes que padres.
      await tx.alumnoGrupo.deleteMany();
      await tx.grupo.deleteMany();
      await tx.alumno.deleteMany();
      await tx.carrera.deleteMany();
      await tx.extraescolar.deleteMany();
      await tx.promotor.deleteMany();
      await tx.semestre.deleteMany();

      const opciones = { skipDuplicates: true } as const;
      const promotores = (await tx.promotor.createMany({ data: datos.promotores, ...opciones })).count;
      const extraescolares = (await tx.extraescolar.createMany({ data: datos.extraescolares, ...opciones }))
        .count;
      const semestres = (await tx.semestre.createMany({ data: datos.semestres, ...opciones })).count;
      const carreras = (await tx.carrera.createMany({ data: datos.carreras, ...opciones })).count;
      const alumnos = (await tx.alumno.createMany({ data: datos.alumnos, ...opciones })).count;
      const grupos = (await tx.grupo.createMany({ data: datos.grupos, ...opciones })).count;
      const inscripciones = (await tx.alumnoGrupo.createMany({ data: datos.inscripciones, ...opciones }))
        .count;

      return { promotores, extraescolares, semestres, carreras, alumnos, grupos, inscripciones };
    },
    { maxWait: 30_000, timeout: 10 * 60_000 }
  );
}

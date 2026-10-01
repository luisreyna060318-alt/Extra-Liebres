-- CreateEnum
CREATE TYPE "Sexo" AS ENUM ('MASCULINO', 'FEMENINO');

-- CreateEnum
CREATE TYPE "Campus" AS ENUM ('CAMPUS 1', 'CAMPUS 2');

-- CreateEnum
CREATE TYPE "DiaSemana" AS ENUM ('LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO');

-- CreateTable
CREATE TABLE "alumno" (
    "nocontrol" VARCHAR(11) NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "appaterno" VARCHAR(50) NOT NULL,
    "apmaterno" VARCHAR(50),
    "sexo" "Sexo",
    "idcarrera" TEXT NOT NULL,
    "campus" "Campus" NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumno_pkey" PRIMARY KEY ("nocontrol")
);

-- CreateTable
CREATE TABLE "carrera" (
    "idcarrera" VARCHAR(20) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carrera_pkey" PRIMARY KEY ("idcarrera")
);

-- CreateTable
CREATE TABLE "promotor" (
    "rfc" VARCHAR(13) NOT NULL,
    "nombre" VARCHAR(50) NOT NULL,
    "appaterno" VARCHAR(50) NOT NULL,
    "apmaterno" VARCHAR(50) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "promotor_pkey" PRIMARY KEY ("rfc")
);

-- CreateTable
CREATE TABLE "semestre" (
    "idsemestre" VARCHAR(6) NOT NULL,
    "mesinicio" VARCHAR(20) NOT NULL,
    "mestermino" VARCHAR(20) NOT NULL,
    "anio" VARCHAR(4) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "semestre_pkey" PRIMARY KEY ("idsemestre")
);

-- CreateTable
CREATE TABLE "extraescolar" (
    "idextraescolar" VARCHAR(20) NOT NULL,
    "nombreextra" VARCHAR(120) NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "extraescolar_pkey" PRIMARY KEY ("idextraescolar")
);

-- CreateTable
CREATE TABLE "grupo" (
    "idgrupo" VARCHAR(120) NOT NULL,
    "primerdia" "DiaSemana",
    "segundodia" "DiaSemana",
    "horainicio" VARCHAR(5),
    "horatermino" VARCHAR(5),
    "aula" VARCHAR(50),
    "idsemestre" TEXT,
    "idextraescolar" TEXT NOT NULL,
    "rfcpromotor" TEXT NOT NULL,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grupo_pkey" PRIMARY KEY ("idgrupo")
);

-- CreateTable
CREATE TABLE "alumnosgrupo" (
    "nocontrol" TEXT NOT NULL,
    "idgrupo" TEXT NOT NULL,
    "calificacion" SMALLINT NOT NULL,
    "desempeno" VARCHAR(20) NOT NULL,

    CONSTRAINT "alumnosgrupo_pkey" PRIMARY KEY ("nocontrol","idgrupo")
);

-- CreateIndex
CREATE INDEX "alumno_idcarrera_idx" ON "alumno"("idcarrera");

-- CreateIndex
CREATE UNIQUE INDEX "carrera_nombre_key" ON "carrera"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "extraescolar_nombreextra_key" ON "extraescolar"("nombreextra");

-- CreateIndex
CREATE INDEX "grupo_idextraescolar_idx" ON "grupo"("idextraescolar");

-- CreateIndex
CREATE INDEX "grupo_rfcpromotor_idx" ON "grupo"("rfcpromotor");

-- CreateIndex
CREATE INDEX "grupo_idsemestre_idx" ON "grupo"("idsemestre");

-- CreateIndex
CREATE INDEX "alumnosgrupo_idgrupo_idx" ON "alumnosgrupo"("idgrupo");

-- AddForeignKey
ALTER TABLE "alumno" ADD CONSTRAINT "alumno_idcarrera_fkey" FOREIGN KEY ("idcarrera") REFERENCES "carrera"("idcarrera") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_idsemestre_fkey" FOREIGN KEY ("idsemestre") REFERENCES "semestre"("idsemestre") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_idextraescolar_fkey" FOREIGN KEY ("idextraescolar") REFERENCES "extraescolar"("idextraescolar") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grupo" ADD CONSTRAINT "grupo_rfcpromotor_fkey" FOREIGN KEY ("rfcpromotor") REFERENCES "promotor"("rfc") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnosgrupo" ADD CONSTRAINT "alumnosgrupo_nocontrol_fkey" FOREIGN KEY ("nocontrol") REFERENCES "alumno"("nocontrol") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alumnosgrupo" ADD CONSTRAINT "alumnosgrupo_idgrupo_fkey" FOREIGN KEY ("idgrupo") REFERENCES "grupo"("idgrupo") ON DELETE CASCADE ON UPDATE CASCADE;

-- CheckConstraint
-- La escala de calificacion (0-4) se valida en Zod/servicio, pero tambien se
-- refuerza aqui a nivel de base de datos: nada que escriba directo a Postgres
-- (otro proceso, una correccion manual) puede dejar un valor fuera de rango.
ALTER TABLE "alumnosgrupo" ADD CONSTRAINT "calificacion_en_rango" CHECK ("calificacion" BETWEEN 0 AND 4);

-- Indices de texto (pg_trgm) para que las busquedas "contains"/ILIKE usadas
-- por los endpoints de listado no dependan de un sequential scan conforme
-- crezcan las tablas de alumno/promotor.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX "alumno_nombre_trgm_idx" ON "alumno" USING GIN ("nombre" gin_trgm_ops);
CREATE INDEX "alumno_appaterno_trgm_idx" ON "alumno" USING GIN ("appaterno" gin_trgm_ops);
CREATE INDEX "alumno_apmaterno_trgm_idx" ON "alumno" USING GIN ("apmaterno" gin_trgm_ops);

CREATE INDEX "promotor_nombre_trgm_idx" ON "promotor" USING GIN ("nombre" gin_trgm_ops);
CREATE INDEX "promotor_appaterno_trgm_idx" ON "promotor" USING GIN ("appaterno" gin_trgm_ops);
CREATE INDEX "promotor_apmaterno_trgm_idx" ON "promotor" USING GIN ("apmaterno" gin_trgm_ops);


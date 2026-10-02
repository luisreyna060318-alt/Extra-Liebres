import { Carrera } from "../carreras/types";

export type Sexo = "MASCULINO" | "FEMENINO";
export type Campus = "CAMPUS_1" | "CAMPUS_2";

export interface Alumno {
  nocontrol: string;
  nombre: string;
  appaterno: string;
  apmaterno?: string | null;
  sexo: Sexo | null;
  idcarrera: string;
  campus: Campus;
  carrera: Carrera;
}

export interface CreateAlumnoInput {
  nocontrol: string;
  nombre: string;
  appaterno: string;
  /** null = sin apellido materno. */
  apmaterno?: string | null;
  /** null = sin especificar. */
  sexo?: Sexo | null;
  idcarrera: string;
  campus: Campus;
}

export type UpdateAlumnoInput = Partial<Omit<CreateAlumnoInput, "nocontrol">>;

export interface FiltrosAlumnos {
  search?: string;
  idcarrera?: string;
  campus?: Campus;
  sexo?: Sexo;
}

import { Sexo } from "../alumnos/types";

export interface RosterAlumno {
  nocontrol: string;
  nombre: string;
  appaterno: string;
  apmaterno?: string | null;
  sexo: Sexo | null;
  calificacion: number;
  desempeno: string;
}

export interface RosterGrupo {
  idgrupo: string;
  total: number;
  estadisticasPorSexo: {
    masculino: { cantidad: number; porcentaje: number };
    femenino: { cantidad: number; porcentaje: number };
    sinEspecificar: { cantidad: number; porcentaje: number };
  };
  alumnos: RosterAlumno[];
}

export interface EnrollBatchInput {
  alumnos: { nocontrol: string; calificacion: number }[];
}

export interface UnenrollBatchInput {
  nocontrol: string[];
}

export type EstadoOperacion =
  | "agregado"
  | "ya_inscrito"
  | "no_existe"
  | "eliminado"
  | "no_inscrito";

export interface ResultadoOperacion {
  nocontrol: string;
  estado: EstadoOperacion;
}

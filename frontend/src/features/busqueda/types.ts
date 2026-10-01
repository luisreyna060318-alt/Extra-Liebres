import { Alumno } from "../alumnos/types";

export interface HistorialItem {
  idgrupo: string;
  extraescolar: string;
  promotor: string;
  semestre: string | null;
  calificacion: number;
  desempeno: string;
}

export interface HistorialAlumno {
  alumno: Alumno;
  historial: HistorialItem[];
}

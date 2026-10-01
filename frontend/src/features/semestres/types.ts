export type MesInicio = "ENERO" | "AGOSTO";
export type MesTermino = "JUNIO" | "DICIEMBRE";

export interface Semestre {
  idsemestre: string;
  mesinicio: string;
  mestermino: string;
  anio: string;
}

export interface CreateSemestreInput {
  mesinicio: MesInicio;
  mestermino: MesTermino;
  anio: string;
}

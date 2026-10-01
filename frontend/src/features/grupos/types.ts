import { Extraescolar } from "../extraescolares/types";
import { Promotor } from "../promotores/types";
import { Semestre } from "../semestres/types";

export type DiaSemana = "LUNES" | "MARTES" | "MIERCOLES" | "JUEVES" | "VIERNES" | "SABADO";

export interface Grupo {
  idgrupo: string;
  primerdia?: DiaSemana | null;
  segundodia?: DiaSemana | null;
  horainicio?: string | null;
  horatermino?: string | null;
  aula?: string | null;
  idsemestre?: string | null;
  idextraescolar: string;
  rfcpromotor: string;
  extraescolar: Extraescolar;
  promotor: Promotor;
  semestre: Semestre | null;
}

export interface CreateGrupoInput extends UpdateGrupoInput {
  idextraescolar: string;
  rfcpromotor: string;
  idsemestre: string;
}

/** null vacia el campo; un campo ausente no se modifica. */
export interface UpdateGrupoInput {
  primerdia?: DiaSemana | null;
  segundodia?: DiaSemana | null;
  horainicio?: string | null;
  horatermino?: string | null;
  aula?: string | null;
}

export interface GruposFiltros {
  search?: string;
  /** Filtro exacto por actividad. */
  idextraescolar?: string;
  /** Filtro exacto por promotor. */
  rfcpromotor?: string;
  anio?: string;
  page?: number;
  pageSize?: number;
}

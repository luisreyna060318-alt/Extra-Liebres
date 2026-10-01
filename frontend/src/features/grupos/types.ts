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

export interface CreateGrupoInput {
  idextraescolar: string;
  rfcpromotor: string;
  idsemestre: string;
  primerdia?: DiaSemana;
  segundodia?: DiaSemana;
  horainicio?: string;
  horatermino?: string;
  aula?: string;
}

export type UpdateGrupoInput = Partial<
  Pick<CreateGrupoInput, "primerdia" | "segundodia" | "horainicio" | "horatermino" | "aula">
>;

export interface GruposFiltros {
  search?: string;
  extraescolar?: string;
  promotor?: string;
  anio?: string;
  page?: number;
  pageSize?: number;
}

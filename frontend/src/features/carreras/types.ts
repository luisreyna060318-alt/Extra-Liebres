export interface Carrera {
  idcarrera: string;
  nombre: string;
}

export interface CreateCarreraInput {
  nombre: string;
}

export type UpdateCarreraInput = CreateCarreraInput;

export interface Promotor {
  rfc: string;
  nombre: string;
  appaterno: string;
  apmaterno: string;
}

export interface CreatePromotorInput {
  rfc: string;
  nombre: string;
  appaterno: string;
  apmaterno: string;
}

export type UpdatePromotorInput = Partial<Omit<CreatePromotorInput, "rfc">>;

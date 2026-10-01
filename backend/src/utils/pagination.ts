import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function calcularSkip(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

export function paginar<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  return { data, total, page, pageSize };
}

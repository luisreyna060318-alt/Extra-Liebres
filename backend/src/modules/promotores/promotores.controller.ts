import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as promotoresService from "./promotores.service";

export const listPromotores = asyncHandler(async (req: Request, res: Response) => {
  const { search, page, pageSize } = req.query as unknown as {
    search?: string;
    page: number;
    pageSize: number;
  };
  const resultado = await promotoresService.searchPromotores(search, page, pageSize);
  res.json(resultado);
});

export const getPromotor = asyncHandler(async (req: Request, res: Response) => {
  const promotor = await promotoresService.getPromotorByRfc(req.params.rfc);
  res.json(promotor);
});

export const createPromotor = asyncHandler(async (req: Request, res: Response) => {
  const promotor = await promotoresService.createPromotor(req.body);
  res.status(201).json(promotor);
});

export const updatePromotor = asyncHandler(async (req: Request, res: Response) => {
  const promotor = await promotoresService.updatePromotor(req.params.rfc, req.body);
  res.json(promotor);
});

export const deletePromotor = asyncHandler(async (req: Request, res: Response) => {
  const { confirmar } = req.query as unknown as { confirmar: boolean };
  await promotoresService.deletePromotor(req.params.rfc, confirmar);
  res.status(204).send();
});

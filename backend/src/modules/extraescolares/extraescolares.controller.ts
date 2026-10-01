import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as extraescolaresService from "./extraescolares.service";

export const listExtraescolares = asyncHandler(async (req: Request, res: Response) => {
  const { search, page, pageSize } = req.query as unknown as {
    search?: string;
    page: number;
    pageSize: number;
  };
  const resultado = await extraescolaresService.searchExtraescolares(search, page, pageSize);
  res.json(resultado);
});

export const getExtraescolar = asyncHandler(async (req: Request, res: Response) => {
  const extraescolar = await extraescolaresService.getExtraescolarById(
    req.params.idextraescolar
  );
  res.json(extraescolar);
});

export const createExtraescolar = asyncHandler(async (req: Request, res: Response) => {
  const extraescolar = await extraescolaresService.createExtraescolar(req.body);
  res.status(201).json(extraescolar);
});

export const updateExtraescolar = asyncHandler(async (req: Request, res: Response) => {
  const extraescolar = await extraescolaresService.updateExtraescolar(
    req.params.idextraescolar,
    req.body
  );
  res.json(extraescolar);
});

export const deleteExtraescolar = asyncHandler(async (req: Request, res: Response) => {
  const { confirmar } = req.query as unknown as { confirmar: boolean };
  await extraescolaresService.deleteExtraescolar(req.params.idextraescolar, confirmar);
  res.status(204).send();
});

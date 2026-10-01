import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as semestresService from "./semestres.service";

export const listSemestres = asyncHandler(async (req: Request, res: Response) => {
  const { search, page, pageSize } = req.query as unknown as {
    search?: string;
    page: number;
    pageSize: number;
  };
  const resultado = await semestresService.searchSemestres(search, page, pageSize);
  res.json(resultado);
});

export const getSemestre = asyncHandler(async (req: Request, res: Response) => {
  const semestre = await semestresService.getSemestreById(req.params.idsemestre);
  res.json(semestre);
});

export const createSemestre = asyncHandler(async (req: Request, res: Response) => {
  const semestre = await semestresService.createSemestre(req.body);
  res.status(201).json(semestre);
});

export const deleteSemestre = asyncHandler(async (req: Request, res: Response) => {
  const { confirmar } = req.query as unknown as { confirmar: boolean };
  await semestresService.deleteSemestre(req.params.idsemestre, confirmar);
  res.status(204).send();
});

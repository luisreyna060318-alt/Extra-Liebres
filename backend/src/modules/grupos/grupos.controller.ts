import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { FiltrosGrupos } from "./grupos.schema";
import * as gruposService from "./grupos.service";

export const listGrupos = asyncHandler(async (req: Request, res: Response) => {
  const resultado = await gruposService.searchGrupos(req.query as unknown as FiltrosGrupos);
  res.json(resultado);
});

export const getGrupo = asyncHandler(async (req: Request, res: Response) => {
  const grupo = await gruposService.getGrupoById(req.params.idgrupo);
  res.json(grupo);
});

export const createGrupo = asyncHandler(async (req: Request, res: Response) => {
  const grupo = await gruposService.createGrupo(req.body);
  res.status(201).json(grupo);
});

export const updateGrupo = asyncHandler(async (req: Request, res: Response) => {
  const grupo = await gruposService.updateGrupo(req.params.idgrupo, req.body);
  res.json(grupo);
});

export const deleteGrupo = asyncHandler(async (req: Request, res: Response) => {
  const { confirmar } = req.query as unknown as { confirmar: boolean };
  await gruposService.deleteGrupo(req.params.idgrupo, confirmar);
  res.status(204).send();
});

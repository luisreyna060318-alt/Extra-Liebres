import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as alumnosGrupoService from "./alumnosGrupo.service";

export const getRoster = asyncHandler(async (req: Request, res: Response) => {
  const roster = await alumnosGrupoService.getRosterConEstadisticas(req.params.idgrupo);
  res.json(roster);
});

export const enrollAlumnos = asyncHandler(async (req: Request, res: Response) => {
  const resultados = await alumnosGrupoService.inscribirAlumnos(req.params.idgrupo, req.body);
  res.status(201).json({ resultados });
});

export const unenrollAlumnos = asyncHandler(async (req: Request, res: Response) => {
  const resultados = await alumnosGrupoService.retirarAlumnos(req.params.idgrupo, req.body);
  res.json({ resultados });
});

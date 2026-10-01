import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as busquedaService from "./busqueda.service";

export const getHistorialAlumno = asyncHandler(async (req: Request, res: Response) => {
  const historial = await busquedaService.getHistorialExtraescolarDeAlumno(req.params.nocontrol);
  res.json(historial);
});

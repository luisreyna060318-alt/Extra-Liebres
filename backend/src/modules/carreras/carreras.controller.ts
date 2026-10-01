import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import * as carrerasService from "./carreras.service";

export const listCarreras = asyncHandler(async (req: Request, res: Response) => {
  const { search, page, pageSize } = req.query as unknown as {
    search?: string;
    page: number;
    pageSize: number;
  };
  const resultado = await carrerasService.searchCarreras(search, page, pageSize);
  res.json(resultado);
});

export const getCarrera = asyncHandler(async (req: Request, res: Response) => {
  const carrera = await carrerasService.getCarreraById(req.params.idcarrera);
  res.json(carrera);
});

export const createCarrera = asyncHandler(async (req: Request, res: Response) => {
  const carrera = await carrerasService.createCarrera(req.body);
  res.status(201).json(carrera);
});

export const updateCarrera = asyncHandler(async (req: Request, res: Response) => {
  const carrera = await carrerasService.updateCarrera(req.params.idcarrera, req.body);
  res.json(carrera);
});

export const deleteCarrera = asyncHandler(async (req: Request, res: Response) => {
  await carrerasService.deleteCarrera(req.params.idcarrera);
  res.status(204).send();
});

import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { generarCsv } from "../../utils/csv";
import * as alumnosService from "./alumnos.service";
import { FiltrosAlumnos } from "./alumnos.schema";

export const listAlumnos = asyncHandler(async (req: Request, res: Response) => {
  const { page, pageSize, ...filtros } = req.query as unknown as FiltrosAlumnos & {
    page: number;
    pageSize: number;
  };
  const resultado = await alumnosService.searchAlumnos(filtros, page, pageSize);
  res.json(resultado);
});

export const exportAlumnos = asyncHandler(async (req: Request, res: Response) => {
  const filtros = req.query as unknown as FiltrosAlumnos;
  const alumnos = await alumnosService.listAlumnosParaExportar(filtros);

  const csv = generarCsv(
    ["nocontrol", "nombre", "appaterno", "apmaterno", "sexo", "carrera", "campus"],
    alumnos.map((a) => ({
      nocontrol: a.nocontrol,
      nombre: a.nombre,
      appaterno: a.appaterno,
      apmaterno: a.apmaterno ?? "",
      sexo: a.sexo ?? "",
      carrera: a.carrera.nombre,
      campus: a.campus.replace("_", " "),
    }))
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="alumnos.csv"');
  res.send(csv);
});

export const getAlumno = asyncHandler(async (req: Request, res: Response) => {
  const alumno = await alumnosService.getAlumnoByNocontrol(req.params.nocontrol);
  res.json(alumno);
});

export const createAlumno = asyncHandler(async (req: Request, res: Response) => {
  const alumno = await alumnosService.createAlumno(req.body);
  res.status(201).json(alumno);
});

export const updateAlumno = asyncHandler(async (req: Request, res: Response) => {
  const alumno = await alumnosService.updateAlumno(req.params.nocontrol, req.body);
  res.json(alumno);
});

export const deleteAlumno = asyncHandler(async (req: Request, res: Response) => {
  const { confirmar } = req.query as unknown as { confirmar: boolean };
  await alumnosService.deleteAlumno(req.params.nocontrol, confirmar);
  res.status(204).send();
});

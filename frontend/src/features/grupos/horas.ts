/** Genera las opciones de hora "07:00".."21:00", igual que generarHoras() en el sistema original. */
export function generarOpcionesHora(): string[] {
  const horas: string[] = [];
  for (let hora = 7; hora <= 21; hora += 1) {
    horas.push(`${hora.toString().padStart(2, "0")}:00`);
  }
  return horas;
}

export const DIAS_SEMANA = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO"] as const;

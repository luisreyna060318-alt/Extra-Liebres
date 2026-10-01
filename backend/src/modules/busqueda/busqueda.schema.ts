import { z } from "zod";

export const nocontrolParamSchema = z.object({
  nocontrol: z
    .string()
    .trim()
    .regex(/^\d{1,10}$/, "El numero de control debe ser numerico (maximo 10 digitos)."),
});

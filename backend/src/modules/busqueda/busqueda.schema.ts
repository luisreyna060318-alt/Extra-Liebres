import { z } from "zod";
import { nocontrolSchema } from "../../utils/validaciones";

export const nocontrolParamSchema = z.object({
  nocontrol: nocontrolSchema,
});

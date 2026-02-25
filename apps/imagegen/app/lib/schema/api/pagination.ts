import { z, ZodObject } from "zod"

export const PaginationSchema = <T extends ZodObject>(itemSchema: T) => z.object({
  meta: z.object({
    offset: z.number(),
    pageSize: z.number(),
    total: z.number()
  }),
  items: z.array(itemSchema)
});


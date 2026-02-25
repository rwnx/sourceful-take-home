import z from "zod";
import { PaginationSchema } from "./pagination";
import { ProviderNameSchema } from "@/app/lib/providers/provider-types";


const GenerationsStatus = z.enum(["PENDING", "SUCCESS", "ERROR"])

export enum Animals {
  Wolf = "wolf",
  Cat = "cat",
  Chicken = "chicken",
  Deer = "deer",
  Hedgehog = "hedgehog",
  Owl = "owl",
  Warthog = "warthog",
  Pig = "pig",
  Tiger = "tiger",
  Turkey = "turkey",
  Pangolin = "pangolin",
  Frog = "frog"
}

export const AnimalSchema = z.enum(Animals)

export const GenerationSchema = z.object({
  jobId: z.string(),
  groupId: z.string(),
  createdAt: z.coerce.date(),
  status: GenerationsStatus,
  result: z.string().optional(),
  error: z.string().optional()
})

export type Generation = z.infer<typeof GenerationSchema>

export const GenerationsIndexResponseSchema = PaginationSchema(GenerationSchema);
export type GenerationsIndexResponse = z.infer<typeof GenerationsIndexResponseSchema>

export const GenerationsCreateInputSchema = z.object({
  numImages: z.number().min(0).max(10),
  animal: z.string(),
  provider: ProviderNameSchema.default("openai"),
})

export type GenerationsCreateInput = z.input<typeof GenerationsCreateInputSchema>

export const GenerationsCreateResponseSchema = z.array(GenerationSchema)

export type GenerationsCreateResponse = z.infer<typeof GenerationsCreateResponseSchema>

export const GenerationsIndexQuerySchema = z.object({
  offset: z.coerce.number().min(0),
  pageSize: z.coerce.number().min(0).max(25)
})

export type GenerationsIndexQuery = z.infer<typeof GenerationsIndexQuerySchema>

export const GenerationsGetLatestResponseSchema = z.object({
  data: z.coerce.date().nullable()
})

export type GenerationsGetLatestResponse = z.infer<typeof GenerationsGetLatestResponseSchema>

import z from "zod";

export const ProcessImageInputSchema = z.object({
  jobId: z.string(),
  prompt: z.string(),
  groupId: z.string(),
})

export type ProcessImageInput = z.infer<typeof ProcessImageInputSchema>
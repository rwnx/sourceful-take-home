import z from "zod"

const QStashCallbackPayloadSchema = z.object({
  status: z.number(),
  sourceMessageId: z.string(),
  body: z.string(),
  header: z.record(z.string(), z.array(z.string())).default({}),
})

export type QStashCallbackPayload = z.infer<typeof QStashCallbackPayloadSchema>

export type DecodedQStashCallbackPayload = QStashCallbackPayload & {
  upstreamBody: string
}

export const parseQStashCallbackPayload = (rawBody: string): DecodedQStashCallbackPayload => {
  const payload = QStashCallbackPayloadSchema.parse(JSON.parse(rawBody))
  return {
    ...payload,
    upstreamBody: Buffer.from(payload.body, "base64").toString("utf-8"),
  }
}

import z from "zod"
import { ImageGenerationProvider } from "./provider-types"

const OpenAIImageGenResponseSchema = z.object({
  created: z.number(),
  data: z.array(
    z.object({
      url: z.url().optional(),
      b64_json: z.string().optional(),
      revised_prompt: z.string().optional(),
    })
  ),
})


export const openaiProvider: ImageGenerationProvider = {
  name: "openai",
  getRequest(params) {
    const url = `${process.env.OPENAI_API_URL}/v1/images/generations`
    return {
      url,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: {
        prompt: params.prompt,
        model: "gpt-image-1",
        n: 1,
        size: "1024x1024",
        output_format: "jpeg"
      },
    }
  },
  parseQStashCallbackBody(upstreamBody) {
    try {
      const payload = JSON.parse(upstreamBody)
      const parsed = OpenAIImageGenResponseSchema.safeParse(payload)
      if (!parsed.success) {
        return { ok: false, error: "Unexpected OpenAI response shape" }
      }

      const imageB64 = parsed.data.data[0]?.b64_json
      const imageUrl = parsed.data.data[0]?.url
      if (!imageB64 && !imageUrl) {
        return { ok: false, error: "No image returned by OpenAI" }
      }

      if (imageB64) {
        return { ok: true, result: `data:image/jpeg;base64,${imageB64}` }
      }

      return { ok: true, result: imageUrl! }
    } catch {
      return { ok: false, error: "Failed to parse OpenAI callback body" }
    }
  },
}

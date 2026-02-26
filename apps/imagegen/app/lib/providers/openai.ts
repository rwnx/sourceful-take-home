import z from "zod"
import { ImageGenerationProvider, ProviderFileType, ProviderRequestParams } from "./provider-types"

const OpenAIImageGenResponseSchema = z.looseObject({
  created: z.number(),
  data: z.array(
    z.looseObject({
      b64_json: z.string(),
    })
  ),
})

/** https://developers.openai.com/api/reference/resources/images/methods/generate */
export class OpenAIProvider implements ImageGenerationProvider {
  readonly name = "openai"

  getRequest(params: ProviderRequestParams) {
    const url = `${process.env.OPENAI_API_URL}/v1/images/generations`
    return {
      url,
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: {
        prompt: params.prompt,
        model: "gpt-image-1-mini",
        n: 1,
        quality: "low",
        size: "1024x1024",
        output_format: "jpeg",
      },
    }
  }

  parseCallbackBody(upstreamBody: string) {
    try {
      const payload = JSON.parse(upstreamBody)
      const parsed = OpenAIImageGenResponseSchema.safeParse(payload)
      if (!parsed.success) {
        return { error: "Unexpected OpenAI response shape" }
      }

      return { data: parsed.data.data[0].b64_json, filetype: ProviderFileType.JPEG }
    } catch {
      return { error: "Failed to parse OpenAI callback body" }
    }
  }
}

export const openaiProvider = new OpenAIProvider()
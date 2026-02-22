import OpenAI from "openai"
import { ImageApiProvider, GenerateOptions } from "../types"
import { error } from "console"


export class OpenAIImageGenerator implements ImageApiProvider {
  private client: OpenAI
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    })
  }

  async image(options: GenerateOptions) {
    let result: OpenAI.Images.ImagesResponse
    try {
      result = await this.client.images.generate({
        prompt: options.prompt,
        model: "gpt-image-1",
        n: 1,
        size: "1024x1024",
        quality: "medium"
      })
    } catch (e) {
      if (e instanceof Error) {
        return { error: e.message }
      } else {
        return { error: JSON.stringify(e) }
      }
    }

    const data = result.data?.[0].b64_json!

    if (!data) return {
      error: "missing image data in response"
    }

    return { data: `data:image/png;base64,${data}` }
  }
}
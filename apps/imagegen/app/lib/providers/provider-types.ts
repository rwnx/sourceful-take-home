import z from "zod"

export const ProviderNameSchema = z.enum(["openai"])
export type ProviderName = z.infer<typeof ProviderNameSchema>

export type ProviderRequestParams = {
  prompt: string
  jobId: string
}

export type ProviderRequest = {
  url: string
  headers: Record<string, string>
  body: unknown
}

export type ProviderCallbackParseResult =
  | { ok: true; result: string }
  | { ok: false; error: string }

export interface ImageGenerationProvider {
  name: ProviderName
  getRequest(params: ProviderRequestParams): ProviderRequest
  parseQStashCallbackBody(upstreamBody: string): ProviderCallbackParseResult
}

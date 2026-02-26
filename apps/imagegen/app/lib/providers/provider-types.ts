import z from "zod"

export const ProviderNameSchema = z.enum(["openai"])
export type ProviderName = z.infer<typeof ProviderNameSchema>

export enum ProviderFileType {
  JPEG
}

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
  | { data: string, filetype: ProviderFileType, error?: undefined }
  | { data?: undefined, filetype?: undefined, error: string }

export interface ImageGenerationProvider {
  name: ProviderName
  getRequest(params: ProviderRequestParams): ProviderRequest
  parseCallbackBody(upstreamBody: string): ProviderCallbackParseResult
}

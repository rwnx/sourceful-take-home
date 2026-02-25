import { openaiProvider } from "./openai"
import { ImageGenerationProvider, ProviderName } from "./provider-types"

const providers: Record<ProviderName, ImageGenerationProvider> = {
  openai: openaiProvider,
}

export const DEFAULT_PROVIDER: ProviderName = "openai"

export const getImageGenerationProvider = (name: ProviderName): ImageGenerationProvider => {
  return providers[name]
}

export * from "./provider-types"

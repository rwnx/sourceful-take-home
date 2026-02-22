export type GenerateOptions = {
  prompt: string,
}
export type GenerateError = {
  error: string
  data: undefined
}
export type GenerateSuccess = {
  data: string
  error: undefined
}

export type GenerateResult = GenerateSuccess | GenerateError
export interface ImageApiProvider {
  image: (options: GenerateOptions) => Promise<GenerateResult>
}
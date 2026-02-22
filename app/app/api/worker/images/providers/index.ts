import { ImageApiProvider } from "../types";
import { OpenAIImageGenerator } from "./openai"

const getImageProvider = (provider: "openai" | "sourceful"): ImageApiProvider => {
  if (provider === "openai") {
    return new OpenAIImageGenerator()
  } else {
    throw new Error("unknown image api selected")
  }
}

export default getImageProvider;
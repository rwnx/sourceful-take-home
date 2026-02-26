import axios, { Axios } from "axios";
import {
  GenerationsCreateInput,
  GenerationsCreateResponseSchema,
  GenerationsGetLatestResponseSchema,
  GenerationsIndexQuery,
  GenerationsIndexResponseSchema,
} from "@/app/lib/schema/api";

class PublicApi {
  private client: Axios
  constructor() {
    this.client = axios.create({
      baseURL: `/api`,
      headers: {
        Accept: "application/json"
      }
    })
  }

  async createGeneration(data: GenerationsCreateInput) {
    const response = await this.client.post("/generations", data)
    return GenerationsCreateResponseSchema.parse(response.data)
  }

  async listGenerations(params: GenerationsIndexQuery) {
    const response = await this.client.get("/generations", { params });
    return GenerationsIndexResponseSchema.parse(response.data)
  }

  async getLatestGenerationUpdatedAt() {
    const response = await this.client.get("/generations/latest")
    return GenerationsGetLatestResponseSchema.parse(response.data).data
  }
}

const api = new PublicApi()


export default api;

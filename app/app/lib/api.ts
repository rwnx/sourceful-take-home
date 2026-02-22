import axios, { Axios, AxiosResponse } from "axios";
import { GenerationsCreateInput, GenerationsCreateResponseSchema, GenerationsIndexQuery, GenerationsIndexResponseSchema } from "../api/generations/schema";

class PublicApi {
  private client: Axios
  constructor() {
    this.client = axios.create({
      baseURL: `${process.env.NEXT_PUBLIC_URL}/api`,
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
}

const api = new PublicApi()


export default api;
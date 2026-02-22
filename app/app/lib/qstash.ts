import "server-only";
import { Client } from "@upstash/qstash"

const client = new Client({ baseUrl: process.env.QSTASH_URL, token: process.env.QSTASH_TOKEN })

export default client;
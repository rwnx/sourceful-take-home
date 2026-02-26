import dotenv from "dotenv"
const NODE_ENV = process.env.NODE_ENV || "development";

dotenv.config({ path: [ `.env.${NODE_ENV}`, '.env'] })

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL
  },
});

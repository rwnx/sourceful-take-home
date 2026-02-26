import type { NextConfig } from "next";
import z from "zod";

export const EnvSchema = z.looseObject({
  DATABASE_URL: z.url(),
  OPENAI_API_KEY: z.string(),
  OPENAI_API_URL: z.url().optional(),
  QSTASH_URL: z.url(),
  QSTASH_TOKEN: z.string(),
  QSTASH_CURRENT_SIGNING_KEY: z.string(),
  QSTASH_NEXT_SIGNING_KEY: z.string(),
  NEXT_PUBLIC_URL: z.url(),
  NEXT_PUBLIC_ORG_ID: z.string(),
  NEXT_PUBLIC_CLIENT_ID: z.string(),
})

const parsedEnv = EnvSchema.safeParse(process.env)

// Kill build/startup if env isnt setup correctly
if (parsedEnv.error) {
  console.error("❌ Environment Error:", parsedEnv.error.issues.map(x => `${x.path}: ${x.message}`))
  process.exit(1)
}

// Although we parse the env here, the output type is always string if required and string|undefined if optional
type ParsedProcessEnv = { [K in keyof z.infer<typeof EnvSchema>]: undefined extends z.infer<typeof EnvSchema>[K] ? string | undefined : string }

declare global {
  namespace NodeJS {
    interface ProcessEnv extends ParsedProcessEnv {}
  }
}

const nextConfig: NextConfig = {
};

export default nextConfig;

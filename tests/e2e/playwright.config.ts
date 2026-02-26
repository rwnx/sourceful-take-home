import { defineConfig, devices } from "@playwright/test";
import {config} from "dotenv"
import z from "zod";

export const EnvSchema = z.looseObject({
  E2E_BASE_URL: z.url(),
  E2E_USER_EMAIL: z.string(),
  E2E_USER_PASSWORD: z.string()
})

config({path: [`.env.local`, `.env.${process.env.NODE_ENV || 'development'}`, `.env` ]})

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

export default defineConfig({
  testDir: ".",
  testMatch: ["tests/*.e2e.spec.ts"],
  timeout: 120_000,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL,
    headless: true,
    video: "on",
    trace: "on",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        channel: "chrome",
      },
    },
  ],
  outputDir: "test-results",
});

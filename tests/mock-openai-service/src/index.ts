import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { z } from "zod";

const port = Number(process.env.PORT ?? 8787);
const host = "127.0.0.1";
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.resolve(moduleDir, "..", "images");
const delay = (timeout: number) => new Promise((resolve) => {
  setTimeout(resolve, timeout)
})

const supportedImageFile = /\.(jpg|jpeg)$/i;

const imageRequestSchema = z
  .object({
    prompt: z.string().min(1),
    model: z.string().optional(),
    n: z.number().int().positive().max(10).optional(),
    size: z.string().optional(),
    output_format: z.enum(["jpeg"]).optional(),
  })
  .loose();

const pickRandomImageB64 = async () => {
  let entries;
  try {
    entries = await fs.readdir(imagesDir, { withFileTypes: true });
  } catch {
    return { ok: false as const, error: `Images folder not found: ${imagesDir}` };
  }

  const files = entries
    .filter((entry) => entry.isFile() && supportedImageFile.test(entry.name))
    .map((entry) => path.join(imagesDir, entry.name));

  if (files.length === 0) {
    return { ok: false as const, error: `No .jpg/.jpeg files found in ${imagesDir}` };
  }

  const chosen = files[Math.floor(Math.random() * files.length)];
  const imageBuffer = await fs.readFile(chosen);
  return { ok: true as const, b64: imageBuffer.toString("base64"), file: path.basename(chosen) };
};

const app = new Hono();

app.use("*", async (c, next) => {
  await next();
  console.log(`${c.req.method} ${c.req.path} -> ${c.res.status}`);
});

app.get("/", (c) => {
  return c.json({ message: "mock openai service is running!" }, 200);
});

app.post("/v1/images/generations", async (c) => {
  const rawBody = await c.req.text();
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const parsed = imageRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return c.json({ error: "Invalid request payload", issues: parsed.error.flatten() }, 400);
  }

  const randomImage = await pickRandomImageB64();
  if (!randomImage.ok) {
    return c.json({ error: randomImage.error }, 500);
  }
  
  await delay(Math.round(Math.random()*10_000))

  return c.json({
    created: Math.floor(Date.now() / 1000),
    data: [{ b64_json: randomImage.b64, revised_prompt: `mock:${randomImage.file}` }],
  }, 200);
});

app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

serve({ fetch: app.fetch, port, hostname: host }, () => {
  console.log(`Mock OpenAI image service listening on http://${host}:${port}`);
});

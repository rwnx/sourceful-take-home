import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { once } from "node:events";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");

const AUTH_USER_ID_HEADER = "x-auth-user-id";
const AUTH_PAYLOAD_HEADER = "x-auth-payload";

const authHeaders = (userId = "integration-test-user") => ({
  [AUTH_USER_ID_HEADER]: userId,
  [AUTH_PAYLOAD_HEADER]: JSON.stringify({ sub: userId, email: `${userId}@example.com` }),
});

const runCommand = (cmd, args, options = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { ...options, stdio: "pipe" });
    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += String(chunk);
    });
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed (${cmd} ${args.join(" ")}):\n${stdout}\n${stderr}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });

const getFreePort = async () => {
  const server = createServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  const port = address && typeof address === "object" ? address.port : null;
  server.close();
  if (!port) throw new Error("Could not allocate free port");
  return port;
};

const waitForApiReady = async (baseUrl, headers, timeoutMs = 60_000) => {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${baseUrl}/api/generations/latest`, { headers });
      if (res.ok) return;
    } catch {
      // server is not ready yet
    }
    await sleep(500);
  }
  throw new Error(`API did not become ready within ${timeoutMs}ms`);
};

let qstashServer;
let appProcess;
let baseUrl;
let qstashRequestCount = 0;

before(async () => {
  const appPort = await getFreePort();
  const qstashPort = await getFreePort();
  baseUrl = `http://127.0.0.1:${appPort}`;

  qstashServer = createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end("[]");
      return;
    }

    qstashRequestCount += 1;

    let body = "";
    for await (const chunk of req) {
      body += String(chunk);
    }

    let parsed = [];
    try {
      parsed = JSON.parse(body);
    } catch {
      parsed = [];
    }

    const count = Array.isArray(parsed) ? parsed.length : 1;
    const response = Array.from({ length: count }, (_, i) => ({
      messageId: `msg-${Date.now()}-${i}`,
    }));

    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify(response));
  });

  qstashServer.listen(qstashPort, "127.0.0.1");
  await once(qstashServer, "listening");

  const env = {
    ...process.env,
    NODE_ENV: "test",
    DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/myapp",
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "test-openai-api-key",
    QSTASH_URL: `http://127.0.0.1:${qstashPort}`,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN ?? "test-qstash-token",
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY ?? "sig_test_current",
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY ?? "sig_test_next",
    CLIENT_ID: process.env.CLIENT_ID ?? "test-client-id",
    CLIENT_SECRET: process.env.CLIENT_SECRET ?? "test-client-secret",
    NEXT_PUBLIC_URL: baseUrl,
    NEXT_PUBLIC_ORG_ID: process.env.NEXT_PUBLIC_ORG_ID ?? "test-org-id",
    NEXT_PUBLIC_CLIENT_ID: process.env.NEXT_PUBLIC_CLIENT_ID ?? "test-public-client-id",
    LOG_LEVEL: "silent",
  };

  await runCommand("pnpm", ["--filter", "imagegen", "db", "migrate", "deploy"], {
    cwd: repoRoot,
    env,
  });

  appProcess = spawn("pnpm", ["--filter", "imagegen", "dev", "--port", String(appPort)], {
    cwd: repoRoot,
    env,
    stdio: "pipe",
  });

  await waitForApiReady(baseUrl, authHeaders());
});

after(async () => {
  if (appProcess && !appProcess.killed) {
    appProcess.kill("SIGTERM");
  }
  if (qstashServer) {
    await new Promise((resolve) => qstashServer.close(resolve));
  }
});

test("POST /api/generations enqueues jobs and GET endpoints expose them", async () => {
  const headers = {
    ...authHeaders(),
    "content-type": "application/json",
  };

  const beforeRes = await fetch(`${baseUrl}/api/generations?offset=0&pageSize=25`, {
    headers,
  });
  assert.equal(beforeRes.status, 200);
  const beforeJson = await beforeRes.json();
  const totalBefore = beforeJson.meta.total;

  const createRes = await fetch(`${baseUrl}/api/generations`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      numImages: 2,
      animal: "cat",
      provider: "openai",
    }),
  });
  assert.equal(createRes.status, 200);
  const created = await createRes.json();

  assert.equal(Array.isArray(created), true);
  assert.equal(created.length, 2);
  assert.equal(created[0].status, "PENDING");
  assert.equal(created[1].status, "PENDING");
  assert.equal(created[0].groupId, created[1].groupId);
  assert.ok(created[0].jobId);
  assert.ok(created[1].jobId);

  const listRes = await fetch(`${baseUrl}/api/generations?offset=0&pageSize=25`, {
    headers,
  });
  assert.equal(listRes.status, 200);
  const list = await listRes.json();

  assert.ok(list.meta.total >= totalBefore + 2);
  const jobIds = new Set(list.items.map((item) => item.jobId));
  assert.equal(jobIds.has(created[0].jobId), true);
  assert.equal(jobIds.has(created[1].jobId), true);

  const latestRes = await fetch(`${baseUrl}/api/generations/latest`, {
    headers,
  });
  assert.equal(latestRes.status, 200);
  const latest = await latestRes.json();
  assert.ok(latest.data);
  assert.equal(Number.isNaN(new Date(latest.data).getTime()), false);

  assert.ok(qstashRequestCount > 0);
});

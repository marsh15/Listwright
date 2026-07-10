import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";

const apiPort = Number(process.env.E2E_API_PORT ?? 4000);
const webPort = Number(process.env.E2E_WEB_PORT ?? 3100);
const apiBaseUrl = `http://127.0.0.1:${apiPort}`;
const webBaseUrl = `http://127.0.0.1:${webPort}`;
const playwrightCli = process.env.PLAYWRIGHT_CLI ?? "playwright-cli";
const children = [];

try {
  buildForE2e();
  start("node", ["apps/api/dist/index.js"], {
    PORT: String(apiPort),
    CORS_ORIGIN: `${webBaseUrl}/`,
  });
  start("node", ["node_modules/next/dist/bin/next", "start", "apps/web", "-p", String(webPort)], {
    NEXT_PUBLIC_API_BASE_URL: apiBaseUrl,
  });

  await Promise.all([
    waitForUrl(`${apiBaseUrl}/health`),
    waitForUrl(webBaseUrl),
  ]);

  await runCli(["close"], { allowFailure: true });
  await runCli(["open", webBaseUrl]);
  const raw = await runCli([
    "run-code",
    `async page => {
      await page.getByRole("button", { name: /Load Mixed leads/i }).click();
      await page.getByRole("button", { name: /Confirm import/i }).click();
      await page.waitForFunction(() => /completed|partial failed|failed/.test(document.body.innerText.toLowerCase()), null, { timeout: 15000 });
      await page.getByRole("tab", { name: /Exports/i }).click();
      const exportsPanel = page.getByRole("tabpanel", { name: /Exports/i });
      const csvHref = await exportsPanel.getByRole("link", { name: /Export CSV/i }).getAttribute("href");
      const jsonHref = await exportsPanel.getByRole("link", { name: /Export JSON/i }).getAttribute("href");
      const body = await page.locator("body").innerText();
      return JSON.stringify({ title: await page.title(), csvHref, jsonHref, body });
    }`,
  ]);
  await runCli(["close"], { allowFailure: true });

  const result = parseLastJson(raw);
  assert.equal(result.title, "Listwright");
  assert.match(result.body, /Inspect your source file/);
  assert.match(result.body, /Parsed records/);
  assert.match(result.csvHref, /export\.csv$/);
  assert.match(result.jsonHref, /export\.json$/);
  console.log("Sample browser flow passed");
} finally {
  await runCli(["close"], { allowFailure: true }).catch(() => undefined);
  await stopChildren();
}

function buildForE2e() {
  const result = spawnSync("npm", ["run", "build"], {
    env: { ...process.env, NEXT_PUBLIC_API_BASE_URL: apiBaseUrl },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Production build failed with exit code ${result.status ?? "unknown"}`);
}

function start(command, args, env) {
  const child = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ["ignore", "pipe", "pipe"],
  });
  children.push(child);
  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  child.on("exit", (code, signal) => {
    if (signal === "SIGTERM" || code === 143) return;
    if (code && code !== 0) {
      console.error(`${command} ${args.join(" ")} exited with ${code}${signal ? ` (${signal})` : ""}`);
    }
  });
  return child;
}

async function waitForUrl(url) {
  const started = Date.now();
  while (Date.now() - started < 30000) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await delay(250);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function runCli(args, options = {}) {
  const output = await collect(playwrightCli, args, {
    env: process.env,
    allowFailure: options.allowFailure,
  });
  return output.stdout + output.stderr;
}

function collect(command, args, options) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        reject(new Error(`Could not find browser CLI "${command}". Set PLAYWRIGHT_CLI to a playwright-cli compatible executable.`));
        return;
      }
      reject(error);
    });
    child.on("close", (code) => {
      if (code && code !== 0 && !options.allowFailure) {
        reject(new Error(`${command} ${args.join(" ")} failed with ${code}\n${stdout}\n${stderr}`));
        return;
      }
      resolve({ stdout, stderr });
    });
  });
}

function parseLastJson(output) {
  const resultBlock = output.match(/### Result\s*\n([\s\S]*?)(?:\n###|\n?$)/);
  if (resultBlock?.[1]) {
    const parsed = JSON.parse(resultBlock[1].trim());
    return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
  }

  const matches = [...output.matchAll(/\{[\s\S]*?\}/g)];
  for (const match of matches.reverse()) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // Keep looking for the JSON value returned by run-code.
    }
  }
  throw new Error(`Browser flow did not return JSON.\n${output}`);
}

async function stopChildren() {
  await Promise.all(children.map((child) => new Promise((resolve) => {
    if (child.exitCode !== null || child.signalCode) {
      resolve();
      return;
    }
    child.once("exit", resolve);
    child.kill("SIGTERM");
  })));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

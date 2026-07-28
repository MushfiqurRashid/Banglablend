import { spawn, spawnSync } from "node:child_process";
import { connect } from "node:net";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const forwardedArgs = process.argv.slice(2);
const playwrightCli = resolve(root, "node_modules/@playwright/test/cli.js");
const externalBaseUrl = process.env.E2E_BASE_URL;

function runPlaywright(baseUrl) {
  return spawn(process.execPath, [playwrightCli, "test", ...forwardedArgs], {
    cwd: root,
    env: { ...process.env, E2E_BASE_URL: baseUrl },
    stdio: "inherit"
  });
}

function canConnect(port, timeout = 500) {
  return new Promise((resolveConnection) => {
    const socket = connect({ host: "127.0.0.1", port });
    const finish = (connected) => {
      socket.destroy();
      resolveConnection(connected);
    };
    socket.setTimeout(timeout);
    socket.once("connect", () => finish(true));
    socket.once("timeout", () => finish(false));
    socket.once("error", () => finish(false));
  });
}

async function waitForPort(port, server, timeout = 120_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`The storefront test server exited with code ${server.exitCode}.`);
    if (await canConnect(port)) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`The storefront test server did not become ready on port ${port}.`);
}

function stopProcessTree(child) {
  if (!child?.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
    return;
  }
  try {
    process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
}

if (externalBaseUrl) {
  const tests = runPlaywright(externalBaseUrl);
  tests.once("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
} else {
  const port = Number.parseInt(process.env.E2E_PORT ?? "3010", 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("E2E_PORT must be a valid TCP port.");
  if (await canConnect(port)) throw new Error(`Port ${port} is already in use. Stop that service or set E2E_PORT to another port.`);

  const nextCli = resolve(root, "apps/storefront/node_modules/next/dist/bin/next");
  const server = spawn(process.execPath, [nextCli, "dev", "apps/storefront", "--turbopack", "--port", String(port)], {
    cwd: root,
    detached: process.platform !== "win32",
    env: {
      ...process.env,
      ENABLE_DEVELOPMENT_FALLBACKS: "true",
      MEDUSA_COD_ENABLED: "true",
      SSLCOMMERZ_ENABLED: "true"
    },
    stdio: "ignore"
  });

  const stop = () => stopProcessTree(server);
  process.once("SIGINT", () => { stop(); process.exit(130); });
  process.once("SIGTERM", () => { stop(); process.exit(143); });

  try {
    await waitForPort(port, server);
    const tests = runPlaywright(`http://localhost:${port}`);
    const exitCode = await new Promise((resolveExit) => tests.once("exit", (code, signal) => resolveExit(code ?? (signal ? 1 : 0))));
    stop();
    process.exit(exitCode);
  } catch (error) {
    stop();
    throw error;
  }
}

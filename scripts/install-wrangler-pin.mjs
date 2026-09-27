import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
let packageJsonPath;
try {
  packageJsonPath = require.resolve("wrangler/package.json");
} catch {
  console.log("wrangler is not installed; skipping worker pin");
  process.exit(0);
}

const binPath = join(dirname(packageJsonPath), "bin", "wrangler.js");
const current = readFileSync(binPath, "utf8");
const marker = "nkdon-pin-cloudflare-worker";
if (current.includes(marker)) {
  console.log("wrangler already pins the worker binding");
  process.exit(0);
}

const wrapper = `#!/usr/bin/env node
// ${marker}
const { spawnSync } = require("child_process");
const { existsSync } = require("fs");
const path = require("path");

const pin = path.resolve(process.cwd(), "scripts/pin-cloudflare-worker.mjs");
if (existsSync(pin)) {
  const pinned = spawnSync(process.execPath, [pin], { stdio: "inherit" });
  if (pinned.status !== 0) process.exit(pinned.status === null ? 1 : pinned.status);
}

const cli = path.join(__dirname, "../wrangler-dist/cli.js");
const result = spawnSync(process.execPath, ["--no-warnings", cli, ...process.argv.slice(2)], {
  stdio: "inherit",
});
process.exit(result.status === null ? 1 : result.status);
`;

writeFileSync(binPath, wrapper);
console.log("wrangler deploy now rewrites WORKER_SELF_REFERENCE before reading config");

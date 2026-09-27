import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const workerName = "nk-don-tracking";
const previousPackageName = ["nkdon", "global", "logistics"].join("-");
const root = process.cwd();
const configPath = join(root, "wrangler.json");
const config = JSON.parse(readFileSync(configPath, "utf8"));
const service = config.services?.find((item) => item.binding === "WORKER_SELF_REFERENCE")?.service;

if (config.name !== workerName || service !== workerName) {
  console.error(`wrangler.json resolved name=${config.name} self-reference=${service}`);
  process.exit(1);
}
if (existsSync(join(root, "wrangler.jsonc")) || existsSync(join(root, "wrangler.toml"))) {
  console.error("A second Wrangler config is present and can override wrangler.json");
  process.exit(1);
}

function walk(dir, hits) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(path, hits);
      continue;
    }
    if (!entry.isFile()) continue;
    let size = 0;
    try {
      size = statSync(path).size;
    } catch {
      continue;
    }
    if (size > 20_000_000) continue;
    const data = readFileSync(path);
    if (data.includes(previousPackageName)) hits.push(path);
  }
}

const hits = [];
for (const dir of [".next", ".open-next", ".wrangler"]) walk(join(root, dir), hits);
if (hits.length) {
  console.error("stale worker name remains in generated output:");
  for (const hit of hits) console.error(hit);
  process.exit(1);
}

console.log(`verified worker=${config.name} self-reference=${service} generated-output=clean`);

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const workerName = "nk-don-tracking";
const staleName = "nkdon-global-logistics";
const root = process.cwd();
const canonicalPath = join(root, "wrangler.json");

const canonical = {
  $schema: "node_modules/wrangler/config-schema.json",
  name: workerName,
  main: ".open-next/worker.js",
  compatibility_date: "2024-12-30",
  compatibility_flags: ["nodejs_compat", "global_fetch_strictly_public"],
  assets: { directory: ".open-next/assets", binding: "ASSETS" },
  services: [{ binding: "WORKER_SELF_REFERENCE", service: workerName }],
};

writeFileSync(canonicalPath, `${JSON.stringify(canonical, null, 2)}\n`);

function walk(dir, out = []) {
  let entries = [];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".git" || entry.name === ".next") continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (/^wrangler\.(json|jsonc|toml)$/.test(entry.name) && path !== canonicalPath) out.push(path);
  }
  return out;
}

for (const path of walk(root)) {
  const text = readFileSync(path, "utf8");
  if (!text.includes(staleName)) continue;
  writeFileSync(path, text.replaceAll(staleName, workerName));
}

const resolved = JSON.parse(readFileSync(canonicalPath, "utf8"));
const service = resolved.services.find((item) => item.binding === "WORKER_SELF_REFERENCE").service;
if (resolved.name !== workerName || service !== workerName || JSON.stringify(resolved).includes(staleName)) {
  console.error("Cloudflare worker binding was not pinned to nk-don-tracking");
  process.exit(1);
}
console.log(`worker=${resolved.name} self-reference=${service}`);

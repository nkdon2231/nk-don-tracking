import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const workerName = "nk-don-tracking";
const root = process.cwd();
const canonicalPath = join(root, "wrangler.json");

rmSync(join(root, ".next", "cache"), { recursive: true, force: true });

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

const packageJsonPath = join(root, "package.json");
if (existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  if (packageJson.name !== workerName) {
    packageJson.name = workerName;
    writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  }
}

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
    else if (/^wrangler\.(json|jsonc|toml)$/.test(entry.name)) out.push(path);
  }
  return out;
}

for (const path of walk(root)) {
  if (path === canonicalPath) continue;
  rmSync(path, { force: true });
}

const resolved = JSON.parse(readFileSync(canonicalPath, "utf8"));
const service = resolved.services.find((item) => item.binding === "WORKER_SELF_REFERENCE").service;
if (resolved.name !== workerName || service !== workerName) {
  console.error("Cloudflare worker binding was not pinned to nk-don-tracking");
  process.exit(1);
}
console.log(`worker=${resolved.name} self-reference=${service}`);

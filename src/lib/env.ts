import "server-only";

// Server-only configuration. Do not import this file from client components.
// Values are never logged. Names match the Vercel Supabase integration and the
// variables already set on the NKDON Vercel project. Dynamic reads stay at
// runtime so secrets are not inlined into the client bundle.

function read(name: string) {
  const value = process.env[name]?.trim();
  return value || "";
}

function first(names: readonly string[]) {
  for (const name of names) {
    const value = read(name);
    if (value) return { name, value };
  }
  return { name: "", value: "" };
}

function stripPgbouncer(value: string) {
  return value.replace(/([?&])pgbouncer=(?:true|1)&/gi, "$1").replace(/[?&]pgbouncer=(?:true|1)$/i, "");
}

function describeConnection(value: string) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    const port = url.port || "5432";
    const hostKind = host.includes("pooler") ? "pooler" : host.startsWith("db.") ? "direct" : "other";
    let score = 2;
    if (port === "6543" || url.searchParams.has("pgbouncer")) score = 1;
    else if (hostKind === "pooler") score = 3;
    return { port, hostKind, score };
  } catch {
    const pooled = /:6543\b|pgbouncer=true/i.test(value);
    const session = /pooler/i.test(value) && !pooled;
    return { port: pooled ? "6543" : "5432", hostKind: session || pooled ? "pooler" : "other", score: session ? 3 : pooled ? 1 : 2 };
  }
}

export type DatabaseCandidate = {
  source: string;
  url: string;
  port: string;
  hostKind: string;
  score: number;
};

export function databaseCandidates(): DatabaseCandidate[] {
  const seen = new Set<string>();
  const items: DatabaseCandidate[] = [];
  for (const name of DATABASE_NAMES) {
    const value = read(name);
    if (!value || seen.has(value)) continue;
    seen.add(value);
    const described = describeConnection(value);
    items.push({ source: name, url: stripPgbouncer(value), port: described.port, hostKind: described.hostKind, score: described.score });
  }
  items.sort((left, right) => right.score - left.score);
  return items;
}

export function databaseConfig() {
  const [best] = databaseCandidates();
  if (!best) return { source: "", url: "" };
  return { source: best.source, url: best.url };
}

const DATABASE_NAMES = ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING", "POSTGRES_PRISMA_URL"] as const;
const SUPABASE_URL_NAMES = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;
const PUBLISHABLE_KEY_NAMES = [
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_PUBLISHABLE_KEY",
] as const;
const SECRET_KEY_NAMES = ["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SECRET_KEY"] as const;

export function databaseUrl() {
  return databaseConfig().url;
}

export function supabaseUrl() {
  return first(SUPABASE_URL_NAMES).value.replace(/\/$/, "");
}

export function supabasePublishableKey() {
  return first(PUBLISHABLE_KEY_NAMES).value;
}

export function supabaseSecretKey() {
  return first(SECRET_KEY_NAMES).value;
}

export function setupToken() {
  return read("SETUP_TOKEN");
}

export function publicSiteUrl() {
  const explicit = read("NEXT_PUBLIC_SITE_URL").replace(/\/$/, "");
  if (explicit) return explicit;
  const production = read("VERCEL_PROJECT_PRODUCTION_URL").replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (production) return `https://${production}`;
  const preview = read("VERCEL_URL").replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (preview) return `https://${preview}`;
  return "";
}

export function supabaseStorageConfigured() {
  return Boolean(supabaseUrl() && supabaseSecretKey());
}

export function supabaseAuthConfigured() {
  return Boolean(supabaseUrl() && supabasePublishableKey());
}

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

function cleanDatabaseUrl(value: string) {
  try {
    const url = new URL(value);
    url.searchParams.delete("pgbouncer");
    return url.toString();
  } catch {
    return value;
  }
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

export function databaseConfig() {
  const found = first(DATABASE_NAMES);
  return { source: found.name, url: found.value ? cleanDatabaseUrl(found.value) : "" };
}

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

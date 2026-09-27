/**
 * Resolve environment variables from the names this repo documents
 * and the aliases Vercel + the official Supabase integration inject.
 * Never log values from this module.
 */
function first(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function databaseUrl() {
  return first(
    "DATABASE_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL",
    "POSTGRES_URL_NON_POOLING",
    "SUPABASE_DB_URL",
  );
}

export function supabaseUrl() {
  return first("NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL").replace(/\/$/, "");
}

export function supabaseAnonKey() {
  return first("NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");
}

export function supabaseServiceRoleKey() {
  return first("SUPABASE_SERVICE_ROLE_KEY");
}

export function setupToken() {
  return first("SETUP_TOKEN");
}

export function siteUrl() {
  const explicit = first("NEXT_PUBLIC_SITE_URL");
  if (explicit) return explicit.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, "")}`;
  return "";
}

export function isSupabaseHost(url = databaseUrl()) {
  return /supabase\.(co|com)|pooler\.supabase/i.test(url);
}

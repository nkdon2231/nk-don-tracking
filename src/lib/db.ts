import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { parse } from "pg-connection-string";
import { databaseCandidates, databaseUrl, supabaseAuthConfigured as authReady, supabaseStorageConfigured } from "./env";
import { HttpError } from "./http";

const { Pool, types } = pg;

types.setTypeParser(1082, (value) => value);
types.setTypeParser(1114, (value) => value);
types.setTypeParser(1184, (value) => value);
types.setTypeParser(1700, (value) => value);

export type DbMode = "supabase" | "postgres" | "preview" | "unconfigured";

export type QueryFn = (sql: string, params?: unknown[]) => Promise<{ rows: Record<string, unknown>[]; rowCount: number }>;

type Runner = {
  query: QueryFn;
  release?: () => void;
};

const globalRef = globalThis as typeof globalThis & {
  __nkdonDb?: Promise<void>;
  __nkdonPool?: pg.Pool;
  __nkdonPglite?: import("@electric-sql/pglite").PGlite;
  __nkdonChain?: Promise<unknown>;
};

function databaseUrlSource() {
  return databaseUrl();
}

export function databaseMode(): DbMode {
  const url = databaseUrlSource();
  if (!url) {
    if (process.env.NODE_ENV === "production") return "unconfigured";
    return "preview";
  }
  if (/supabase\.(co|com)/i.test(url)) return "supabase";
  return "postgres";
}

export function storageMode(): "supabase" | "local-preview" | "unconfigured" {
  if (supabaseStorageConfigured()) return "supabase";
  if (process.env.NODE_ENV === "production") return "unconfigured";
  return "local-preview";
}

export function supabaseAuthConfigured() {
  return authReady();
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const previous = globalRef.__nkdonChain ?? Promise.resolve();
  const run = previous.then(fn, fn);
  globalRef.__nkdonChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function previewDb() {
  if (!globalRef.__nkdonPglite) {
    const dir = path.join(process.cwd(), ".data", "pglite");
    await mkdir(dir, { recursive: true });
    const { PGlite } = await import("@electric-sql/pglite");
    globalRef.__nkdonPglite = new PGlite(dir);
    await globalRef.__nkdonPglite.waitReady;
  }
  return globalRef.__nkdonPglite;
}

function failureReason(error: unknown) {
  if (error && typeof error === "object" && "code" in error) {
    const code = String((error as { code?: unknown }).code ?? "");
    if (/^[A-Za-z0-9_]{2,32}$/.test(code)) return code;
  }
  return "connect_failed";
}

function needsSsl(url: string) {
  return /supabase\.(co|com)|pooler/i.test(url);
}

async function checkout(): Promise<Runner> {
  const mode = databaseMode();
  if (mode === "unconfigured") {
    throw new HttpError(
      503,
      "database_unconfigured",
      "The production database is not connected. Set DATABASE_URL (or the Vercel Supabase POSTGRES_URL) to the Supabase Postgres connection string.",
    );
  }
  if (mode === "preview") {
    const db = await previewDb();
    return {
      query: async (sql, params = []) => {
        const result = await db.query(sql, params as never[]);
        return { rows: (result.rows ?? []) as Record<string, unknown>[], rowCount: result.affectedRows ?? result.rows?.length ?? 0 };
      },
    };
  }
  if (!globalRef.__nkdonPool) {
    const failures: string[] = [];
    for (const candidate of databaseCandidates()) {
      let parsed: ReturnType<typeof parse>;
      try {
        parsed = parse(candidate.url);
      } catch {
        failures.push(`${candidate.source} ${candidate.hostKind}:${candidate.port} invalid_url`);
        continue;
      }
      if (!parsed.host || !parsed.user || !parsed.database) {
        failures.push(`${candidate.source} ${candidate.hostKind}:${candidate.port} invalid_url`);
        continue;
      }
      const pool = new Pool({
        host: parsed.host,
        port: parsed.port ? Number(parsed.port) : undefined,
        user: parsed.user,
        password: parsed.password ?? undefined,
        database: parsed.database,
        max: process.env.VERCEL ? 1 : 8,
        connectionTimeoutMillis: 8000,
        ssl: needsSsl(candidate.url) ? { rejectUnauthorized: false } : undefined,
      });
      try {
        const client = await pool.connect();
        client.release();
        globalRef.__nkdonPool = pool;
        break;
      } catch (error) {
        failures.push(`${candidate.source} ${candidate.hostKind}:${candidate.port} ${failureReason(error)}`);
        await pool.end().catch(() => undefined);
      }
    }
    if (!globalRef.__nkdonPool) {
      throw new HttpError(
        503,
        "database_unavailable",
        failures.length
          ? `The production database could not be reached (${failures.join("; ")}).`
          : "The production database is not connected. Set DATABASE_URL to the Supabase session pooler URI.",
      );
    }
  }
  const client = await globalRef.__nkdonPool.connect();
  return {
    query: async (sql, params = []) => {
      const result = await client.query(sql, params as never[]);
      return { rows: result.rows as Record<string, unknown>[], rowCount: result.rowCount ?? 0 };
    },
    release: () => client.release(),
  };
}

async function openRunner() {
  try {
    return await checkout();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    console.error("[nkdon] database connect failed", failureReason(error));
    throw new HttpError(503, "database_unavailable", `The production database could not be reached (${failureReason(error)}).`);
  }
}

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return enqueue(async () => {
    const runner = await openRunner();
    try {
      const result = await runner.query(sql, params);
      return result.rows as T[];
    } catch (error) {
      if (error instanceof HttpError) throw error;
      console.error("[nkdon] query failed", failureReason(error));
      throw new HttpError(503, "database_unavailable", `The database query failed (${failureReason(error)}).`);
    } finally {
      runner.release?.();
    }
  });
}

export async function withTransaction<T>(fn: (q: QueryFn) => Promise<T>): Promise<T> {
  return enqueue(async () => {
    const runner = await openRunner();
    try {
      await runner.query("begin");
      const result = await fn(runner.query);
      await runner.query("commit");
      return result;
    } catch (error) {
      try {
        await runner.query("rollback");
      } catch {
        // Keep the original error.
      }
      if (error instanceof HttpError) throw error;
      console.error("[nkdon] transaction failed", failureReason(error));
      throw new HttpError(503, "database_unavailable", `The database query failed (${failureReason(error)}).`);
    } finally {
      runner.release?.();
    }
  });
}

function splitSql(sql: string) {
  const statements: string[] = [];
  let current = "";
  let dollar = false;
  for (let i = 0; i < sql.length; i += 1) {
    if (sql.startsWith("$$", i)) {
      dollar = !dollar;
      current += "$$";
      i += 1;
      continue;
    }
    if (!dollar && sql[i] === ";") {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = "";
      continue;
    }
    current += sql[i];
  }
  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

export async function migrate() {
  await query(
    "create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())",
  );
  const dir = path.join(process.cwd(), "supabase", "migrations");
  let files: string[] = [];
  try {
    files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
  } catch (error) {
    console.error("[nkdon] migrations unreadable", error instanceof Error ? error.name : "error");
    throw new HttpError(503, "migrations_missing", "The server could not read supabase/migrations.");
  }
  const appliedRows = await query<{ name: string }>("select name from schema_migrations");
  const applied = new Set(appliedRows.map((row) => row.name));
  for (const name of files) {
    if (applied.has(name)) continue;
    const sql = await readFile(path.join(dir, name), "utf8");
    const statements = splitSql(sql);
    try {
      await withTransaction(async (q) => {
        for (const statement of statements) {
          await q(statement);
        }
        await q("insert into schema_migrations (name) values ($1)", [name]);
      });
    } catch (error) {
      if (error instanceof HttpError) {
        throw new HttpError(503, "migration_failed", `Migration ${name} failed (${error.message}).`);
      }
      throw error;
    }
    console.log(`[nkdon] applied migration ${name}`);
  }
}

export async function ensureReady() {
  if (!globalRef.__nkdonDb) {
    globalRef.__nkdonDb = (async () => {
      if (databaseMode() === "unconfigured") return;
      await migrate();
      const { seedDemo } = await import("../server/seed");
      await seedDemo();
    })().catch((error) => {
      globalRef.__nkdonDb = undefined;
      throw error;
    });
  }
  await globalRef.__nkdonDb;
}

import { mkdir, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
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

function databaseUrl() {
  const value = process.env.DATABASE_URL?.trim();
  return value || "";
}

export function databaseMode(): DbMode {
  const url = databaseUrl();
  if (!url) {
    if (process.env.NODE_ENV === "production") return "unconfigured";
    return "preview";
  }
  if (/supabase\.(co|com)/i.test(url)) return "supabase";
  return "postgres";
}

export function storageMode(): "supabase" | "local-preview" | "unconfigured" {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) return "supabase";
  if (process.env.NODE_ENV === "production") return "unconfigured";
  return "local-preview";
}

export function supabaseAuthConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
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

async function checkout(): Promise<Runner> {
  const mode = databaseMode();
  if (mode === "unconfigured") {
    throw new HttpError(
      503,
      "database_unconfigured",
      "The production database is not connected. Set DATABASE_URL to the Supabase Postgres connection string.",
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
    globalRef.__nkdonPool = new Pool({
      connectionString: databaseUrl(),
      max: 8,
      ssl: /supabase\.(co|com)/i.test(databaseUrl()) ? { rejectUnauthorized: false } : undefined,
    });
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

export async function query<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  return enqueue(async () => {
    const runner = await checkout();
    try {
      const result = await runner.query(sql, params);
      return result.rows as T[];
    } finally {
      runner.release?.();
    }
  });
}

export async function withTransaction<T>(fn: (q: QueryFn) => Promise<T>): Promise<T> {
  return enqueue(async () => {
    const runner = await checkout();
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
      throw error;
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
  const files = (await readdir(dir)).filter((name) => name.endsWith(".sql")).sort();
  const appliedRows = await query<{ name: string }>("select name from schema_migrations");
  const applied = new Set(appliedRows.map((row) => row.name));
  for (const name of files) {
    if (applied.has(name)) continue;
    const sql = await readFile(path.join(dir, name), "utf8");
    const statements = splitSql(sql);
    await withTransaction(async (q) => {
      for (const statement of statements) {
        await q(statement);
      }
      await q("insert into schema_migrations (name) values ($1)", [name]);
    });
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

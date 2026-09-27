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
  __nkdonDbSource?: string;
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
        globalRef.__nkdonDbSource = candidate.source;
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

const BASELINE_COLUMNS: Record<string, Array<[string, string]>> = {
  "0001_init.sql": [
    ["admin_users", "password_hash"],
    ["admin_sessions", "token_hash"],
    ["login_attempts", "success"],
    ["facilities", "facility_code"],
    ["shipments", "tracking_number"],
    ["shipments", "public_description"],
    ["shipments", "internal_notes"],
    ["shipment_events", "event_time"],
    ["shipment_evidence", "public_token"],
    ["shipment_evidence", "is_public"],
    ["admin_activity", "action"],
    ["company_settings", "company_name"],
    ["inquiries", "message"],
    ["rate_limits", "bucket_key"],
    ["tracking_counters", "last_value"],
  ],
  "0003_couriers_and_recorded_positions.sql": [
    ["couriers", "courier_code"],
    ["couriers", "photo_path"],
    ["shipments", "courier_id"],
    ["shipment_events", "latitude"],
    ["shipment_events", "longitude"],
    ["shipment_events", "coordinate_source"],
  ],
  "0005_customer_requests.sql": [
    ["customer_requests", "kind"],
    ["customer_requests", "staff_note"],
    ["customer_requests", "shipment_id"],
    ["service_lanes", "transit_min_days"],
    ["service_lanes", "transit_max_days"],
    ["service_lanes", "is_active"],
  ],
};

async function baselineState(name: string): Promise<{ state: "present" | "absent" | "partial" | "run"; missing: string[] }> {
  const markers = BASELINE_COLUMNS[name];
  if (!markers) return { state: "run", missing: [] };
  const tables = [...new Set(markers.map(([table]) => table))];
  const rows = await query<{ table_name: string; column_name: string }>(
    `select table_name, column_name
     from information_schema.columns
     where table_schema = 'public' and table_name = any($1::text[])`,
    [tables],
  );
  const found = new Set(rows.map((row) => `${row.table_name}.${row.column_name}`));
  const missing = markers.filter(([table, column]) => !found.has(`${table}.${column}`)).map(([table, column]) => `${table}.${column}`);
  if (missing.length === markers.length) return { state: "absent", missing };
  if (missing.length > 0) return { state: "partial", missing };
  if (name === "0001_init.sql") {
    const functions = await query<{ proname: string }>(
      `select p.proname
       from pg_proc p
       join pg_namespace n on n.oid = p.pronamespace
       where n.nspname = 'public' and p.proname = any($1::text[])`,
      [["set_updated_at", "prevent_event_mutation"]],
    );
    const names = new Set(functions.map((row) => row.proname));
    for (const fn of ["set_updated_at", "prevent_event_mutation"]) {
      if (!names.has(fn)) missing.push(`function:${fn}`);
    }
    if (missing.length) return { state: "partial", missing };
  }
  return { state: "present", missing: [] };
}

async function schemaInventory() {
  const names = [
    "admin_users",
    "admin_sessions",
    "login_attempts",
    "facilities",
    "shipments",
    "shipment_events",
    "shipment_evidence",
    "admin_activity",
    "company_settings",
    "inquiries",
    "rate_limits",
    "tracking_counters",
    "couriers",
    "customer_requests",
    "service_lanes",
  ];
  const tables = await query<{ table_name: string }>(
    `select table_name from information_schema.tables
     where table_schema = 'public' and table_type = 'BASE TABLE'
     order by table_name`,
  );
  const columns = await query<{ table_name: string; column_name: string; data_type: string }>(
    `select table_name, column_name, data_type
     from information_schema.columns
     where table_schema = 'public' and table_name = any($1::text[])
     order by table_name, ordinal_position`,
    [names],
  );
  const grouped = new Map<string, string[]>();
  for (const row of columns) {
    const list = grouped.get(row.table_name) ?? [];
    list.push(`${row.column_name}:${row.data_type}`);
    grouped.set(row.table_name, list);
  }
  const counts = await query<{ shipments: number; events: number; users: number; activity: number; nkd: number; minlen: number; maxlen: number }>(
    `select
       (select count(*)::int from shipments) as shipments,
       (select count(*)::int from shipment_events) as events,
       (select count(*)::int from admin_users) as users,
       (select count(*)::int from admin_activity) as activity,
       (select count(*)::int from shipments where tracking_number ~ '^NKD-[0-9]{8}-[0-9]{4}$') as nkd,
       (select min(length(tracking_number))::int from shipments) as minlen,
       (select max(length(tracking_number))::int from shipments) as maxlen`,
  );
  const statuses = await query<{ status: string; n: number }>(
    `select status, count(*)::int as n from shipments group by status order by status`,
  );
  const eventStatuses = await query<{ status: string; n: number }>(
    `select status, count(*)::int as n from shipment_events group by status order by status`,
  );
  const detail = names
    .filter((name) => grouped.has(name))
    .map((name) => `${name}=${grouped.get(name)?.join(",")}`)
    .join(" | ");
  const count = counts[0];
  const statusText = statuses.map((row) => `${row.status}:${row.n}`).join(",");
  const eventText = eventStatuses.map((row) => `${row.status}:${row.n}`).join(",");
  return `using ${globalRef.__nkdonDbSource ?? "unknown"}; tables=${tables.map((row) => row.table_name).join(",")}; counts=shipments:${count?.shipments ?? 0},events:${count?.events ?? 0},users:${count?.users ?? 0},activity:${count?.activity ?? 0},nkd:${count?.nkd ?? 0},len:${count?.minlen ?? 0}-${count?.maxlen ?? 0}; shipment_status=${statusText}; event_status=${eventText}; ${detail}`;
}

async function recordExistingMigration(name: string) {
  if (name === "0001_init.sql") {
    await query(
      `insert into company_settings (id, company_name, tagline)
       values (1, 'NKDON Global Logistics', 'Moving what matters. Across borders. With confidence.')
       on conflict (id) do nothing`,
    );
  }
  if (name === "0003_couriers_and_recorded_positions.sql") {
    await query("alter table couriers enable row level security");
    await query("revoke all on table couriers from anon, authenticated");
  }
  if (name === "0005_customer_requests.sql") {
    await query("alter table customer_requests enable row level security");
    await query("alter table service_lanes enable row level security");
    await query("revoke all on table customer_requests from anon, authenticated");
    await query("revoke all on table service_lanes from anon, authenticated");
  }
  await query("insert into schema_migrations (name) values ($1) on conflict (name) do nothing", [name]);
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
    const state = await baselineState(name);
    if (state.state === "partial" && name === "0001_init.sql") {
      const inventory = await schemaInventory();
      throw new HttpError(503, "migration_failed", `Migration ${name} is only partly present (${state.missing.join(", ")}). ${inventory}`);
    }
    if (state.state === "partial") {
      throw new HttpError(
        503,
        "migration_failed",
        `Migration ${name} is only partly present (${state.missing.join(", ")}). Nothing was dropped or rewritten.`,
      );
    }
    if (state.state === "present") {
      await recordExistingMigration(name);
      console.log(`[nkdon] recorded existing migration ${name}`);
      continue;
    }
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

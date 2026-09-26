import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { can, type Action, type Role } from "./constants";
import { query } from "./db";
import { HttpError } from "./http";

const scryptAsync = promisify(scrypt);
const SESSION_COOKIE = "nkdon_session";
const SESSION_HOURS = 12;

export type StaffUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  authProvider: "local" | "supabase";
};

type UserRow = {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  auth_provider: "local" | "supabase";
  password_hash: string | null;
};

export function demoSeedAllowed() {
  return process.env.NODE_ENV !== "production" && process.env.ALLOW_DEMO_SEED === "true";
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt$${salt}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null) {
  if (!stored) return false;
  const [algo, salt, hex] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hex) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const expected = Buffer.from(hex, "hex");
  if (derived.length !== expected.length) return false;
  return timingSafeEqual(derived, expected);
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function newToken() {
  return randomBytes(32).toString("hex");
}

function mapUser(row: UserRow): StaffUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    isActive: row.is_active,
    authProvider: row.auth_provider,
  };
}

export async function findUserByEmail(email: string) {
  const rows = await query<UserRow>("select * from admin_users where lower(email) = lower($1) limit 1", [email.trim()]);
  return rows[0] ?? null;
}

export async function countUsers() {
  const rows = await query<{ count: number }>("select count(*)::int as count from admin_users");
  return rows[0]?.count ?? 0;
}

export async function createSession(userId: string, ip: string, userAgent: string) {
  const token = newToken();
  const expires = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  await query(
    `insert into admin_sessions (user_id, token_hash, expires_at, ip, user_agent)
     values ($1, $2, $3, $4, $5)`,
    [userId, hashToken(token), expires.toISOString(), ip, userAgent],
  );
  await query("update admin_users set last_login_at = now() where id = $1", [userId]);
  return { token, expires };
}

export function sessionCookie(token: string, expires: Date) {
  return {
    name: SESSION_COOKIE,
    value: token,
    options: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires,
    },
  };
}

export async function revokeSession(token: string) {
  if (!token) return;
  await query("update admin_sessions set revoked_at = now() where token_hash = $1 and revoked_at is null", [hashToken(token)]);
}

export async function userFromToken(token: string | undefined | null): Promise<StaffUser | null> {
  if (!token) return null;
  const rows = await query<UserRow & { session_id: string; last_seen_at: string }>(
    `select u.*, s.id as session_id, s.last_seen_at
     from admin_sessions s
     join admin_users u on u.id = s.user_id
     where s.token_hash = $1
       and s.revoked_at is null
       and s.expires_at > now()
       and u.is_active = true
     limit 1`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return null;
  const lastSeen = new Date(row.last_seen_at).getTime();
  if (Date.now() - lastSeen > 5 * 60 * 1000) {
    await query("update admin_sessions set last_seen_at = now() where id = $1", [row.session_id]);
  }
  return mapUser(row);
}

export async function currentUser() {
  const jar = await cookies();
  return userFromToken(jar.get(SESSION_COOKIE)?.value);
}

export async function requireUser() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "unauthorized", "Sign in to continue.");
  return user;
}

export function assertCan(user: StaffUser, action: Action) {
  if (!can(user.role, action)) {
    throw new HttpError(403, "forbidden", "You do not have permission for this action.");
  }
}

export async function recordLoginAttempt(email: string, ip: string, success: boolean) {
  await query("insert into login_attempts (email, ip, success) values ($1, $2, $3)", [email.trim().toLowerCase(), ip, success]);
}

export async function loginLocked(email: string, ip: string) {
  const rows = await query<{ count: number }>(
    `select count(*)::int as count
     from login_attempts
     where success = false
       and created_at > now() - interval '15 minutes'
       and (lower(email) = lower($1) or ip = $2)`,
    [email.trim(), ip],
  );
  return (rows[0]?.count ?? 0) >= 8;
}

export async function verifyCredentials(email: string, password: string) {
  const row = await findUserByEmail(email);
  if (!row || !row.is_active) return null;
  if (row.auth_provider === "supabase") {
    const ok = await verifySupabasePassword(email, password);
    return ok ? mapUser(row) : null;
  }
  const ok = await verifyPassword(password, row.password_hash);
  return ok ? mapUser(row) : null;
}

async function verifySupabasePassword(email: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return false;
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: anon,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  return response.ok;
}

export async function createSupabaseUser(email: string, password: string, name: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return null;
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: service,
      authorization: `Bearer ${service}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    const message = typeof detail?.msg === "string" ? detail.msg : "Supabase Auth could not create this user.";
    throw new HttpError(400, "auth_provider", message);
  }
  const body = (await response.json()) as { id?: string };
  if (!body.id) throw new HttpError(502, "auth_provider", "Supabase Auth did not return a user id.");
  return body.id;
}

export function notificationChannels() {
  return {
    email: Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM),
    sms: Boolean(process.env.SMS_PROVIDER_URL),
    whatsapp: Boolean(process.env.WHATSAPP_PROVIDER_URL),
  };
}

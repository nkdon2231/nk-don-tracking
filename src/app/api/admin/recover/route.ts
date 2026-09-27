import { createHash, timingSafeEqual } from "node:crypto";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { ensureReady, query, withTransaction } from "@/lib/db";
import { clientIp, handle, HttpError, jsonError, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const RECOVER_SHA256 = "998b73e226b65306ef0d7d4e8d3a699793286199e9fe39507e1cf0af5b6cb970";
const ADMIN_EMAIL = "bennethmayor@hotmail.com";

function tokenMatches(token: string) {
  const digest = createHash("sha256").update(token).digest();
  const expected = Buffer.from(RECOVER_SHA256, "hex");
  return digest.length === expected.length && timingSafeEqual(digest, expected);
}

export async function POST(request: Request) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`recover:${clientIp(request)}`, 6, 3600);
    const payload = await request.json().catch(() => ({}));
    const token = typeof payload.token === "string" ? payload.token.trim() : "";
    const password = typeof payload.password === "string" ? payload.password : "";
    if (!tokenMatches(token)) return jsonError(403, "invalid_token", "The recovery token is incorrect.");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return jsonError(400, "invalid_input", "Use a stronger password.");

    const counts = await query<{ count: number }>("select count(*)::int as count from admin_users");
    const adminCount = Number(counts[0]?.count ?? 0);
    const rows = await query<{
      id: string;
      email: string;
      role: string;
      is_active: boolean;
      auth_provider: string;
      must_change_password: boolean;
      password_hash: string | null;
    }>(
      `select id, email, role, is_active, auth_provider, must_change_password, password_hash
       from admin_users where lower(email) = lower($1)`,
      [ADMIN_EMAIL],
    );
    const account = rows[0];
    if (!account || rows.length !== 1) {
      return jsonError(404, "account_missing", "The existing administrator was not found. No account was created.");
    }
    const failures = await query<{ count: number }>(
      `select count(*)::int as count from login_attempts
       where success = false and lower(email) = lower($1) and created_at > now() - interval '15 minutes'`,
      [ADMIN_EMAIL],
    );
    const previous = typeof payload.previousPassword === "string" ? payload.previousPassword : "";
    const previousPasswordMatched = previous.length > 0 && (await verifyPassword(previous, account.password_hash));
    if (account.role !== "super_admin" || !account.is_active) {
      return jsonError(409, "account_not_ready", "The existing administrator is not an active super admin. Nothing was changed.");
    }
    const passwordHash = await hashPassword(parsed.data);
    const updated = await withTransaction(async (q) => {
      const result = await q(
        `update admin_users
         set password_hash = $2, must_change_password = true, auth_provider = 'local'
         where id = $1 and lower(email) = lower($3) and role = 'super_admin' and is_active = true
         returning email, role, is_active, must_change_password, auth_provider`,
        [account.id, passwordHash, ADMIN_EMAIL],
      );
      if (!result.rows[0]) throw new HttpError(404, "account_missing", "The existing administrator was not updated.");
      await q("update admin_sessions set revoked_at = now() where user_id = $1 and revoked_at is null", [account.id]);
      await q("delete from login_attempts where lower(email) = lower($1) and success = false", [ADMIN_EMAIL]);
      return result.rows[0];
    });
    return jsonOk({
      ok: true,
      email: updated.email,
      role: updated.role,
      active: updated.is_active,
      mustChangePassword: updated.must_change_password,
      authProvider: updated.auth_provider,
      admins: adminCount,
      previousPasswordMatched,
      recentFailures: Number(failures[0]?.count ?? 0),
    });
  });
}

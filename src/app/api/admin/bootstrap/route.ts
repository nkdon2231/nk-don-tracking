import { createHash, timingSafeEqual } from "node:crypto";
import { hashPassword } from "@/lib/auth";
import { ensureReady, query, withTransaction } from "@/lib/db";
import { clientIp, handle, HttpError, jsonError, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { passwordSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BOOTSTRAP_SHA256 = "b5628def0658ecd71927076ef9096323135b7807a05149b1d65b66753ce2b541";
const ADMIN_EMAIL = "bennethmayor@hotmail.com";
const ADMIN_NAME = "NKDON Admin";

function tokenMatches(token: string) {
  const digest = createHash("sha256").update(token).digest();
  const expected = Buffer.from(BOOTSTRAP_SHA256, "hex");
  return digest.length === expected.length && timingSafeEqual(digest, expected);
}

export async function POST(request: Request) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`bootstrap:${clientIp(request)}`, 6, 3600);
    const payload = await request.json().catch(() => ({}));
    const token = typeof payload.token === "string" ? payload.token.trim() : "";
    const password = typeof payload.password === "string" ? payload.password : "";
    if (!tokenMatches(token)) return jsonError(403, "invalid_token", "The bootstrap token is incorrect.");
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return jsonError(400, "invalid_input", "Use a stronger password.");
    const passwordHash = await hashPassword(parsed.data);
    const created = await withTransaction(async (q) => {
      await q("lock table admin_users in exclusive mode");
      const existing = await q("select count(*)::int as count from admin_users");
      if (Number(existing.rows[0]?.count ?? 0) > 0) {
        throw new HttpError(403, "setup_closed", "An administrator already exists. Setup is closed.");
      }
      const inserted = await q(
        `insert into admin_users (email, name, role, auth_provider, password_hash, is_active, must_change_password)
         values ($1, $2, 'super_admin', 'local', $3, true, true)
         returning email, role, must_change_password`,
        [ADMIN_EMAIL, ADMIN_NAME, passwordHash],
      );
      return inserted.rows[0];
    });
    const shipments = await query<{ count: number }>("select count(*)::int as count from shipments");
    const events = await query<{ count: number }>("select count(*)::int as count from shipment_events");
    return jsonOk(
      {
        ok: true,
        email: created?.email ?? ADMIN_EMAIL,
        role: "super_admin",
        mustChangePassword: true,
        shipments: Number(shipments[0]?.count ?? 0),
        events: Number(events[0]?.count ?? 0),
      },
      201,
    );
  });
}

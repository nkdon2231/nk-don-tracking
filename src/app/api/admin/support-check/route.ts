import { createHash, timingSafeEqual } from "node:crypto";
import { ensureReady, query } from "@/lib/db";
import { clientIp, handle, jsonError, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TOKEN_SHA256 = "50bc59e0d6e8a2d9ade52984a1de8c1eb9951ac7c44c2b0729703089aa79c11c";
const TEST_EMAIL = /^nkdon-support-e2e-[a-z0-9]+@example\.com$/;

function tokenMatches(token: string) {
  const digest = createHash("sha256").update(token).digest();
  const expected = Buffer.from(TOKEN_SHA256, "hex");
  return digest.length === expected.length && timingSafeEqual(digest, expected);
}

async function counts() {
  const shipments = await query<{ count: number }>("select count(*)::int as count from shipments");
  const events = await query<{ count: number }>("select count(*)::int as count from shipment_events");
  const inquiries = await query<{ count: number }>("select count(*)::int as count from inquiries");
  return {
    shipments: Number(shipments[0]?.count ?? 0),
    events: Number(events[0]?.count ?? 0),
    inquiries: Number(inquiries[0]?.count ?? 0),
  };
}

export async function POST(request: Request) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`support-check:${clientIp(request)}`, 12, 3600);
    const payload = await request.json().catch(() => ({}));
    const token = typeof payload.token === "string" ? payload.token.trim() : "";
    if (!tokenMatches(token)) return jsonError(403, "invalid_token", "The check token is incorrect.");
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!TEST_EMAIL.test(email)) return jsonError(400, "invalid_input", "That address is not a support test address.");

    if (payload.action === "cleanup") {
      const before = await counts();
      const removed = await query<{ id: string }>("delete from inquiries where lower(email) = lower($1) returning id", [email]);
      const after = await counts();
      const preserved = after.shipments === before.shipments && after.events === before.events;
      const inquiryOk = after.inquiries === before.inquiries - removed.length;
      return jsonOk({
        ok: preserved && inquiryOk,
        removed: removed.length,
        before,
        after,
      });
    }

    const rows = await query<{
      id: string;
      name: string;
      email: string;
      phone: string;
      topic: string;
      message: string;
      notification_status: string;
      created_at: string;
    }>(
      `select id, name, email, phone, topic, message, notification_status, created_at
       from inquiries where lower(email) = lower($1) order by created_at desc`,
      [email],
    );
    return jsonOk({
      ...(await counts()),
      matches: rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        topic: row.topic,
        message: row.message,
        notificationStatus: row.notification_status,
        createdAt: row.created_at,
      })),
    });
  });
}

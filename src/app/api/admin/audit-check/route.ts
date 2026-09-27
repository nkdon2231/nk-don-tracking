import { createHash, timingSafeEqual } from "node:crypto";
import { ensureReady, query } from "@/lib/db";
import { clientIp, handle, jsonError, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TOKEN_SHA256 = "cf0924b5af7dddfd92f37b12b844243cea6b3e2e0781689ade733ad9ee8cc99f";
const TEST_EMAIL = /^nkdon-audit-e2e-[a-z0-9]+@example\.com$/;

function tokenMatches(token: string) {
  const digest = createHash("sha256").update(token).digest();
  const expected = Buffer.from(TOKEN_SHA256, "hex");
  return digest.length === expected.length && timingSafeEqual(digest, expected);
}

async function counts() {
  const one = async (sql: string) => Number((await query<{ count: number }>(sql))[0]?.count ?? 0);
  const migrations = await query<{ name: string }>("select name from schema_migrations order by name");
  const admins = await query<{ email: string; role: string; is_active: boolean }>(
    "select email, role, is_active from admin_users order by created_at asc",
  );
  return {
    shipments: await one("select count(*)::int as count from shipments"),
    events: await one("select count(*)::int as count from shipment_events"),
    inquiries: await one("select count(*)::int as count from inquiries"),
    requests: await one("select count(*)::int as count from customer_requests"),
    couriers: await one("select count(*)::int as count from couriers"),
    admins: admins.length,
    adminAccounts: admins.map((row) => ({ email: row.email, role: row.role, active: row.is_active })),
    migrations: migrations.map((row) => row.name),
  };
}

export async function POST(request: Request) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`audit-check:${clientIp(request)}`, 20, 3600);
    const payload = await request.json().catch(() => ({}));
    const token = typeof payload.token === "string" ? payload.token.trim() : "";
    if (!tokenMatches(token)) return jsonError(403, "invalid_token", "The check token is incorrect.");
    const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
    if (!TEST_EMAIL.test(email)) return jsonError(400, "invalid_input", "That address is not an audit test address.");

    if (payload.action === "cleanup") {
      const before = await counts();
      const requests = await query<{ id: string }>("delete from customer_requests where lower(contact_email) = lower($1) returning id", [email]);
      const inquiries = await query<{ id: string }>("delete from inquiries where lower(email) = lower($1) returning id", [email]);
      const after = await counts();
      const preserved =
        after.shipments === before.shipments &&
        after.events === before.events &&
        after.admins === before.admins &&
        after.couriers === before.couriers &&
        after.requests === before.requests - requests.length &&
        after.inquiries === before.inquiries - inquiries.length;
      return jsonOk({ ok: preserved, removedRequests: requests.length, removedInquiries: inquiries.length, before, after });
    }

    const requests = await query<{ id: string; kind: string; status: string; shipment_id: string | null; service_type: string }>(
      `select id, kind, status, shipment_id, service_type from customer_requests where lower(contact_email) = lower($1) order by created_at desc`,
      [email],
    );
    const inquiries = await query<{ id: string; topic: string; notification_status: string; message: string }>(
      `select id, topic, notification_status, message from inquiries where lower(email) = lower($1) order by created_at desc`,
      [email],
    );
    return jsonOk({
      ...(await counts()),
      matches: {
        requests: requests.map((row) => ({
          id: row.id,
          kind: row.kind,
          status: row.status,
          shipmentId: row.shipment_id,
          serviceType: row.service_type,
        })),
        inquiries: inquiries.map((row) => ({
          id: row.id,
          topic: row.topic,
          notificationStatus: row.notification_status,
          message: row.message,
        })),
      },
    });
  });
}

import { createHash, timingSafeEqual } from "node:crypto";
import { ensureReady, query } from "@/lib/db";
import { clientIp, handle, jsonError, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TOKEN_SHA256 = "62ad70e9be94febe844abba2049cad09ff90cc743f0566d57a665e56e76d900f";
const TEST_EMAIL = /^nkdon-audit-e2e-[a-z0-9]+@example\.com$/;

function tokenMatches(token: string) {
  const digest = createHash("sha256").update(token).digest();
  const expected = Buffer.from(TOKEN_SHA256, "hex");
  return digest.length === expected.length && timingSafeEqual(digest, expected);
}

async function counts() {
  const shipments = await query<{ count: number }>("select count(*)::int as count from shipments");
  const events = await query<{ count: number }>("select count(*)::int as count from shipment_events");
  const admins = await query<{ count: number }>("select count(*)::int as count from admin_users");
  const inquiries = await query<{ count: number }>("select count(*)::int as count from inquiries");
  const requests = await query<{ count: number }>("select count(*)::int as count from customer_requests");
  const migrations = await query<{ name: string }>("select name from schema_migrations order by name");
  const admin = await query<{ role: string; is_active: boolean; n: number }>(
    "select role, is_active, count(*)::int as n from admin_users group by role, is_active order by role",
  );
  return {
    shipments: Number(shipments[0]?.count ?? 0),
    events: Number(events[0]?.count ?? 0),
    admins: Number(admins[0]?.count ?? 0),
    inquiries: Number(inquiries[0]?.count ?? 0),
    requests: Number(requests[0]?.count ?? 0),
    migrations: migrations.map((row) => row.name),
    adminRoles: admin.map((row) => ({ role: row.role, active: row.is_active, count: Number(row.n) })),
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
      const removedRequests = await query<{ id: string; shipment_id: string | null }>(
        "delete from customer_requests where lower(contact_email) = lower($1) and shipment_id is null returning id, shipment_id",
        [email],
      );
      const removedInquiries = await query<{ id: string }>("delete from inquiries where lower(email) = lower($1) returning id", [email]);
      const after = await counts();
      const preserved =
        after.shipments === before.shipments &&
        after.events === before.events &&
        after.admins === before.admins &&
        after.requests === before.requests - removedRequests.length &&
        after.inquiries === before.inquiries - removedInquiries.length;
      return jsonOk({
        ok: preserved && removedRequests.every((row) => !row.shipment_id),
        removedRequests: removedRequests.length,
        removedInquiries: removedInquiries.length,
        before: { shipments: before.shipments, events: before.events, admins: before.admins, inquiries: before.inquiries, requests: before.requests },
        after: { shipments: after.shipments, events: after.events, admins: after.admins, inquiries: after.inquiries, requests: after.requests },
      });
    }

    const requests = await query<{
      id: string;
      kind: string;
      status: string;
      shipment_id: string | null;
      service_type: string;
      contact_email: string;
    }>(
      `select id, kind, status, shipment_id, service_type, contact_email
       from customer_requests where lower(contact_email) = lower($1) order by created_at desc`,
      [email],
    );
    const inquiries = await query<{
      id: string;
      name: string;
      email: string;
      topic: string;
      notification_status: string;
    }>(
      `select id, name, email, topic, notification_status
       from inquiries where lower(email) = lower($1) order by created_at desc`,
      [email],
    );
    const base = await counts();
    return jsonOk({
      ...base,
      matches: {
        requests: requests.map((row) => ({
          id: row.id,
          kind: row.kind,
          status: row.status,
          shipmentId: row.shipment_id,
          serviceType: row.service_type,
          email: row.contact_email,
        })),
        inquiries: inquiries.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          topic: row.topic,
          notificationStatus: row.notification_status,
        })),
      },
    });
  });
}

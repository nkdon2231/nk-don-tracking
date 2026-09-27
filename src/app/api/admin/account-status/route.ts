import { createHash, timingSafeEqual } from "node:crypto";
import { verifyPassword } from "@/lib/auth";
import { ensureReady, query, withTransaction } from "@/lib/db";
import { clientIp, handle, jsonError, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS_SHA256 = "cbbb45a9149b589ad8e7b6104d3aa2d16a413ad87da2bec658a156654a4769ac";
const ADMIN_EMAIL = "bennethmayor@hotmail.com";
const TEST_EMAIL = /^nkdon-e2e-[a-z0-9]+@example\.com$/i;

function tokenMatches(token: string) {
  const digest = createHash("sha256").update(token).digest();
  const expected = Buffer.from(STATUS_SHA256, "hex");
  return digest.length === expected.length && timingSafeEqual(digest, expected);
}

function asString(value: unknown) {
  return value == null ? "" : String(value);
}

export async function POST(request: Request) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`account-status:${clientIp(request)}`, 24, 3600);
    const payload = await request.json().catch(() => ({}));
    const token = typeof payload.token === "string" ? payload.token.trim() : "";
    if (!tokenMatches(token)) return jsonError(403, "invalid_token", "The status token is incorrect.");

    const action = typeof payload.action === "string" ? payload.action : "status";
    const testEmail = typeof payload.testEmail === "string" ? payload.testEmail.trim().toLowerCase() : "";
    if ((action === "inspect" || action === "cleanup") && !TEST_EMAIL.test(testEmail)) {
      return jsonError(400, "invalid_input", "Test cleanup only accepts an nkdon-e2e address at example.com.");
    }
    if (action === "cleanup") {
      const removed = await cleanupTestRecords(testEmail, Array.isArray(payload.shipmentIds) ? payload.shipmentIds : []);
      const counts = await countsSnapshot();
      return jsonOk({ removed, ...counts });
    }

    const counts = await countsSnapshot();
    const rows = await query<{
      email: string;
      role: string;
      is_active: boolean;
      auth_provider: string;
      must_change_password: boolean;
      password_hash: string | null;
      last_login_at: string | null;
    }>(
      `select email, role, is_active, auth_provider, must_change_password, password_hash, last_login_at
       from admin_users where lower(email) = lower($1)`,
      [ADMIN_EMAIL],
    );
    const failures = await query<{ count: number }>(
      `select count(*)::int as count from login_attempts
       where success = false and lower(email) = lower($1) and created_at > now() - interval '15 minutes'`,
      [ADMIN_EMAIL],
    );
    const account = rows[0];
    const previous = typeof payload.previousPassword === "string" ? payload.previousPassword : "";
    const inspected = action === "inspect" ? await inspectTestRecords(testEmail) : undefined;
    return jsonOk({
      ...counts,
      matches: rows.length,
      recentFailures: Number(failures[0]?.count ?? 0),
      account: account
        ? {
            email: account.email,
            role: account.role,
            active: account.is_active,
            authProvider: account.auth_provider,
            mustChangePassword: account.must_change_password,
            hasPassword: Boolean(account.password_hash),
            lastLoginAt: account.last_login_at,
            previousPasswordMatched: previous.length > 0 && (await verifyPassword(previous, account.password_hash)),
          }
        : null,
      ...(inspected ? { inspected } : {}),
    });
  });
}

async function countsSnapshot() {
  const admins = await query<{ count: number }>("select count(*)::int as count from admin_users");
  const shipments = await query<{ count: number }>("select count(*)::int as count from shipments");
  const events = await query<{ count: number }>("select count(*)::int as count from shipment_events");
  return {
    admins: Number(admins[0]?.count ?? 0),
    shipments: Number(shipments[0]?.count ?? 0),
    events: Number(events[0]?.count ?? 0),
  };
}

async function inspectTestRecords(testEmail: string) {
  const requests = await query(
    `select id, kind, status, shipment_id, contact_email, pickup_city, destination_city, created_at
     from customer_requests where lower(contact_email) = lower($1) order by created_at desc limit 20`,
    [testEmail],
  );
  const inquiries = await query(
    `select id, topic, notification_status, email, created_at
     from inquiries where lower(email) = lower($1) order by created_at desc limit 20`,
    [testEmail],
  );
  return {
    requests: requests.map((row) => ({
      id: asString(row.id),
      kind: asString(row.kind),
      status: asString(row.status),
      shipmentId: row.shipment_id ? asString(row.shipment_id) : null,
      contactEmail: asString(row.contact_email),
      pickupCity: asString(row.pickup_city),
      destinationCity: asString(row.destination_city),
      createdAt: asString(row.created_at),
    })),
    inquiries: inquiries.map((row) => ({
      id: asString(row.id),
      topic: asString(row.topic),
      notificationStatus: asString(row.notification_status),
      email: asString(row.email),
      createdAt: asString(row.created_at),
    })),
  };
}

async function cleanupTestRecords(testEmail: string, shipmentIds: unknown[]) {
  const ids = shipmentIds.filter((id): id is string => typeof id === "string" && /^[0-9a-f-]{36}$/i.test(id));
  if (ids.length > 2) return { ok: false, reason: "too_many", before: await countsSnapshot() };
  const before = await countsSnapshot();
  if (before.shipments - ids.length < 1) {
    return { ok: false, reason: "would_remove_last_shipment", before };
  }
  const linked = ids.length
    ? await query<{ id: string; sender_email: string }>(
        `select id, sender_email from shipments where id = any($1::uuid[])`,
        [ids],
      )
    : [];
  if (linked.length !== ids.length) {
    return { ok: false, reason: "shipment_not_found", before };
  }
  for (const row of linked) {
    if (asString(row.sender_email).toLowerCase() !== testEmail) {
      return { ok: false, reason: "shipment_not_test", before };
    }
  }
  const owned = ids.length
    ? await query<{ id: string }>(
        `select distinct shipment_id as id from customer_requests
         where shipment_id = any($1::uuid[]) and lower(contact_email) = lower($2)`,
        [ids, testEmail],
      )
    : [];
  if (owned.length !== ids.length) {
    return { ok: false, reason: "shipment_not_linked", before };
  }

  const removed = await withTransaction(async (q) => {
    await q("select set_config('nkdon.purge', 'on', true)");
    const evidence = ids.length
      ? await q("delete from shipment_evidence where shipment_id = any($1::uuid[])", [ids])
      : { rowCount: 0, rows: [] };
    const events = ids.length
      ? await q("delete from shipment_events where shipment_id = any($1::uuid[])", [ids])
      : { rowCount: 0, rows: [] };
    const shipments = ids.length
      ? await q("delete from shipments where id = any($1::uuid[]) and lower(sender_email) = lower($2)", [ids, testEmail])
      : { rowCount: 0, rows: [] };
    const requests = await q("delete from customer_requests where lower(contact_email) = lower($1)", [testEmail]);
    const inquiries = await q("delete from inquiries where lower(email) = lower($1)", [testEmail]);
    return {
      evidence: evidence.rowCount ?? 0,
      events: events.rowCount ?? 0,
      shipments: shipments.rowCount ?? 0,
      requests: requests.rowCount ?? 0,
      inquiries: inquiries.rowCount ?? 0,
    };
  });

  const after = await countsSnapshot();
  if (
    after.shipments !== before.shipments - removed.shipments ||
    after.events !== before.events - removed.events ||
    (after.shipments < 1 && before.shipments >= 1)
  ) {
    return { ok: false, reason: "count_mismatch", before, after, removed };
  }
  return { ok: true, before, removed };
}

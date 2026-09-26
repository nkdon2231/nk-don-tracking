import { NextResponse } from "next/server";
import {
  assertCan,
  countUsers,
  createSession,
  createSupabaseUser,
  currentUser,
  findUserByEmail,
  hashPassword,
  loginLocked,
  notificationChannels,
  recordLoginAttempt,
  requireUser,
  revokeSession,
  sessionCookie,
  userFromToken,
  verifyCredentials,
  verifyPassword,
  type StaffUser,
} from "@/lib/auth";
import { audit } from "@/lib/audit";
import { databaseMode, ensureReady, query, storageMode } from "@/lib/db";
import { deleteEvidenceFile, readEvidenceFile, readUpload, saveEvidenceFile } from "@/lib/files";
import { assertCsrf, assertSameOrigin, clientIp, handle, HttpError, jsonError, jsonOk, readCookie, userAgent } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import {
  eventSchema,
  evidenceMetaSchema,
  facilitySchema,
  loginSchema,
  parseBody,
  settingsSchema,
  setupSchema,
  shipmentSchema,
  userPatchSchema,
  userSchema,
} from "@/lib/validators";
import {
  addEvent,
  createFacility,
  createShipment,
  dashboardStats,
  deleteEvidence,
  getEvidence,
  getSettings,
  getShipment,
  insertEvidence,
  listActivity,
  listEvidence,
  listFacilities,
  listShipments,
  listUsers,
  purgeDemo,
  setArchived,
  updateEvidence,
  updateFacility,
  updateSettings,
  updateShipment,
} from "@/server/operations";
import type { Action, ShipmentStatus } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function actor(request: Request, action?: Action) {
  const user = await userFromToken(readCookie(request, "nkdon_session"));
  if (!user) throw new HttpError(401, "unauthorized", "Sign in to continue.");
  if (action) assertCan(user, action);
  return user;
}

async function body(request: Request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

function meta(request: Request, user: StaffUser | null) {
  return { actor: user, ip: clientIp(request), userAgent: userAgent(request) };
}

async function guardMutation(request: Request, open = false) {
  if (open) assertSameOrigin(request);
  else assertCsrf(request);
}

export async function GET(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    await ensureReady();
    const { path } = await context.params;
    const key = path.join("/");
    const url = new URL(request.url);

    if (key === "auth/session") {
      const user = await currentUser();
      return jsonOk({ user, database: databaseMode(), storage: storageMode(), notifications: notificationChannels() });
    }
    if (key === "stats") {
      await actor(request, "shipments:read");
      return jsonOk(await dashboardStats());
    }
    if (key === "shipments") {
      await actor(request, "shipments:read");
      const result = await listShipments({
        q: url.searchParams.get("q") ?? "",
        status: url.searchParams.get("status") ?? "",
        from: url.searchParams.get("from") ?? "",
        to: url.searchParams.get("to") ?? "",
        page: Number(url.searchParams.get("page") ?? 1),
        pageSize: Number(url.searchParams.get("pageSize") ?? 20),
        sort: url.searchParams.get("sort") ?? "created_at",
        dir: url.searchParams.get("dir") ?? "desc",
        archived: url.searchParams.get("archived") === "1",
      });
      return jsonOk(result);
    }
    if (path[0] === "shipments" && path[1] && path.length === 2) {
      const user = await actor(request, "shipments:read");
      const detail = await getShipment(path[1]);
      if (!detail) return jsonError(404, "not_found", "Shipment not found.");
      if (user.role === "viewer") detail.shipment.internalNotes = "";
      return jsonOk(detail);
    }
    if (key === "evidence") {
      await actor(request, "shipments:read");
      return jsonOk({
        items: await listEvidence({
          q: url.searchParams.get("q") ?? "",
          type: url.searchParams.get("type") ?? "",
          shipmentId: url.searchParams.get("shipmentId") ?? "",
          visibility: url.searchParams.get("visibility") ?? "",
        }),
      });
    }
    if (path[0] === "evidence" && path[2] === "file" && path[1]) {
      await actor(request, "shipments:read");
      const evidence = await getEvidence(path[1]);
      if (!evidence) return jsonError(404, "not_found", "File not found.");
      const bytes = await readEvidenceFile(evidence.filePath);
      return new NextResponse(new Uint8Array(bytes), {
        headers: {
          "content-type": evidence.fileType,
          "content-disposition": `inline; filename="evidence"`,
          "cache-control": "private, no-store",
          "x-content-type-options": "nosniff",
        },
      });
    }
    if (key === "facilities") {
      await actor(request, "shipments:read");
      return jsonOk({ items: await listFacilities() });
    }
    if (key === "settings") {
      await actor(request, "shipments:read");
      return jsonOk({ settings: await getSettings(), notifications: notificationChannels(), database: databaseMode(), storage: storageMode() });
    }
    if (key === "users") {
      await actor(request, "users:write");
      return jsonOk({ items: await listUsers() });
    }
    if (key === "activity") {
      await actor(request, "shipments:read");
      return jsonOk({ items: await listActivity() });
    }
    return jsonError(404, "not_found", "Not found.");
  });
}

export async function POST(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    await ensureReady();
    const { path } = await context.params;
    const key = path.join("/");

    if (key === "auth/login") {
      await guardMutation(request, true);
      const input = parseBody(loginSchema, await body(request));
      const ip = clientIp(request);
      await enforceRateLimit(`login:${ip}`, 20, 900);
      if (await loginLocked(input.email, ip)) {
        await audit({ action: "login_locked", resource: "auth", ip, userAgent: userAgent(request), metadata: { email: input.email } });
        return jsonError(429, "locked", "Too many unsuccessful attempts. Wait 15 minutes and try again.");
      }
      const user = await verifyCredentials(input.email, input.password);
      await recordLoginAttempt(input.email, ip, Boolean(user));
      if (!user) {
        await audit({ action: "login_failed", resource: "auth", ip, userAgent: userAgent(request), metadata: { email: input.email } });
        return jsonError(401, "invalid_login", "The email or password is incorrect.");
      }
      const session = await createSession(user.id, ip, userAgent(request));
      await audit({ ...meta(request, user), action: "login", resource: "auth", resourceId: user.id });
      const response = jsonOk({ user });
      const cookie = sessionCookie(session.token, session.expires);
      response.cookies.set(cookie.name, cookie.value, cookie.options);
      return response;
    }

    if (key === "auth/logout") {
      await guardMutation(request, true);
      const token = readCookie(request, "nkdon_session");
      const user = await userFromToken(token);
      await revokeSession(token);
      if (user) await audit({ ...meta(request, user), action: "logout", resource: "auth", resourceId: user.id });
      const response = jsonOk({ ok: true });
      response.cookies.set("nkdon_session", "", { httpOnly: true, path: "/", maxAge: 0 });
      return response;
    }

    if (key === "setup") {
      await guardMutation(request, true);
      await enforceRateLimit(`setup:${clientIp(request)}`, 8, 3600);
      if ((await countUsers()) > 0) return jsonError(403, "setup_closed", "An administrator already exists. Setup is closed.");
      const expected = process.env.SETUP_TOKEN?.trim();
      if (!expected) {
        return jsonError(503, "setup_unconfigured", "Set SETUP_TOKEN on the server before creating the first administrator.");
      }
      const input = parseBody(setupSchema, await body(request));
      if (input.token !== expected) return jsonError(403, "invalid_token", "The setup token is incorrect.");
      let id: string | null = null;
      let provider: "local" | "supabase" = "local";
      let passwordHash: string | null = await hashPassword(input.password);
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        id = await createSupabaseUser(input.email, input.password, input.name);
        provider = "supabase";
        passwordHash = null;
      }
      await query(
        `insert into admin_users (id, email, name, role, auth_provider, password_hash)
         values (coalesce($1::uuid, gen_random_uuid()), $2, $3, 'super_admin', $4, $5)`,
        [id, input.email.toLowerCase(), input.name, provider, passwordHash],
      );
      const created = await findUserByEmail(input.email);
      await audit({
        actor: created ? { id: created.id, email: created.email } : null,
        action: "setup_admin",
        resource: "user",
        resourceId: created?.id,
        ip: clientIp(request),
        userAgent: userAgent(request),
      });
      return jsonOk({ ok: true }, 201);
    }

    if (key === "shipments") {
      await guardMutation(request);
      const user = await actor(request, "shipments:write");
      const input = parseBody(shipmentSchema, await body(request));
      const shipment = await createShipment(user, { ...input, status: input.status as ShipmentStatus });
      await audit({ ...meta(request, user), action: "shipment_created", resource: "shipment", resourceId: shipment.id, metadata: { trackingNumber: shipment.trackingNumber, demo: shipment.isDemo } });
      return jsonOk({ shipment }, 201);
    }

    if (path[0] === "shipments" && path[2] === "events" && path[1]) {
      await guardMutation(request);
      const user = await actor(request, "events:write");
      const input = parseBody(eventSchema, await body(request));
      const result = await addEvent(user, path[1], { ...input, status: input.status as ShipmentStatus });
      await audit({ ...meta(request, user), action: "event_created", resource: "shipment_event", resourceId: result.eventId, metadata: { shipmentId: path[1], status: input.status } });
      return jsonOk(result, 201);
    }

    if (key === "evidence") {
      await guardMutation(request);
      const user = await actor(request, "evidence:write");
      const form = await request.formData();
      const files = form.getAll("files").filter((item): item is File => item instanceof File);
      if (files.length === 0 || files.length > 8) return jsonError(400, "invalid_file", "Upload between 1 and 8 files.");
      const meta = parseBody(evidenceMetaSchema, {
        evidenceType: form.get("evidenceType"),
        title: form.get("title"),
        description: form.get("description") ?? "",
        location: form.get("location") ?? "",
        facilityId: form.get("facilityId") || null,
        eventId: form.get("eventId") || null,
        capturedAt: form.get("capturedAt") || null,
        isPublic: form.get("isPublic") === "true",
        isDemo: form.get("isDemo") === "true",
      });
      const shipmentId = String(form.get("shipmentId") ?? "");
      if (!/^[0-9a-f-]{36}$/i.test(shipmentId)) return jsonError(400, "invalid_input", "Choose a shipment.");
      const ids: string[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const stored = await readUpload(file);
        const filePath = await saveEvidenceFile(shipmentId, file.name || "evidence", stored);
        const id = await insertEvidence({
          shipmentId,
          eventId: meta.eventId,
          evidenceType: meta.evidenceType,
          title: files.length > 1 ? `${meta.title} (${index + 1})` : meta.title,
          description: meta.description,
          filePath,
          fileType: stored.fileType,
          fileSize: stored.fileSize,
          location: meta.location,
          facilityId: meta.facilityId,
          capturedAt: meta.capturedAt,
          uploadedBy: user.id,
          isPublic: meta.isPublic,
          isDemo: meta.isDemo,
        });
        ids.push(id);
        await audit({
          ...metaContext(request, user),
          action: "evidence_uploaded",
          resource: "shipment_evidence",
          resourceId: id,
          metadata: { shipmentId, public: meta.isPublic, type: meta.evidenceType, size: stored.fileSize },
        });
      }
      return jsonOk({ ids }, 201);
    }

    if (key === "facilities") {
      await guardMutation(request);
      const user = await actor(request, "facilities:write");
      const input = parseBody(facilitySchema, await body(request));
      const facility = await createFacility(input);
      await audit({ ...meta(request, user), action: "facility_created", resource: "facility", resourceId: facility.id, metadata: { demo: facility.isDemo } });
      return jsonOk({ facility }, 201);
    }

    if (key === "users") {
      await guardMutation(request);
      const user = await actor(request, "users:write");
      const input = parseBody(userSchema, await body(request));
      if (await findUserByEmail(input.email)) return jsonError(409, "duplicate_email", "An account with that email already exists.");
      let id: string | null = null;
      let provider: "local" | "supabase" = "local";
      let passwordHash: string | null = await hashPassword(input.password);
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        id = await createSupabaseUser(input.email, input.password, input.name);
        provider = "supabase";
        passwordHash = null;
      }
      await query(
        `insert into admin_users (id, email, name, role, auth_provider, password_hash, is_active)
         values (coalesce($1::uuid, gen_random_uuid()), $2, $3, $4, $5, $6, $7)`,
        [id, input.email.toLowerCase(), input.name, input.role, provider, passwordHash, input.isActive],
      );
      const created = await findUserByEmail(input.email);
      await audit({ ...meta(request, user), action: "user_created", resource: "user", resourceId: created?.id, metadata: { role: input.role } });
      return jsonOk({ ok: true }, 201);
    }

    if (key === "demo/purge") {
      await guardMutation(request);
      const user = await actor(request, "demo:purge");
      const input = await body(request);
      if (input?.confirm !== "DELETE DEMO DATA") {
        return jsonError(400, "confirm_required", "Type DELETE DEMO DATA to remove demonstration records.");
      }
      const files = await purgeDemo();
      for (const file of files) await deleteEvidenceFile(file);
      await audit({ ...meta(request, user), action: "demo_purged", resource: "demo", metadata: { files: files.length } });
      return jsonOk({ removedFiles: files.length });
    }

    return jsonError(404, "not_found", "Not found.");
  });
}

function metaContext(request: Request, user: StaffUser) {
  return meta(request, user);
}

export async function PATCH(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    await ensureReady();
    await guardMutation(request);
    const { path } = await context.params;

    if (path[0] === "shipments" && path[1] && path.length === 2) {
      const user = await actor(request, "shipments:write");
      const payload = await body(request);
      if (typeof payload.archived === "boolean" && Object.keys(payload).length === 1) {
        assertCan(user, "shipments:archive");
        const shipment = await setArchived(path[1], payload.archived);
        await audit({ ...meta(request, user), action: payload.archived ? "shipment_archived" : "shipment_restored", resource: "shipment", resourceId: shipment.id });
        return jsonOk({ shipment });
      }
      const input = parseBody(shipmentSchema, payload);
      const shipment = await updateShipment(path[1], { ...input, status: input.status as ShipmentStatus });
      await audit({ ...meta(request, user), action: "shipment_updated", resource: "shipment", resourceId: shipment.id, metadata: { status: shipment.status } });
      return jsonOk({ shipment });
    }

    if (path[0] === "evidence" && path[1] && path.length === 2) {
      const user = await actor(request, "evidence:write");
      const input = parseBody(evidenceMetaSchema, await body(request));
      const existing = await getEvidence(path[1]);
      if (!existing) return jsonError(404, "not_found", "Evidence not found.");
      if (existing.isPublic !== Boolean(input.isPublic)) assertCan(user, "evidence:visibility");
      const evidence = await updateEvidence(path[1], input);
      await audit({
        ...meta(request, user),
        action: existing.isPublic !== evidence.isPublic ? "evidence_visibility_changed" : "evidence_updated",
        resource: "shipment_evidence",
        resourceId: evidence.id,
        metadata: { public: evidence.isPublic },
      });
      return jsonOk({ evidence });
    }

    if (path[0] === "facilities" && path[1]) {
      const user = await actor(request, "facilities:write");
      const input = parseBody(facilitySchema, await body(request));
      const facility = await updateFacility(path[1], input);
      await audit({ ...meta(request, user), action: "facility_updated", resource: "facility", resourceId: facility.id });
      return jsonOk({ facility });
    }

    if (path[0] === "settings") {
      const user = await actor(request, "settings:write");
      const input = parseBody(settingsSchema, await body(request));
      const settings = await updateSettings(input);
      await audit({ ...meta(request, user), action: "settings_updated", resource: "settings", resourceId: "1" });
      return jsonOk({ settings });
    }

    if (path[0] === "users" && path[1]) {
      const user = await actor(request, "users:write");
      const input = parseBody(userPatchSchema, await body(request));
      const rows = await query<{ id: string; role: string; is_active: boolean; auth_provider: string; password_hash: string | null }>(
        "select id, role, is_active, auth_provider, password_hash from admin_users where id = $1",
        [path[1]],
      );
      const target = rows[0];
      if (!target) return jsonError(404, "not_found", "User not found.");
      const nextRole = input.role ?? target.role;
      const nextActive = input.isActive ?? target.is_active;
      if (target.role === "super_admin" && target.is_active && (nextRole !== "super_admin" || !nextActive)) {
        const remaining = await query<{ count: number }>(
          "select count(*)::int as count from admin_users where role = 'super_admin' and is_active = true and id <> $1",
          [target.id],
        );
        if ((remaining[0]?.count ?? 0) === 0) {
          return jsonError(400, "last_admin", "Keep at least one active super admin.");
        }
      }
      let passwordHash = target.password_hash;
      if (input.password) {
        if (target.auth_provider === "supabase") {
          await updateSupabasePassword(target.id, input.password);
        } else {
          passwordHash = await hashPassword(input.password);
        }
      }
      await query(
        "update admin_users set name = coalesce($2, name), role = $3, is_active = $4, password_hash = $5 where id = $1",
        [target.id, input.name ?? null, nextRole, nextActive, passwordHash],
      );
      if (input.password) {
        await query("update admin_sessions set revoked_at = now() where user_id = $1 and revoked_at is null", [target.id]);
      }
      await audit({ ...meta(request, user), action: "user_updated", resource: "user", resourceId: target.id, metadata: { role: nextRole, active: nextActive, passwordReset: Boolean(input.password) } });
      return jsonOk({ ok: true });
    }

    if (path[0] === "auth" && path[1] === "password") {
      await guardMutation(request);
      const user = await requireUser();
      const payload = await body(request);
      const password = String(payload.password ?? "");
      const current = String(payload.currentPassword ?? "");
      const parsed = userPatchSchema.pick({ password: true }).safeParse({ password });
      if (!parsed.success || !parsed.data.password) return jsonError(400, "invalid_input", "Use a stronger password.");
      const row = await findUserByEmail(user.email);
      if (!row || !(await verifyPassword(current, row.password_hash))) {
        if (row?.auth_provider === "supabase") {
          const ok = await verifyCredentials(user.email, current);
          if (!ok) return jsonError(401, "invalid_login", "The current password is incorrect.");
          await updateSupabasePassword(user.id, parsed.data.password);
        } else {
          return jsonError(401, "invalid_login", "The current password is incorrect.");
        }
      } else {
        await query("update admin_users set password_hash = $2 where id = $1", [user.id, await hashPassword(parsed.data.password)]);
      }
      await audit({ ...meta(request, user), action: "password_changed", resource: "user", resourceId: user.id });
      return jsonOk({ ok: true });
    }

    return jsonError(404, "not_found", "Not found.");
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ path: string[] }> }) {
  return handle(async () => {
    await ensureReady();
    await guardMutation(request);
    const { path } = await context.params;
    if (path[0] === "evidence" && path[1]) {
      const user = await actor(request, "evidence:delete");
      const filePath = await deleteEvidence(path[1]);
      await deleteEvidenceFile(filePath);
      await audit({ ...meta(request, user), action: "evidence_deleted", resource: "shipment_evidence", resourceId: path[1] });
      return jsonOk({ ok: true });
    }
    return jsonError(404, "not_found", "Not found.");
  });
}

async function updateSupabasePassword(id: string, password: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !service) return;
  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/admin/users/${id}`, {
    method: "PUT",
    headers: { apikey: service, authorization: `Bearer ${service}`, "content-type": "application/json" },
    body: JSON.stringify({ password }),
  });
  if (!response.ok) {
    throw new HttpError(502, "auth_provider", "Supabase Auth could not update the password.");
  }
}

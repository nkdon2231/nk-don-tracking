import { query } from "./db";
import type { StaffUser } from "./auth";

export async function audit(input: {
  actor?: Pick<StaffUser, "id" | "email"> | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const metadata = input.metadata ?? {};
  await query(
    `insert into admin_activity (actor_id, actor_email, action, resource, resource_id, ip, user_agent, metadata)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
    [
      input.actor?.id ?? null,
      input.actor?.email ?? null,
      input.action,
      input.resource,
      input.resourceId ?? null,
      input.ip ?? null,
      input.userAgent ?? null,
      JSON.stringify(metadata),
    ],
  );
}

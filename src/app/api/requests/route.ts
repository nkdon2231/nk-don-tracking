import { ensureReady } from "@/lib/db";
import { assertSameOrigin, clientIp, handle, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { parseBody, requestSchema } from "@/lib/validators";
import { createCustomerRequest } from "@/server/operations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    await ensureReady();
    await enforceRateLimit(`request:${clientIp(request)}`, 8, 3600);
    const input = parseBody(requestSchema, await request.json());
    const saved = await createCustomerRequest({ ...input, packageCount: input.packageCount ?? 1 });
    const message =
      saved.kind === "booking"
        ? "The pickup request is pending staff review. It is not a tracking number, and it does not confirm collection or a price. Email replies are not active yet."
        : "The quote request is pending staff review. NKDON has not calculated a price. Email replies are not active yet.";
    return jsonOk({ saved: true, kind: saved.kind, status: saved.status, message });
  });
}

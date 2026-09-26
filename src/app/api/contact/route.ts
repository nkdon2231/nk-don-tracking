import { ensureReady } from "@/lib/db";
import { assertSameOrigin, clientIp, handle, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { contactSchema, parseBody } from "@/lib/validators";
import { saveInquiry } from "@/server/operations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handle(async () => {
    assertSameOrigin(request);
    await ensureReady();
    await enforceRateLimit(`contact:${clientIp(request)}`, 8, 3600);
    const input = parseBody(contactSchema, await request.json());
    await saveInquiry(input);
    return jsonOk({
      saved: true,
      notification: "not_configured",
      message: "Your message has been recorded. Email delivery is not active yet, so the operations team will only see it in the admin record.",
    });
  });
}

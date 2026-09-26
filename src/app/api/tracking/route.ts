import { ensureReady } from "@/lib/db";
import { clientIp, handle, jsonError, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { trackingQuerySchema } from "@/lib/validators";
import { publicTracking } from "@/server/operations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`track:${clientIp(request)}`, 30, 600);
    const number = new URL(request.url).searchParams.get("number") ?? "";
    const parsed = trackingQuerySchema.safeParse({ trackingNumber: number });
    if (!parsed.success) {
      return jsonError(400, "invalid_tracking", "Enter a tracking number in the format NKD-YYYYMMDD-XXXX.");
    }
    const shipment = await publicTracking(parsed.data.trackingNumber);
    if (!shipment) return jsonError(404, "not_found", "Shipment not found.");
    return jsonOk({ shipment });
  });
}

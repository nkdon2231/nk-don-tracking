import { NextResponse } from "next/server";
import { barcodeSvg, qrSvg } from "@/lib/codes";
import { ensureReady } from "@/lib/db";
import { siteBase, clientIp, handle, jsonError } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { trackingQuerySchema } from "@/lib/validators";
import { publicTracking } from "@/server/operations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`track-code:${clientIp(request)}`, 60, 600);
    const url = new URL(request.url);
    const parsed = trackingQuerySchema.safeParse({ trackingNumber: url.searchParams.get("number") ?? "" });
    if (!parsed.success) return jsonError(400, "invalid_tracking", "Enter a tracking number in the format NKD-YYYYMMDD-XXXX.");
    const shipment = await publicTracking(parsed.data.trackingNumber);
    if (!shipment) return jsonError(404, "not_found", "Shipment not found.");
    const kind = url.searchParams.get("kind") === "barcode" ? "barcode" : "qr";
    const svg =
      kind === "barcode"
        ? barcodeSvg(shipment.trackingNumber)
        : await qrSvg(`${siteBase(request)}/proof?number=${encodeURIComponent(shipment.trackingNumber)}`);
    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml; charset=utf-8",
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  });
}

import { NextResponse } from "next/server";
import { ensureReady } from "@/lib/db";
import { clientIp, handle, jsonError } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { trackingQuerySchema } from "@/lib/validators";
import { buildProofPdf } from "@/server/proof-pdf";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`track-proof:${clientIp(request)}`, 20, 600);
    const number = new URL(request.url).searchParams.get("number") ?? "";
    const parsed = trackingQuerySchema.safeParse({ trackingNumber: number });
    if (!parsed.success) return jsonError(400, "invalid_tracking", "Enter a tracking number in the format NKD-YYYYMMDD-XXXX.");
    const pdf = await buildProofPdf(parsed.data.trackingNumber);
    if (!pdf) return jsonError(404, "not_found", "Shipment not found.");
    const filename = `${parsed.data.trackingNumber}-proof.pdf`;
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "content-type": "application/pdf",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  });
}

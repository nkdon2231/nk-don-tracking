import { NextResponse } from "next/server";
import { ensureReady } from "@/lib/db";
import { readEvidenceFile } from "@/lib/files";
import { handle, jsonError } from "@/lib/http";
import { enforceRateLimit, } from "@/lib/rate-limit";
import { clientIp } from "@/lib/http";
import { getPublicEvidence } from "@/server/operations";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ token: string }> }) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`evidence:${clientIp(request)}`, 60, 600);
    const { token } = await context.params;
    if (!/^[a-f0-9]{40}$/i.test(token)) return jsonError(404, "not_found", "File not found.");
    const evidence = await getPublicEvidence(token);
    if (!evidence) return jsonError(404, "not_found", "File not found.");
    const bytes = await readEvidenceFile(evidence.filePath);
    const filename = evidence.title.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "evidence";
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "content-type": evidence.fileType,
        "content-length": String(bytes.length),
        "content-disposition": `inline; filename="${filename}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  });
}

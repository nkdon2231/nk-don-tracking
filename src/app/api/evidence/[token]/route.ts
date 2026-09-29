import { ensureReady } from "@/lib/db";
import { bytesResponse } from "@/lib/file-response";
import { readEvidenceFile } from "@/lib/files";
import { handle, jsonError, clientIp } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
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
    const download = new URL(request.url).searchParams.get("download") === "1";
    return bytesResponse(request, bytes, evidence.fileType, evidence.title, download);
  });
}

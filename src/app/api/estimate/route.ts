import { ensureReady } from "@/lib/db";
import { clientIp, handle, jsonOk } from "@/lib/http";
import { enforceRateLimit } from "@/lib/rate-limit";
import { estimateQuerySchema, parseBody } from "@/lib/validators";
import { estimateTransit } from "@/server/operations";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handle(async () => {
    await ensureReady();
    await enforceRateLimit(`estimate:${clientIp(request)}`, 30, 600);
    const input = parseBody(estimateQuerySchema, await request.json());
    return jsonOk(await estimateTransit(input));
  });
}

import { query } from "./db";
import { HttpError } from "./http";

export async function enforceRateLimit(key: string, limit: number, windowSeconds: number) {
  const rows = await query<{ allowed: boolean; hits: number }>(
    `insert into rate_limits (bucket_key, hits, window_start)
     values ($1, 1, now())
     on conflict (bucket_key) do update
       set hits = case
         when rate_limits.window_start < now() - make_interval(secs => $3::int) then 1
         else rate_limits.hits + 1
       end,
       window_start = case
         when rate_limits.window_start < now() - make_interval(secs => $3::int) then now()
         else rate_limits.window_start
       end
     returning (hits <= $2) as allowed, hits`,
    [key, limit, windowSeconds],
  );
  if (!rows[0]?.allowed) {
    throw new HttpError(429, "rate_limited", "Too many requests. Please wait a moment and try again.");
  }
}

import { NextResponse } from "next/server";

export class HttpError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function jsonError(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export async function handle(fn: () => Promise<Response>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof HttpError) {
      return jsonError(error.status, error.code, error.message);
    }
    console.error("[nkdon]", error);
    return jsonError(500, "internal_error", "Something went wrong. Please try again.");
  }
}

export function clientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim().slice(0, 80) || "unknown";
  return req.headers.get("x-real-ip")?.slice(0, 80) || "unknown";
}

export function userAgent(req: Request) {
  return (req.headers.get("user-agent") || "").slice(0, 300);
}

export function assertSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  if (!origin || !host) {
    throw new HttpError(403, "forbidden", "This action must be sent from the NKDON site.");
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    throw new HttpError(403, "forbidden", "This action must be sent from the NKDON site.");
  }
  if (originHost !== host) {
    throw new HttpError(403, "forbidden", "Cross-origin request blocked.");
  }
}

export function assertCsrf(req: Request) {
  assertSameOrigin(req);
  const cookie = readCookie(req, "nkdon_csrf");
  const header = req.headers.get("x-csrf-token");
  if (!cookie || !header || cookie.length < 32 || cookie !== header) {
    throw new HttpError(403, "csrf", "The security token was missing or expired. Refresh the page and try again.");
  }
}

export function readCookie(req: Request, name: string) {
  const raw = req.headers.get("cookie");
  if (!raw) return "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

export function siteBase(req?: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (!req) return "";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const proto = req.headers.get("x-forwarded-proto") || "http";
  if (!host) return "";
  return `${proto}://${host}`;
}

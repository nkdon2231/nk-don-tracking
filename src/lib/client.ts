export class ApiError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function csrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|; )nkdon_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  const isForm = typeof FormData !== "undefined" && init.body instanceof FormData;
  if (!isForm && init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (method !== "GET" && method !== "HEAD") {
    headers.set("x-csrf-token", csrfToken());
  }
  const response = await fetch(path, { ...init, headers, credentials: "include" });
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as { error?: { code?: string; message?: string } } & T;
    if (!response.ok) {
      throw new ApiError(response.status, payload.error?.code ?? "error", payload.error?.message ?? "Request failed.");
    }
    return payload;
  }
  if (!response.ok) {
    throw new ApiError(response.status, "error", "Request failed.");
  }
  return undefined as T;
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "super_admin" | "admin" | "operations" | "support" | "viewer";
  isActive: boolean;
  authProvider: "local" | "supabase";
};

export type SessionPayload = {
  user: SessionUser | null;
  database: string;
  storage: string;
  notifications: unknown;
};

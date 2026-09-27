"use client";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function csrf() {
  const match = document.cookie.match(/(?:^|; )nkdon_csrf=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  if (method !== "GET" && method !== "HEAD") headers.set("x-csrf-token", csrf());
  const response = await fetch(path, { ...init, headers, credentials: "same-origin" });
  const data = (await response.json().catch(() => ({}))) as { error?: { message?: string } };
  if (!response.ok) {
    throw new ApiError(response.status, data.error?.message || "The request could not be completed.");
  }
  return data as T;
}

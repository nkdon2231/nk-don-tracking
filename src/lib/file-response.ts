import { NextResponse } from "next/server";

export function bytesResponse(request: Request, bytes: Buffer, fileType: string, filename: string, download: boolean) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80) || "evidence";
  const headers: Record<string, string> = {
    "content-type": fileType,
    "content-disposition": `${download ? "attachment" : "inline"}; filename="${safe}"`,
    "cache-control": "private, no-store",
    "x-content-type-options": "nosniff",
  };
  if (!fileType.startsWith("video/")) {
    headers["content-length"] = String(bytes.length);
    return new NextResponse(new Uint8Array(bytes), { headers });
  }
  headers["accept-ranges"] = "bytes";
  const range = request.headers.get("range");
  if (!range) {
    headers["content-length"] = String(bytes.length);
    return new NextResponse(new Uint8Array(bytes), { headers });
  }
  const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
  if (!match) {
    return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${bytes.length}` } });
  }
  let start = match[1] ? Number(match[1]) : 0;
  let end = match[2] ? Number(match[2]) : bytes.length - 1;
  if (!match[1] && match[2]) {
    const suffix = Number(match[2]);
    start = Math.max(0, bytes.length - suffix);
    end = bytes.length - 1;
  }
  if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end >= bytes.length || start > end) {
    return new NextResponse(null, { status: 416, headers: { "content-range": `bytes */${bytes.length}` } });
  }
  const slice = bytes.subarray(start, end + 1);
  headers["content-length"] = String(slice.length);
  headers["content-range"] = `bytes ${start}-${end}/${bytes.length}`;
  return new NextResponse(new Uint8Array(slice), { status: 206, headers });
}

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { storageMode } from "./db";
import { IMAGE_MAX_BYTES, PDF_MAX_BYTES } from "./constants";
import { HttpError } from "./http";

export type StoredFile = {
  filePath: string;
  fileType: string;
  fileSize: number;
  bytes: Buffer;
};

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export function detectFileType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (bytes.length >= 12 && bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp";
  }
  if (bytes.length >= 5 && bytes.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  return null;
}

export function safeObjectName(original: string) {
  const base = (original.split(/[/\\]/).pop() || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 60);
  return `${crypto.randomUUID()}-${base || "file"}`;
}

export async function readUpload(file: File): Promise<StoredFile> {
  if (!(file instanceof File) || file.size <= 0) {
    throw new HttpError(400, "invalid_file", "Choose a file to upload.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const detected = detectFileType(bytes);
  if (!detected || !ALLOWED.has(detected)) {
    throw new HttpError(400, "invalid_file", "Only JPG, PNG, WEBP, and PDF files are accepted.");
  }
  const limit = detected === "application/pdf" ? PDF_MAX_BYTES : IMAGE_MAX_BYTES;
  if (bytes.length > limit) {
    throw new HttpError(400, "file_too_large", detected === "application/pdf" ? "PDFs must be 20 MB or smaller." : "Images must be 10 MB or smaller.");
  }
  return { filePath: "", fileType: detected, fileSize: bytes.length, bytes };
}

function localRoot() {
  return path.join(process.cwd(), ".data", "evidence");
}

export async function saveEvidenceFile(shipmentId: string, originalName: string, file: StoredFile) {
  const objectName = safeObjectName(originalName);
  const relative = path.posix.join("shipments", shipmentId, "evidence", objectName);
  if (relative.includes("..")) throw new HttpError(400, "invalid_file", "Invalid file path.");
  const mode = storageMode();
  if (mode === "supabase") {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.storage.from("shipment-evidence").upload(relative, file.bytes, {
      contentType: file.fileType,
      upsert: false,
    });
    if (error) {
      console.error("[nkdon] storage upload", error.message);
      throw new HttpError(502, "storage_error", "The file could not be stored. Check Supabase Storage and try again.");
    }
    return relative;
  }
  if (mode === "unconfigured") {
    throw new HttpError(503, "storage_unconfigured", "Supabase Storage is not configured. Set the Supabase URL and service role key.");
  }
  const absolute = path.join(localRoot(), relative);
  if (!absolute.startsWith(localRoot())) throw new HttpError(400, "invalid_file", "Invalid file path.");
  await mkdir(path.dirname(absolute), { recursive: true });
  await writeFile(absolute, file.bytes);
  return relative;
}

export async function readEvidenceFile(filePath: string) {
  if (!filePath || filePath.includes("..")) throw new HttpError(404, "not_found", "File not found.");
  const mode = storageMode();
  if (mode === "supabase") {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error } = await supabase.storage.from("shipment-evidence").download(filePath);
    if (error || !data) throw new HttpError(404, "not_found", "File not found.");
    return Buffer.from(await data.arrayBuffer());
  }
  if (mode !== "local-preview") throw new HttpError(404, "not_found", "File not found.");
  const absolute = path.join(localRoot(), filePath);
  if (!absolute.startsWith(localRoot())) throw new HttpError(404, "not_found", "File not found.");
  try {
    return await readFile(absolute);
  } catch {
    throw new HttpError(404, "not_found", "File not found.");
  }
}

export async function deleteEvidenceFile(filePath: string) {
  if (!filePath || filePath.includes("..")) return;
  const mode = storageMode();
  if (mode === "supabase") {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    await supabase.storage.from("shipment-evidence").remove([filePath]);
    return;
  }
  if (mode !== "local-preview") return;
  const absolute = path.join(localRoot(), filePath);
  if (!absolute.startsWith(localRoot())) return;
  await rm(absolute, { force: true });
}

export async function ensureStorageBucket() {
  if (storageMode() !== "supabase") return;
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await supabase.storage.createBucket("shipment-evidence", {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  });
  if (error && !/already exists/i.test(error.message)) {
    console.error("[nkdon] bucket", error.message);
  }
}

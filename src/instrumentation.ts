export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { ensureReady } = await import("@/lib/db");
  const { ensureStorageBucket } = await import("@/lib/files");
  try {
    await ensureReady();
    await ensureStorageBucket();
  } catch (error) {
    console.error("[nkdon] startup", error);
  }
}

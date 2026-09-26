export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { ensureReady } = await import("@/lib/db");
    const { ensureStorageBucket } = await import("@/lib/files");
    try {
      await ensureReady();
      await ensureStorageBucket();
    } catch (error) {
      console.error("[nkdon] startup failed");
      console.error(error instanceof Error ? error.name : "error");
    }
  }
}

const FALLBACK_ORIGIN = "https://nk-don-tracking.vercel.app";

// Public origin for canonical URLs, the sitemap, and robots.
// Preview hostnames are ignored so Google does not index a deployment URL.
export function publicOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (raw) {
    const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    try {
      const url = new URL(candidate);
      if ((url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password && url.hostname.includes(".")) {
        return url.origin;
      }
    } catch {
      // Fall through to the live Vercel hostname.
    }
  }
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (production && production.includes(".") && !/localhost|127\.0\.0\.1/i.test(production)) {
    return `https://${production}`;
  }
  return FALLBACK_ORIGIN;
}

export function googleSiteVerification() {
  // Dynamic keys stay server-side. Next inlines only static process.env.NEXT_PUBLIC_* reads,
  // and a Sensitive Vercel value would otherwise be stripped from the HTML tag.
  const token = String(
    process.env["NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION"] || process.env["GOOGLE_SITE_VERIFICATION"] || "",
  ).trim();
  return /^[A-Za-z0-9_-]{8,200}$/.test(token) ? token : "";
}

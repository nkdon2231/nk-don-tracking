import type { MetadataRoute } from "next";
import { SERVICES } from "@/lib/site-content";
import { publicOrigin } from "@/lib/site-url";

const PUBLIC_PATHS = [
  "/",
  "/about",
  "/services",
  "/solutions",
  "/quote",
  "/book",
  "/estimate",
  "/track",
  "/proof",
  "/support",
  "/support/tracking",
  "/faq",
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = publicOrigin();
  const now = new Date();
  const pages = PUBLIC_PATHS.map((path) => ({
    url: new URL(path, origin).href,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: path === "/" ? 1 : 0.7,
  }));
  const services = SERVICES.map((service) => ({
    url: new URL(`/services/${service.value}`, origin).href,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));
  return [...pages, ...services];
}

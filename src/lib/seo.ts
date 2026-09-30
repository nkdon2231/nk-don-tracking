import type { Metadata } from "next";
import { BRAND } from "./constants";
import { publicOrigin } from "./site-url";

export function pageMeta({
  title,
  description,
  path,
  absolute = false,
}: {
  title: string;
  description: string;
  path: string;
  absolute?: boolean;
}): Metadata {
  const canonical = new URL(path, publicOrigin()).href;
  return {
    title: absolute ? { absolute: title } : title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: BRAND.name,
      type: "website",
    },
    robots: { index: true, follow: true },
  };
}

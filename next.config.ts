import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    "*": ["./supabase/migrations/**/*"],
  },
  serverExternalPackages: ["pg", "@electric-sql/pglite"],
  poweredByHeader: false,
  reactStrictMode: true,
  images: { unoptimized: true },
  webpack: (config, { dev }) => {
    if (!dev) config.cache = false;
    return config;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;

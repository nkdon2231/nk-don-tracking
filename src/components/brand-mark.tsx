import { BRAND } from "@/lib/constants";

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" fill="#0c1218" />
      <path d="M18 8.2c-5.4 0-9.2 3.9-9.2 9.6S12.6 27.4 18 27.4s9.2-3.9 9.2-9.6S23.4 8.2 18 8.2Z" fill="none" stroke="#f3efe6" strokeWidth="1.15" />
      <path d="M22.2 21.6c1 1.3 2.3 2.6 3.8 3.6" fill="none" stroke="#f3efe6" strokeWidth="1.15" strokeLinecap="square" />
    </svg>
  );
}

export function BrandLockup({
  compact = false,
  tone = "mono",
}: {
  compact?: boolean;
  tone?: "mono" | "gold";
}) {
  return (
    <span className={`brand-lockup${tone === "gold" ? " is-gold" : ""}`}>
      <span className="brand-name">{BRAND.short}</span>
      {compact ? null : <span className="brand-sub">International Courier & Express</span>}
    </span>
  );
}

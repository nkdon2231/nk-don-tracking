import { BRAND } from "@/lib/constants";

export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="8" fill="#071422" />
      <circle cx="16.2" cy="16.2" r="8.2" fill="none" stroke="#e6c98a" strokeWidth="2.15" />
      <path d="M21.6 21.6 28.2 28.4" fill="none" stroke="#e6c98a" strokeWidth="2.15" strokeLinecap="round" />
      <circle cx="26.6" cy="9.2" r="1.55" fill="#9fd4cf" />
    </svg>
  );
}

export function BrandLockup({
  subtitle = "Courier & Express",
  compact = false,
}: {
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <span className="brand-lockup">
      <BrandMark className={compact ? "h-8 w-8" : "h-9 w-9"} />
      <span>
        <span className="brand-name">{BRAND.short}</span>
        {compact ? null : <span className="brand-sub">{subtitle}</span>}
      </span>
    </span>
  );
}

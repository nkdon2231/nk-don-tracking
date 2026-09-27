export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 36 36" aria-hidden="true">
      <rect width="36" height="36" rx="9" fill="#10263a" />
      <path d="M6.5 23.5c6.2-1.2 8.2-8.4 11.5-8.4 2.8 0 3.6 5.6 11.5 4.4" fill="none" stroke="#3ec6c0" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M6.5 18.2c6.2-1.2 8.2-8.2 11.5-8.2 2.8 0 3.6 5.4 11.5 4.2" fill="none" stroke="#ffb703" strokeWidth="2.15" strokeLinecap="round" />
      <circle cx="28.2" cy="14.2" r="2.15" fill="#ffb703" />
    </svg>
  );
}

export function BrandLockup({
  subtitle = "Global Logistics",
  compact = false,
}: {
  subtitle?: string;
  compact?: boolean;
}) {
  return (
    <span className="brand-lockup">
      <BrandMark className={compact ? "h-8 w-8" : "h-9 w-9"} />
      <span>
        <span className="brand-name">NKDON</span>
        {compact ? null : <span className="brand-sub">{subtitle}</span>}
      </span>
    </span>
  );
}

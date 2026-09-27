import type { ReactNode } from "react";

export const PASSWORD_HINT = "At least 12 characters, with an uppercase letter, a lowercase letter, and a number.";

export function Banner({ tone = "warn", children }: { tone?: "warn" | "ok" | "muted"; children: ReactNode }) {
  const toneClass =
    tone === "ok"
      ? "border-[#1d6b62] bg-[#0e2a28] text-[#b7f3ee]"
      : tone === "muted"
        ? "border-[var(--color-line)] bg-[var(--color-panel)] text-[var(--color-muted)]"
        : "border-[#8a4a32] bg-[#2a1814] text-[#ffd0c2]";
  return <p className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${toneClass}`}>{children}</p>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card px-5 py-8 text-center">
      <p className="serif text-2xl">{title}</p>
      {children ? <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[var(--color-muted)]">{children}</p> : null}
    </div>
  );
}

export function localInputNow() {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function toIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toISOString();
}

export function readText(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}
